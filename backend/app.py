import os
import re
import uuid
import json
from datetime import datetime
from flask import Flask, request, jsonify
from flask_cors import CORS
from pathlib import Path
from dotenv import load_dotenv

# .env 파일 찾기: backend/.env 또는 프로젝트 루트/.env
_env_path = Path(__file__).parent / ".env"
if not _env_path.exists():
    _env_path = Path(__file__).parent.parent / ".env"
if _env_path.exists():
    load_dotenv(_env_path)
    print(f"[설정] .env 로드 완료: {_env_path}")
else:
    load_dotenv()
    print("[설정] .env 파일을 찾을 수 없습니다. 환경변수에서 직접 읽습니다.")

app = Flask(__name__)
CORS(app, origins=["*"])

# ============================================================
# 외부 서비스 클라이언트
# ============================================================

# Claude AI
anthropic_client = None
ANTHROPIC_API_KEY = os.getenv("ANTHROPIC_API_KEY")
if ANTHROPIC_API_KEY:
    try:
        import anthropic
        anthropic_client = anthropic.Anthropic(api_key=ANTHROPIC_API_KEY)
        print(f"[설정] Claude AI 연동: 활성 (키: {ANTHROPIC_API_KEY[:20]}...)")
    except ImportError:
        print("[설정] Claude AI 연동: 실패 - 'pip install anthropic' 필요")
else:
    print("[설정] Claude AI 연동: 비활성 - ANTHROPIC_API_KEY가 .env에 없습니다")

# Supabase
supabase_client = None
SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY") or os.getenv("SUPABASE_KEY")
if SUPABASE_URL and SUPABASE_KEY:
    try:
        from supabase import create_client
        supabase_client = create_client(SUPABASE_URL, SUPABASE_KEY)
        print(f"[설정] Supabase 연동: 활성")
    except ImportError:
        print("[설정] Supabase 연동: 실패 - 'pip install supabase' 필요")
else:
    print("[설정] Supabase 연동: 비활성 (인메모리 모드)")


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
            "thumbnail": f"https://img.youtube.com/vi/{video_id}/hqdefault.jpg",
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
            "thumbnail": f"https://img.youtube.com/vi/{video_id}/hqdefault.jpg",
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
            "thumbnail": f"https://img.youtube.com/vi/{video_id}/hqdefault.jpg",
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

    prompt = f"""당신은 YouTube 콘텐츠 전략 전문가이자 데이터 분석가입니다.
아래 레퍼런스 영상들을 꼼꼼히 분석하여, 이 영상들을 카피(벤치마킹)해서 만들 수 있는 새 영상 주제를 정확히 3개 추천해주세요.

[분석 기준 - 반드시 모두 반영]
1. 각 영상의 제목에서 공통 키워드, 패턴, 화법(숫자 사용, 질문형, 도발형 등)을 파악
2. 조회수가 높은 영상과 낮은 영상의 차이점 분석 (어떤 요소가 조회수를 끌어올렸는지)
3. 최근 영상 대비 조회수 비율이 높은 영상에 더 가중치 부여
4. 대본(인트로~5분)에서 훅(hook) 방식, 스토리 전개 구조, 시청자 반응 유도 방식을 정밀 분석
5. 채널의 전반적인 콘텐츠 방향성과 시청자 성향 파악
6. 각 주제는 "그대로 촬영에 들어갈 수 있을 정도로" 구체적이어야 함{exclude_instruction}

[레퍼런스 영상 데이터]
{video_block}

아래 JSON 배열 형식으로만 응답해주세요 (다른 텍스트 없이):
[
  {{
    "topic": "구체적인 영상 주제 (실제 영상 제목처럼 구체적으로, 20~40자)",
    "target": "타겟 시청자층 (연령대, 직업/상황, 관심사를 구체적으로 명시)",
    "reasoning": "이 주제를 추천하는 이유를 3~5문장으로 상세하게 작성. 반드시 레퍼런스 영상의 구체적인 데이터(어떤 영상의 조회수가 얼마였는지, 어떤 키워드가 효과적이었는지, 대본에서 어떤 훅이 사용되었는지)를 근거로 포함할 것.",
    "confidence": 0~100 사이의 적중 확률 (레퍼런스 데이터 근거 기반으로 산출)
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

    prompt = f"""당신은 100만 구독자 YouTube 콘텐츠 크리에이터이자 최고의 카피라이팅 전문가입니다.
