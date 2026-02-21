import os
import re
import uuid
import json
from datetime import datetime
from flask import Flask, request, jsonify
from flask_cors import CORS
from dotenv import load_dotenv

load_dotenv()

app = Flask(__name__)
CORS(app, origins=["*"])

# ============================================================
# 외부 서비스 클라이언트
# ============================================================

# Claude AI
anthropic_client = None
ANTHROPIC_API_KEY = os.getenv("ANTHROPIC_API_KEY")
if ANTHROPIC_API_KEY:
    import anthropic
    anthropic_client = anthropic.Anthropic(api_key=ANTHROPIC_API_KEY)

# Supabase
supabase_client = None
SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY") or os.getenv("SUPABASE_KEY")
if SUPABASE_URL and SUPABASE_KEY:
    from supabase import create_client
    supabase_client = create_client(SUPABASE_URL, SUPABASE_KEY)


# ============================================================
# DB 헬퍼 (Supabase 또는 인메모리 폴백)
# ============================================================

_memory_store = {}


def db_save_project(project: dict):
    """프로젝트 저장"""
    if supabase_client:
        row = {
            "id": project["id"],
            "status": project["status"],
            "video_urls": project.get("video_urls", []),
            "analyzed_videos": json.dumps(project.get("videos"), ensure_ascii=False) if project.get("videos") else None,
            "topics": json.dumps(project.get("topics"), ensure_ascii=False) if project.get("topics") else None,
            "selected_topic_id": project.get("selected_topic_id"),
            "generated_content": json.dumps(project.get("generated_content"), ensure_ascii=False) if project.get("generated_content") else None,
        }
        supabase_client.table("projects").upsert(row).execute()
    else:
        _memory_store[project["id"]] = project


def db_get_project(project_id: str) -> dict | None:
    """프로젝트 조회"""
    if supabase_client:
        res = supabase_client.table("projects").select("*").eq("id", project_id).execute()
        if res.data:
            row = res.data[0]
            return {
                "id": row["id"],
                "status": row["status"],
                "video_urls": row.get("video_urls", []),
                "videos": json.loads(row["analyzed_videos"]) if row.get("analyzed_videos") else [],
                "topics": json.loads(row["topics"]) if row.get("topics") else [],
                "selected_topic_id": row.get("selected_topic_id"),
                "generated_content": json.loads(row["generated_content"]) if row.get("generated_content") else None,
                "created_at": row.get("created_at"),
            }
        return None
    else:
        return _memory_store.get(project_id)


def db_update_project(project_id: str, updates: dict):
    """프로젝트 부분 업데이트"""
    if supabase_client:
        row = {}
        if "status" in updates:
            row["status"] = updates["status"]
        if "topics" in updates:
            row["topics"] = json.dumps(updates["topics"], ensure_ascii=False)
        if "selected_topic_id" in updates:
            row["selected_topic_id"] = updates["selected_topic_id"]
        if "generated_content" in updates:
            row["generated_content"] = json.dumps(updates["generated_content"], ensure_ascii=False)
        if row:
            supabase_client.table("projects").update(row).eq("id", project_id).execute()
    else:
        project = _memory_store.get(project_id)
        if project:
            project.update(updates)


# ============================================================
# YouTube 유틸리티
# ============================================================

def extract_video_id(url: str) -> str | None:
    """YouTube URL에서 video ID 추출"""
    patterns = [
        r'(?:youtube\.com\/watch\?v=)([a-zA-Z0-9_-]{11})',
        r'(?:youtu\.be\/)([a-zA-Z0-9_-]{11})',
        r'(?:youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})',
        r'(?:youtube\.com\/shorts\/)([a-zA-Z0-9_-]{11})',
    ]
    for pattern in patterns:
        match = re.search(pattern, url)
        if match:
            return match.group(1)
    return None


