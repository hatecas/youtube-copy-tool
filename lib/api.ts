// 프로젝트 상태를 폴링하며 대기 (3초 간격, 최대 5분)
async function pollProject(
  projectId: string,
  targetStatuses: string[],
  maxWaitMs = 300000,
  intervalMs = 3000,
): Promise<Record<string, unknown>> {
  const start = Date.now();
  while (Date.now() - start < maxWaitMs) {
    await new Promise((r) => setTimeout(r, intervalMs));
    const project = await getProjectStatus(projectId);
    if (targetStatuses.includes(project.status)) {
      return project;
    }
    if (project.status === "error") {
      throw new Error(project.error_message || "처리 중 오류가 발생했습니다");
    }
  }
  throw new Error("처리 시간이 초과되었습니다 (5분). 다시 시도해주세요.");
}

export async function analyzeVideos(videoUrls: string[]) {
  const res = await fetch("/api/analyze", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ video_urls: videoUrls }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || `분석 실패: ${res.statusText}`);
  }

  const data = await res.json();

  // 비동기 처리: 백엔드가 즉시 응답하고 백그라운드 처리하는 경우
  if (data.status === "analyzing") {
    const project = await pollProject(data.analysis_id, ["topics_ready"]);
    return {
      analysis_id: project.id,
      videos: project.videos,
      topics: project.topics,
    };
  }

  // 동기 처리 (폴백)
  return data;
}

export async function retryTopics(
  analysisId: string,
  previousTopics: { topic: string }[]
) {
  const res = await fetch("/api/retry-topics", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      analysis_id: analysisId,
      previous_topics: previousTopics,
    }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || `재추천 실패: ${res.statusText}`);
  }

  return res.json();
}

export async function generateContent(
  analysisId: string,
  selectedTopicId: string
) {
  const res = await fetch("/api/generate", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      analysis_id: analysisId,
      selected_topic_id: selectedTopicId,
    }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || `생성 실패: ${res.statusText}`);
  }

  const data = await res.json();

  // 비동기 처리: 백엔드가 즉시 응답하고 백그라운드 처리하는 경우
  if (data.status === "generating") {
    const project = await pollProject(analysisId, ["complete"]);
    return project.generated_content;
  }

  // 동기 처리 (폴백)
  return data;
}

export async function getProjectStatus(projectId: string) {
  const res = await fetch(`/api/project/${projectId}`);

  if (!res.ok) {
    throw new Error(`조회 실패: ${res.statusText}`);
  }

  return res.json();
}

// YouTube URL에서 video ID 추출
export function extractVideoId(url: string): string | null {
  const patterns = [
    /(?:youtube\.com\/watch\?v=)([a-zA-Z0-9_-]{11})/,
    /(?:youtu\.be\/)([a-zA-Z0-9_-]{11})/,
    /(?:youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/,
    /(?:youtube\.com\/shorts\/)([a-zA-Z0-9_-]{11})/,
  ];

  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match) return match[1];
  }
  return null;
}

// YouTube 썸네일 URL 가져오기 (hqdefault는 모든 영상에 존재)
export function getThumbnailUrl(videoId: string): string {
  return `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`;
}

// 조회수 포맷
export function formatViewCount(count: number): string {
  if (count >= 10000) {
    return `${(count / 10000).toFixed(1)}만회`;
  }
  if (count >= 1000) {
    return `${(count / 1000).toFixed(1)}천회`;
  }
  return `${count}회`;
}

// 날짜 포맷
export function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));

  if (days === 0) return "오늘";
  if (days === 1) return "어제";
  if (days < 7) return `${days}일 전`;
  if (days < 30) return `${Math.floor(days / 7)}주 전`;
  if (days < 365) return `${Math.floor(days / 30)}개월 전`;
  return `${Math.floor(days / 365)}년 전`;
}
