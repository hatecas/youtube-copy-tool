// YouTube 영상 정보
export interface VideoInfo {
  id: string;
  url: string;
  title: string;
  thumbnail: string;
  channelName: string;
  viewCount: number;
  publishedAt: string;
  duration: string;
  description: string;
}

// 분석된 영상 데이터
export interface AnalyzedVideo extends VideoInfo {
  transcript: string; // 인트로~5분 대본
  viewRatio: number; // 최근 영상 대비 조회수 비율
}

// AI 분석 결과
export interface AnalysisResult {
  id: string;
  createdAt: string;
  videos: AnalyzedVideo[];
  topics: TopicSuggestion[];
  status: ProjectStatus;
}

// 주제 추천
export interface TopicSuggestion {
  id: string;
  topic: string;
  target: string;
  reasoning: string;
  confidence: number; // 0~100
}

// 최종 결과물
export interface GeneratedContent {
  id: string;
  analysisId: string;
  selectedTopic: TopicSuggestion;
  thumbnailTexts: string[]; // 썸네일 텍스트 문구 3개
  titleSuggestions: string[]; // 제목 추천 2개
  scripts: ScriptVariant[]; // 인트로~대본 2개 (타겟별)
}

// 대본 변형
export interface ScriptVariant {
  id: string;
  targetDescription: string;
  intro: string;
  body: string;
  fullScript: string;
}

// 확정된 콘텐츠 (Step 5)
export interface ConfirmedContent {
  title: string;
  thumbnailText: string;
  script: ScriptVariant;
  topic: TopicSuggestion;
}

// 제작 에셋 (Steps 6-9)
export interface ProductionAssets {
  thumbnailUrl: string | null;    // 썸네일 이미지 URL
  pptUrl: string | null;          // PPT 다운로드 URL
  ttsUrl: string | null;          // TTS 음성 URL
  videoUrl: string | null;        // 최종 영상 URL
}

// 제작 진행 상태
export interface ProductionProgress {
  thumbnail: "pending" | "processing" | "done" | "error";
  ppt: "pending" | "processing" | "done" | "error";
  tts: "pending" | "processing" | "done" | "error";
  video: "pending" | "processing" | "done" | "error";
}

// 프로젝트 상태
export type ProjectStatus =
  | "input"
  | "analyzing"
  | "topics_ready"
  | "generating"
  | "complete"
  | "confirmed"
  | "producing"
  | "production_done"
  | "uploading"
  | "uploaded"
  | "error";

// 프로젝트 (Supabase에 저장)
export interface Project {
  id: string;
  created_at: string;
  updated_at: string;
  title: string;
  status: ProjectStatus;
  video_urls: string[];
  analyzed_videos: AnalyzedVideo[] | null;
  topics: TopicSuggestion[] | null;
  selected_topic_id: string | null;
  generated_content: GeneratedContent | null;
  confirmed_content: ConfirmedContent | null;
  production_assets: ProductionAssets | null;
}