def get_video_info(video_id: str) -> dict:
    """YouTube Data API로 영상 정보 가져오기"""
    api_key = os.getenv("YOUTUBE_API_KEY")

    if not api_key:
        return {
            "id": video_id,
            "title": f"영상 ({video_id})",
            "thumbnail": f"https://img.youtube.com/vi/{video_id}/maxresdefault.jpg",
            "channelName": "채널명",
            "viewCount": 0,
            "publishedAt": datetime.now().isoformat(),
            "duration": "00:00",
            "description": "",
        }

    try:
        from googleapiclient.discovery import build
        youtube = build("youtube", "v3", developerKey=api_key)

        response = youtube.videos().list(
            part="snippet,statistics,contentDetails",
            id=video_id
        ).execute()

        if not response.get("items"):
            return None

        item = response["items"][0]
        snippet = item["snippet"]
        stats = item.get("statistics", {})
        content = item.get("contentDetails", {})

        return {
            "id": video_id,
            "title": snippet.get("title", ""),
            "thumbnail": f"https://img.youtube.com/vi/{video_id}/maxresdefault.jpg",
            "channelName": snippet.get("channelTitle", ""),
            "viewCount": int(stats.get("viewCount", 0)),
            "publishedAt": snippet.get("publishedAt", ""),
            "duration": content.get("duration", ""),
            "description": snippet.get("description", ""),
        }
    except Exception as e:
        print(f"YouTube API 오류: {e}")
        return {
            "id": video_id,
            "title": f"영상 ({video_id})",
            "thumbnail": f"https://img.youtube.com/vi/{video_id}/maxresdefault.jpg",
            "channelName": "채널명",
            "viewCount": 0,
            "publishedAt": datetime.now().isoformat(),
            "duration": "00:00",
            "description": "",
        }


def get_transcript(video_id: str) -> str:
    """YouTube 자막/대본 추출 (인트로~5분)"""
    try:
        from youtube_transcript_api import YouTubeTranscriptApi

        transcript_list = YouTubeTranscriptApi.list_transcripts(video_id)

        transcript = None
        for lang in ["ko", "en"]:
            try:
                transcript = transcript_list.find_transcript([lang])
                break
            except Exception:
                continue

        if not transcript:
            transcript = transcript_list.find_generated_transcript(["ko", "en"])

        if not transcript:
            return "자막을 찾을 수 없습니다."

        fetched = transcript.fetch()

        # 첫 5분(300초)까지만 추출
        texts = []
        for entry in fetched:
            if entry["start"] > 300:
                break
            texts.append(entry["text"])

        return " ".join(texts)

    except Exception as e:
        print(f"자막 추출 오류 ({video_id}): {e}")
        return "자막을 추출할 수 없습니다."


def calc_view_ratios(videos: list[dict]) -> list[dict]:
    """최근 영상 대비 조회수 비율 계산

    요구사항: '제일 최근꺼 대비 조회수 높은거 순서'
    → 가장 최근 업로드된 영상의 조회수를 기준(1.0)으로 나머지 영상의 비율 산출
    """
    if not videos:
        return videos

    # publishedAt 기준 가장 최근 영상 찾기
    sorted_by_date = sorted(
        videos,
        key=lambda v: v.get("publishedAt", ""),
        reverse=True,
    )
    latest_views = sorted_by_date[0]["viewCount"] or 1

    for v in videos:
        v["viewRatio"] = round(v["viewCount"] / latest_views, 2)

    # 조회수 높은 순 정렬
    videos.sort(key=lambda x: x["viewCount"], reverse=True)
    return videos


# ============================================================
# AI 분석 (Claude API)
# ============================================================

