"use client";

import { useState } from "react";
import Header from "@/components/Header";
import StepIndicator from "@/components/StepIndicator";
import VideoInputStep from "@/components/VideoInputStep";
import AnalysisStep from "@/components/AnalysisStep";
import TopicSelectStep from "@/components/TopicSelectStep";
import ResultStep from "@/components/ResultStep";
import { AnalyzedVideo, TopicSuggestion, GeneratedContent } from "@/lib/types";

export type AppStep = "input" | "analyzing" | "topics" | "generating" | "result";

export default function Home() {
  const [currentStep, setCurrentStep] = useState<AppStep>("input");
  const [videoUrls, setVideoUrls] = useState<string[]>([]);
  const [analyzedVideos, setAnalyzedVideos] = useState<AnalyzedVideo[]>([]);
  const [topics, setTopics] = useState<TopicSuggestion[]>([]);
  const [selectedTopic, setSelectedTopic] = useState<TopicSuggestion | null>(null);
  const [generatedContent, setGeneratedContent] = useState<GeneratedContent | null>(null);
  const [analysisId, setAnalysisId] = useState<string>("");

  // Step 1 → 2: 영상 URL 제출 후 분석 시작
  const handleSubmitUrls = async (urls: string[]) => {
    setVideoUrls(urls);
    setCurrentStep("analyzing");

    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:5000"}/api/analyze`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ video_urls: urls }),
        }
      );

      if (!res.ok) throw new Error("분석 실패");

      const data = await res.json();
      setAnalysisId(data.analysis_id);
      setAnalyzedVideos(data.videos);
      setTopics(data.topics);
      setCurrentStep("topics");
    } catch (err) {
      console.error(err);
      // 데모: 백엔드 없을 때 mock 데이터 사용
      useMockData(urls);
    }
  };

  // Mock 데이터 (백엔드 연결 전 데모용)
  const useMockData = (urls: string[]) => {
    const mockVideos: AnalyzedVideo[] = urls.map((url, i) => ({
      id: `video-${i}`,
      url,
      title: `샘플 영상 ${i + 1} - 분석 대기중`,
      thumbnail: `https://img.youtube.com/vi/dQw4w9WgXcQ/maxresdefault.jpg`,
      channelName: `채널 ${i + 1}`,
      viewCount: Math.floor(Math.random() * 500000) + 10000,
      publishedAt: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString(),
      duration: "10:30",
      description: "영상 설명이 여기에 표시됩니다.",
      transcript: "인트로부터 5분까지의 대본이 여기에 표시됩니다. AI 분석 백엔드가 연결되면 실제 자막/대본이 추출됩니다.",
      viewRatio: Math.random() * 3 + 0.5,
    }));

    const mockTopics: TopicSuggestion[] = [
      {
        id: "topic-1",
        topic: "AI를 활용한 생산성 10배 향상법",
        target: "20~30대 직장인, 프리랜서",
        reasoning: "레퍼런스 영상들에서 공통적으로 'AI 도구 활용'과 '업무 효율화' 키워드가 높은 조회수를 기록했습니다.",
        confidence: 87,
      },
      {
        id: "topic-2",
        topic: "하루 1시간으로 월 500만원 부업하는 방법",
        target: "20대 후반~40대 부업에 관심있는 직장인",
        reasoning: "부업/수익화 관련 콘텐츠가 최근 영상 대비 2.3배 높은 조회수를 보여주고 있습니다.",
        confidence: 74,
      },
      {
        id: "topic-3",
        topic: "2025년 꼭 배워야 할 스킬 TOP 5",
        target: "취준생, 이직 준비중인 직장인",
        reasoning: "자기개발/스킬업 주제가 구독자 전환율이 가장 높은 것으로 분석됩니다.",
        confidence: 68,
      },
    ];

    setAnalysisId("mock-analysis-1");
    setAnalyzedVideos(mockVideos);
    setTopics(mockTopics);
    setCurrentStep("topics");
  };

  // Step 3: 주제 선택 → 콘텐츠 생성
  const handleSelectTopic = async (topic: TopicSuggestion) => {
    setSelectedTopic(topic);
    setCurrentStep("generating");

    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:5000"}/api/generate`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            analysis_id: analysisId,
            selected_topic_id: topic.id,
          }),
        }
      );

      if (!res.ok) throw new Error("생성 실패");

      const data = await res.json();
      setGeneratedContent(data);
      setCurrentStep("result");
    } catch (err) {
      console.error(err);
      // 데모: mock 결과
      useMockResult(topic);
    }
  };

  const useMockResult = (topic: TopicSuggestion) => {
    const mockContent: GeneratedContent = {
      id: "gen-1",
      analysisId: analysisId,
      selectedTopic: topic,
      thumbnailTexts: [
        "AI가 대신 일해줍니다",
        "직장인 필수 AI 도구 5가지",
        "이거 모르면 뒤처집니다",
      ],
      titleSuggestions: [
        "직장인이 AI 써보고 퇴사 결심한 이유 (현실적 부업)",
        "하루 1시간, AI로 월급 2배 만드는 현실적인 방법",
      ],
      scripts: [
        {
          id: "script-1",
          targetDescription: "20~30대 직장인 (효율/생산성 중심)",
          intro:
            "여러분, 혹시 퇴근하고 나서 '오늘도 하루가 이렇게 끝났네' 하면서 한숨 쉬어본 적 있으신가요? 저도 그랬습니다. 매일 야근에 시달리면서 '이게 맞나' 싶었거든요. 그런데 AI를 제대로 활용하기 시작하면서 모든 게 바뀌었습니다.",
          body: "본문 내용은 AI 백엔드 연결 시 자동 생성됩니다.\n\n[섹션 1: 문제 제기]\n현재 직장인들이 겪는 시간 부족 문제를 구체적 사례로 제시\n\n[섹션 2: 해결책 소개]\nAI 도구 5가지를 하나씩 소개하며 실제 사용 예시 제공\n\n[섹션 3: 실전 적용]\n시청자가 바로 따라할 수 있는 스텝바이스텝 가이드\n\n[섹션 4: 결과 & CTA]\n실제 수익/시간 절약 결과를 보여주며 구독 유도",
          fullScript:
            "인트로 + 본문이 합쳐진 전체 대본이 여기에 표시됩니다.",
        },
        {
          id: "script-2",
          targetDescription: "40대 부업 관심자 (안정성/현실성 중심)",
          intro:
            "안녕하세요. 오늘은 좀 현실적인 이야기를 해볼까 합니다. 인터넷에 넘쳐나는 '월 천만원 벌기' 같은 이야기 말고요, 진짜 직장 다니면서 할 수 있는 것들만 모았습니다. AI라는 게 어렵게 느껴지실 수 있는데, 제가 최대한 쉽게 알려드리겠습니다.",
          body: "본문 내용은 AI 백엔드 연결 시 자동 생성됩니다.\n\n[섹션 1: 현실 인식]\n과장된 부업 광고의 문제점과 현실적 수익 기대치\n\n[섹션 2: AI 도구 소개]\n컴퓨터에 익숙하지 않아도 사용 가능한 도구 위주\n\n[섹션 3: 단계별 가이드]\n주말 2시간으로 시작할 수 있는 구체적 방법\n\n[섹션 4: 주의사항 & 마무리]\n초기 투자 비용, 예상 수익, 주의할 점",
          fullScript:
            "인트로 + 본문이 합쳐진 전체 대본이 여기에 표시됩니다.",
        },
      ],
    };

    setTimeout(() => {
      setGeneratedContent(mockContent);
      setCurrentStep("result");
    }, 2000);
  };

  // 다시 주제 추천 받기
  const handleRetryTopics = () => {
    setCurrentStep("topics");
    // 실제로는 백엔드에 재요청
  };

  // 처음부터 다시 시작
  const handleReset = () => {
    setCurrentStep("input");
    setVideoUrls([]);
    setAnalyzedVideos([]);
    setTopics([]);
    setSelectedTopic(null);
    setGeneratedContent(null);
    setAnalysisId("");
  };

  return (
    <div className="min-h-screen">
      <Header onReset={handleReset} />

      <main className="max-w-6xl mx-auto px-6 pb-20">
        <StepIndicator currentStep={currentStep} />

        {currentStep === "input" && (
          <VideoInputStep onSubmit={handleSubmitUrls} />
        )}

        {currentStep === "analyzing" && (
          <AnalysisStep videoUrls={videoUrls} />
        )}

        {currentStep === "topics" && (
          <TopicSelectStep
            videos={analyzedVideos}
            topics={topics}
            onSelectTopic={handleSelectTopic}
            onRetry={handleRetryTopics}
          />
        )}

        {currentStep === "generating" && (
          <AnalysisStep videoUrls={videoUrls} isGenerating />
        )}

        {currentStep === "result" && generatedContent && (
          <ResultStep
            content={generatedContent}
            videos={analyzedVideos}
            onReset={handleReset}
            onBack={() => setCurrentStep("topics")}
          />
        )}
      </main>
    </div>
  );
}
