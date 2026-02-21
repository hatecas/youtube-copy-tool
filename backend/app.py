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
        # API 키 없으면 기본 정보만 반환
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

        # 한국어 자막 우선, 없으면 영어, 없으면 아무거나
        transcript = None
        for lang in ["ko", "en"]:
            try:
                transcript = transcript_list.find_transcript([lang])
                break
            except:
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


# ============================================================
# AI 분석 (추후 연결)
# ============================================================

def analyze_with_ai(videos: list[dict]) -> list[dict]:
    """
    AI로 영상 분석 후 주제 추천
    TODO: OpenAI 또는 Claude API 연결
    """
    # 현재는 영상 데이터 기반 간단한 추천 반환
    topics = [
        {
            "id": str(uuid.uuid4()),
            "topic": "분석된 레퍼런스 기반 주제 추천 1",
            "target": "분석 대상 타겟층",
            "reasoning": "레퍼런스 영상들의 공통 키워드와 조회수 패턴을 분석한 결과입니다. AI 연결 후 더 정확한 분석이 제공됩니다.",
            "confidence": 75,
        },
        {
            "id": str(uuid.uuid4()),
            "topic": "분석된 레퍼런스 기반 주제 추천 2",
            "target": "분석 대상 타겟층",
            "reasoning": "두 번째 추천 주제입니다. AI 연결 후 영상 대본 분석을 기반으로 더 구체적인 추천이 제공됩니다.",
            "confidence": 62,
        },
        {
            "id": str(uuid.uuid4()),
            "topic": "분석된 레퍼런스 기반 주제 추천 3",
            "target": "분석 대상 타겟층",
            "reasoning": "세 번째 추천 주제입니다.",
            "confidence": 55,
        },
    ]

    return topics


def generate_with_ai(topic: dict, videos: list[dict]) -> dict:
    """
    AI로 콘텐츠 생성 (썸네일, 제목, 대본)
    TODO: OpenAI 또는 Claude API 연결
    """
    return {
        "thumbnailTexts": [
            "썸네일 텍스트 1 (AI 연결 후 생성)",
            "썸네일 텍스트 2 (AI 연결 후 생성)",
            "썸네일 텍스트 3 (AI 연결 후 생성)",
        ],
        "titleSuggestions": [
            "제목 추천 1 (AI 연결 후 생성)",
            "제목 추천 2 (AI 연결 후 생성)",
        ],
        "scripts": [
            {
                "id": str(uuid.uuid4()),
                "targetDescription": topic.get("target", "일반 타겟"),
                "intro": "인트로 대본이 AI 연결 후 자동 생성됩니다.",
                "body": "본문 대본이 AI 연결 후 자동 생성됩니다.",
                "fullScript": "전체 대본이 AI 연결 후 자동 생성됩니다.",
            },
            {
                "id": str(uuid.uuid4()),
                "targetDescription": "보조 타겟층",
                "intro": "두 번째 버전의 인트로 대본이 AI 연결 후 자동 생성됩니다.",
                "body": "두 번째 버전의 본문이 AI 연결 후 자동 생성됩니다.",
                "fullScript": "두 번째 버전의 전체 대본이 AI 연결 후 자동 생성됩니다.",
            },
        ],
    }


# ============================================================
# API 엔드포인트
# ============================================================

# 인메모리 저장 (추후 Supabase로 교체)
projects = {}


@app.route("/api/health", methods=["GET"])
def health():
    return jsonify({"status": "ok", "timestamp": datetime.now().isoformat()})


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

        # 대본 추출
        transcript = get_transcript(video_id)

        videos.append({
            **info,
            "url": url,
            "transcript": transcript,
            "viewRatio": 1.0,  # 추후 계산
        })

    if not videos:
        return jsonify({"error": "유효한 영상을 찾을 수 없습니다"}), 400

    # 조회수 기준 정렬
    videos.sort(key=lambda x: x["viewCount"], reverse=True)

    # 최근 영상 대비 조회수 비율 계산
    if videos:
        avg_views = sum(v["viewCount"] for v in videos) / len(videos)
        for v in videos:
            v["viewRatio"] = round(v["viewCount"] / max(avg_views, 1), 2)

    # AI 분석 (추후 연결)
    topics = analyze_with_ai(videos)

    # 프로젝트 저장
    analysis_id = str(uuid.uuid4())
    projects[analysis_id] = {
        "id": analysis_id,
        "created_at": datetime.now().isoformat(),
        "videos": videos,
        "topics": topics,
        "status": "topics_ready",
    }

    return jsonify({
        "analysis_id": analysis_id,
        "videos": videos,
        "topics": topics,
    })


@app.route("/api/generate", methods=["POST"])
def generate():
    """콘텐츠 생성 API"""
    data = request.get_json()
    analysis_id = data.get("analysis_id")
    selected_topic_id = data.get("selected_topic_id")

    project = projects.get(analysis_id)
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

    # AI 생성 (추후 연결)
    result = generate_with_ai(selected_topic, project["videos"])

    generated = {
        "id": str(uuid.uuid4()),
        "analysisId": analysis_id,
        "selectedTopic": selected_topic,
        **result,
    }

    # 프로젝트 업데이트
    project["status"] = "complete"
    project["generated_content"] = generated

    return jsonify(generated)


@app.route("/api/project/<project_id>", methods=["GET"])
def get_project(project_id):
    """프로젝트 상태 조회"""
    project = projects.get(project_id)
    if not project:
        return jsonify({"error": "프로젝트를 찾을 수 없습니다"}), 404
    return jsonify(project)


# ============================================================
# 실행
# ============================================================

if __name__ == "__main__":
    port = int(os.getenv("PORT", 5000))
    app.run(host="0.0.0.0", port=port, debug=True)