def analyze_with_ai(videos: list[dict], exclude_topics: list[str] | None = None) -> list[dict]:
    """Claude AI로 영상 분석 후 주제 3개 추천"""

    if not anthropic_client:
        return _fallback_analyze(videos)

    # 영상 데이터를 프롬프트용으로 정리
    video_summaries = []
    for i, v in enumerate(videos, 1):
        transcript_preview = v.get("transcript", "")[:1500]
        video_summaries.append(
            f"[영상 {i}]\n"
            f"- 제목: {v['title']}\n"
            f"- 채널: {v['channelName']}\n"
            f"- 조회수: {v['viewCount']:,}회\n"
            f"- 최근 영상 대비 조회수 비율: {v.get('viewRatio', 1.0)}배\n"
            f"- 업로드: {v['publishedAt']}\n"
            f"- 인트로~5분 대본:\n{transcript_preview}"
        )

    video_block = "\n\n".join(video_summaries)

    exclude_instruction = ""
    if exclude_topics:
        exclude_instruction = (
            f"\n\n중요: 이전에 이미 추천했던 아래 주제들은 제외하고 새로운 주제를 추천해주세요:\n"
            + "\n".join(f"- {t}" for t in exclude_topics)
        )

    prompt = f"""당신은 YouTube 콘텐츠 전략 전문가입니다.
아래 레퍼런스 영상들을 분석하여, 이 영상들을 카피(벤치마킹)해서 만들 수 있는 새 영상 주제를 정확히 3개 추천해주세요.

분석 기준:
1. 조회수가 높은 영상의 공통 키워드, 주제, 화법을 파악
2. 최근 영상 대비 조회수 비율이 높은 영상에 더 가중치 부여
3. 대본(인트로~5분)의 훅(hook), 스토리 구조, 시청자 반응 유도 방식 분석
4. 각 주제별로 구체적이고 실행 가능한 형태로 제시{exclude_instruction}

[레퍼런스 영상 데이터]
{video_block}

아래 JSON 배열 형식으로만 응답해주세요 (다른 텍스트 없이):
[
  {{
    "topic": "구체적인 영상 주제 (한 문장)",
    "target": "타겟 시청자층 (구체적으로)",
    "reasoning": "이 주제를 추천하는 이유 (레퍼런스 데이터 근거 포함, 2-3문장)",
    "confidence": 0~100 사이의 적중 확률
  }},
  ...
]"""

    try:
        message = anthropic_client.messages.create(
            model="claude-sonnet-4-20250514",
            max_tokens=2000,
            messages=[{"role": "user", "content": prompt}],
        )

        response_text = message.content[0].text.strip()

        # JSON 파싱 (마크다운 코드블록 제거)
        if response_text.startswith("```"):
            response_text = re.sub(r"^```(?:json)?\s*", "", response_text)
            response_text = re.sub(r"\s*```$", "", response_text)

        topics = json.loads(response_text)

        # ID 부여
        for t in topics:
            t["id"] = str(uuid.uuid4())

        return topics[:3]

    except Exception as e:
        print(f"Claude AI 분석 오류: {e}")
        return _fallback_analyze(videos)


def generate_with_ai(topic: dict, videos: list[dict]) -> dict:
    """Claude AI로 콘텐츠 생성 (썸네일 텍스트, 제목, 대본)"""

    if not anthropic_client:
        return _fallback_generate(topic)

    video_summaries = []
    for i, v in enumerate(videos[:5], 1):
        transcript_preview = v.get("transcript", "")[:1000]
        video_summaries.append(
            f"[영상 {i}] {v['title']} (조회수 {v['viewCount']:,}회)\n"
            f"대본 일부: {transcript_preview}"
        )

    video_block = "\n\n".join(video_summaries)

    prompt = f"""당신은 YouTube 콘텐츠 크리에이터이자 카피라이팅 전문가입니다.
아래 주제와 레퍼런스 영상 분석을 바탕으로 콘텐츠를 생성해주세요.

[선택된 주제]
- 주제: {topic['topic']}
- 타겟: {topic['target']}

[레퍼런스 영상 분석]
{video_block}

아래 JSON 형식으로만 응답해주세요 (다른 텍스트 없이):
{{
  "thumbnailTexts": [
    "썸네일 텍스트1 (5~10자, 강렬하고 클릭 유도하는 문구)",
    "썸네일 텍스트2",
    "썸네일 텍스트3"
  ],
  "titleSuggestions": [
    "제목1 (YouTube SEO를 고려하며 궁금증 유발, 40자 이내)",
    "제목2"
  ],
  "scripts": [
    {{
      "targetDescription": "타겟1 설명 (예: 20~30대 직장인, 효율 중심)",
      "intro": "인트로 대본 (시청자의 관심을 끄는 훅 → 문제 제기 → 영상 소개, 300~500자)",
      "body": "본문 대본을 4개 섹션으로 구성해주세요. 각 섹션은 [섹션 N: 제목] 형태로 시작하고, 실제 말할 내용을 구어체로 작성. 전체 1500~2500자"
    }},
    {{
      "targetDescription": "타겟2 설명 (첫 번째와 다른 타겟층)",
      "intro": "두 번째 타겟에 맞는 인트로 대본",
      "body": "두 번째 타겟에 맞는 본문 (동일하게 4개 섹션 구성)"
    }}
  ]
}}

중요 사항:
- 썸네일 텍스트는 짧고 강렬하게 (한글 기준 5~10자)
- 제목은 호기심을 자극하면서도 내용을 반영
- 대본은 실제 유튜버가 말하는 듯한 자연스러운 구어체로 작성
- 본문은 반드시 4개 섹션([섹션 1] ~ [섹션 4])으로 나누어 작성
- 두 대본은 각각 다른 타겟층에 맞춰 톤/어휘/예시를 다르게
- 레퍼런스 영상의 성공적인 화법과 구조를 참고하되 그대로 복사하지 말 것"""

    try:
        message = anthropic_client.messages.create(
            model="claude-sonnet-4-20250514",
            max_tokens=4000,
            messages=[{"role": "user", "content": prompt}],
        )

        response_text = message.content[0].text.strip()

        if response_text.startswith("```"):
            response_text = re.sub(r"^```(?:json)?\s*", "", response_text)
            response_text = re.sub(r"\s*```$", "", response_text)

        result = json.loads(response_text)

        # scripts에 id와 fullScript 추가
        for script in result.get("scripts", []):
            script["id"] = str(uuid.uuid4())
            script["fullScript"] = f"[인트로]\n{script['intro']}\n\n[본문]\n{script['body']}"

        return result

    except Exception as e:
        print(f"Claude AI 생성 오류: {e}")
        return _fallback_generate(topic)