아래 주제와 레퍼런스 영상 분석을 바탕으로 실전에서 바로 사용할 수 있는 완성도 높은 콘텐츠를 생성해주세요.

[선택된 주제]
- 주제: {topic['topic']}
- 타겟: {topic['target']}

[레퍼런스 영상 분석]
{video_block}

아래 JSON 형식으로만 응답해주세요 (다른 텍스트 없이):
{{
  "thumbnailTexts": [
    "썸네일 텍스트1",
    "썸네일 텍스트2",
    "썸네일 텍스트3"
  ],
  "titleSuggestions": [
    "제목1",
    "제목2"
  ],
  "scripts": [
    {{
      "targetDescription": "타겟1 구체적 설명",
      "intro": "인트로 대본 전체 (500자 이상)",
      "body": "본문 대본 전체 (3000자 이상, 4개 섹션)"
    }},
    {{
      "targetDescription": "타겟2 구체적 설명",
      "intro": "인트로 대본 전체 (500자 이상)",
      "body": "본문 대본 전체 (3000자 이상, 4개 섹션)"
    }}
  ]
}}

=== 반드시 지켜야 할 품질 기준 ===

[썸네일 텍스트 - 3개]
- 한글 기준 4~8자 (예: "이거 실화?", "월 500만원", "퇴사 각")
- 유튜브에서 가장 클릭률이 높은 패턴 활용: 숫자, 질문, 도발, 공감
- 3개 모두 다른 감정/접근법 사용 (충격형, 공감형, 혜택형)

[제목 - 2개]
- 30~50자 수준으로 충분히 길게
- YouTube SEO 키워드를 자연스럽게 포함
- 검색 노출 + 클릭 유도를 동시에 고려
- 예시 수준: "직장인이 퇴근 후 AI 부업 시작했더니 3개월 만에 월급보다 더 벌게 된 현실적인 방법"
- 반드시 궁금증/감정을 자극하는 요소 포함 (결과 암시, 반전, 구체적 숫자)

[인트로 대본 - 각 500~800자]
- 실제 유튜버가 카메라 앞에서 말하는 듯한 완전한 구어체
- 구조: 강력한 훅(첫 2문장) → 공감/문제 제기 → "이 영상에서는~" 소개 → 시청 유도
- 레퍼런스 영상에서 효과적이었던 훅 방식을 참고하되 원본을 복사하지 말 것
- "~거든요", "~잖아요", "~인데요" 등 실제 말투 사용

[본문 대본 - 각 3000~4000자, 반드시 4개 섹션]
각 섹션은 아래 형식으로 작성:

[섹션 1: 제목]
이 섹션의 전체 대본을 구어체로 작성. 최소 700자 이상.
실제 예시, 구체적인 수치, 비유를 활용하여 설득력 있게 전개.

[섹션 2: 제목]
(동일 형식, 최소 700자)

[섹션 3: 제목]
(동일 형식, 최소 700자)

[섹션 4: 제목]
마무리 섹션. 핵심 요약 + CTA(구독/좋아요 유도) 포함. 최소 700자.

- 각 섹션은 완전한 문장으로 구성된 실제 대본이어야 함 (개요/요약이 아님!)
- "~라고 합니다" "~하면 됩니다" 같은 딱딱한 문체 금지 → "~거든요" "~해보세요" "~있잖아요" 사용
- 두 대본은 톤, 예시, 비유, 깊이가 완전히 달라야 함 (같은 내용을 말투만 바꾸는 것은 안 됨)"""

    try:
        message = anthropic_client.messages.create(
            model="claude-sonnet-4-20250514",
            max_tokens=8000,
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