# ============================================================
# AI 폴백 (API 키 없을 때)
# ============================================================

def _fallback_analyze(videos: list[dict]) -> list[dict]:
    """AI 없을 때 기본 주제 추천"""
    titles = ", ".join(v["title"] for v in videos[:3])
    return [
        {
            "id": str(uuid.uuid4()),
            "topic": f"레퍼런스 영상 기반 주제 추천 1",
            "target": "분석 대상 타겟층",
            "reasoning": f"레퍼런스 영상({titles})의 공통 키워드를 분석한 결과입니다. ANTHROPIC_API_KEY를 설정하면 AI 기반 정밀 분석이 제공됩니다.",
            "confidence": 50,
        },
        {
            "id": str(uuid.uuid4()),
            "topic": f"레퍼런스 영상 기반 주제 추천 2",
            "target": "분석 대상 타겟층",
            "reasoning": "AI API 키가 설정되지 않아 기본 추천을 제공합니다.",
            "confidence": 40,
        },
        {
            "id": str(uuid.uuid4()),
            "topic": f"레퍼런스 영상 기반 주제 추천 3",
            "target": "분석 대상 타겟층",
            "reasoning": "AI API 키가 설정되지 않아 기본 추천을 제공합니다.",
            "confidence": 30,
        },
    ]


def _fallback_generate(topic: dict) -> dict:
    """AI 없을 때 기본 콘텐츠 생성"""
    return {
        "thumbnailTexts": [
            "썸네일 텍스트 1 (AI 연결 필요)",
            "썸네일 텍스트 2 (AI 연결 필요)",
            "썸네일 텍스트 3 (AI 연결 필요)",
        ],
        "titleSuggestions": [
            "제목 추천 1 (ANTHROPIC_API_KEY 설정 필요)",
            "제목 추천 2 (ANTHROPIC_API_KEY 설정 필요)",
        ],
        "scripts": [
            {
                "id": str(uuid.uuid4()),
                "targetDescription": topic.get("target", "일반 타겟"),
                "intro": "AI API 키가 설정되면 인트로 대본이 자동 생성됩니다.",
                "body": "[섹션 1: 도입]\nAI 연결 후 자동 생성\n\n[섹션 2: 전개]\nAI 연결 후 자동 생성\n\n[섹션 3: 심화]\nAI 연결 후 자동 생성\n\n[섹션 4: 마무리]\nAI 연결 후 자동 생성",
                "fullScript": "AI API 키가 설정되면 전체 대본이 자동 생성됩니다.",
            },
            {
                "id": str(uuid.uuid4()),
                "targetDescription": "보조 타겟층",
                "intro": "AI API 키가 설정되면 두 번째 인트로 대본이 자동 생성됩니다.",
                "body": "[섹션 1: 도입]\nAI 연결 후 자동 생성\n\n[섹션 2: 전개]\nAI 연결 후 자동 생성\n\n[섹션 3: 심화]\nAI 연결 후 자동 생성\n\n[섹션 4: 마무리]\nAI 연결 후 자동 생성",
                "fullScript": "AI API 키가 설정되면 전체 대본이 자동 생성됩니다.",
            },
        ],
    }


# ============================================================
# API 엔드포인트
# ============================================================

@app.route("/api/health", methods=["GET"])
def health():
    return jsonify({
        "status": "ok",
        "ai_connected": anthropic_client is not None,
        "db_connected": supabase_client is not None,
        "timestamp": datetime.now().isoformat(),
    })


@app.route("/api/analyze", methods=["POST"])
def analyze():
    """영상 분석 API"""
    data = request.get_json()
    video_urls = data.get("video_urls", [])

    if len(video_urls) < 3:
        return jsonify({"error": "최소 3개의 영상 URL이 필요합니다"}), 400

    # 영상 정보 수집
    videos = []
    for url in video_urls:
        video_id = extract_video_id(url)
        if not video_id:
            continue

        info = get_video_info(video_id)
        if not info:
            continue

        transcript = get_transcript(video_id)

        videos.append({
            **info,
            "url": url,
            "transcript": transcript,
            "viewRatio": 1.0,
        })

    if not videos:
        return jsonify({"error": "유효한 영상을 찾을 수 없습니다"}), 400

    # 최근 영상 대비 조회수 비율 계산 + 정렬
    videos = calc_view_ratios(videos)

    # AI 분석으로 주제 추천
    topics = analyze_with_ai(videos)

    # DB 저장
    analysis_id = str(uuid.uuid4())
    project = {
        "id": analysis_id,
        "created_at": datetime.now().isoformat(),
        "video_urls": video_urls,
        "videos": videos,
        "topics": topics,
        "status": "topics_ready",
    }
    db_save_project(project)

    return jsonify({
        "analysis_id": analysis_id,
        "videos": videos,
        "topics": topics,
    })


@app.route("/api/retry-topics", methods=["POST"])
def retry_topics():
    """주제 다시 추천받기 API"""
    data = request.get_json()
    analysis_id = data.get("analysis_id")
    previous_topics = data.get("previous_topics", [])

    project = db_get_project(analysis_id)
    if not project:
        return jsonify({"error": "프로젝트를 찾을 수 없습니다"}), 404

    # 이전 추천 주제명 추출 (중복 방지)
    exclude_topics = [t.get("topic", "") for t in previous_topics if t.get("topic")]

    # AI로 새로운 주제 추천 (이전 주제 제외)
    new_topics = analyze_with_ai(project["videos"], exclude_topics=exclude_topics)

    # DB 업데이트
    db_update_project(analysis_id, {
        "topics": new_topics,
        "status": "topics_ready",
    })

    return jsonify({
        "analysis_id": analysis_id,
        "topics": new_topics,
    })


@app.route("/api/generate", methods=["POST"])
def generate():
    """콘텐츠 생성 API"""
    data = request.get_json()
    analysis_id = data.get("analysis_id")
    selected_topic_id = data.get("selected_topic_id")

    project = db_get_project(analysis_id)
    if not project:
        return jsonify({"error": "프로젝트를 찾을 수 없습니다"}), 404

    # 선택된 주제 찾기
    selected_topic = None
    for topic in project["topics"]:
        if topic["id"] == selected_topic_id:
            selected_topic = topic
            break

    if not selected_topic:
        return jsonify({"error": "선택된 주제를 찾을 수 없습니다"}), 404

    # AI로 콘텐츠 생성
    result = generate_with_ai(selected_topic, project["videos"])

    generated = {
        "id": str(uuid.uuid4()),
        "analysisId": analysis_id,
        "selectedTopic": selected_topic,
        **result,
    }

    # DB 업데이트
    db_update_project(analysis_id, {
        "status": "complete",
        "selected_topic_id": selected_topic_id,
        "generated_content": generated,
    })

    return jsonify(generated)


@app.route("/api/project/<project_id>", methods=["GET"])
def get_project(project_id):
    """프로젝트 상태 조회"""
    project = db_get_project(project_id)
    if not project:
        return jsonify({"error": "프로젝트를 찾을 수 없습니다"}), 404
    return jsonify(project)


# ============================================================
# 실행
# ============================================================

if __name__ == "__main__":
    port = int(os.getenv("PORT", 5000))
    print(f"서버 시작: http://0.0.0.0:{port}")
    print(f"  AI 연동: {'활성' if anthropic_client else '비활성 (ANTHROPIC_API_KEY 필요)'}")
    print(f"  DB 연동: {'활성' if supabase_client else '비활성 (인메모리 모드)'}")
    app.run(host="0.0.0.0", port=port, debug=True)
