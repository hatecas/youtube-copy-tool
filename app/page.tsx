"use client";

import { useState } from "react";
import Header from "@/components/Header";
import StepIndicator from "@/components/StepIndicator";
import VideoInputStep from "@/components/VideoInputStep";
import AnalysisStep from "@/components/AnalysisStep";
import TopicSelectStep from "@/components/TopicSelectStep";
import ResultStep from "@/components/ResultStep";
import { AnalyzedVideo, TopicSuggestion, GeneratedContent } from "@/lib/types";
import { analyzeVideos, retryTopics, generateContent } from "@/lib/api";

export type AppStep = "input" | "analyzing" | "topics" | "generating" | "result";

export default function Home() {
  const [currentStep, setCurrentStep] = useState<AppStep>("input");
  const [videoUrls, setVideoUrls] = useState<string[]>([]);
  const [analyzedVideos, setAnalyzedVideos] = useState<AnalyzedVideo[]>([]);
  const [topics, setTopics] = useState<TopicSuggestion[]>([]);
  const [, setSelectedTopic] = useState<TopicSuggestion | null>(null);
  const [generatedContent, setGeneratedContent] = useState<GeneratedContent | null>(null);
  const [analysisId, setAnalysisId] = useState<string>("");
  const [error, setError] = useState<string | null>(null);
  const [isRetrying, setIsRetrying] = useState(false);

  // 최소 대기 시간 보장 (UX - 너무 빨리 끝나면 가벼워 보임)
  const withMinDelay = async <T,>(promise: Promise<T>, minMs: number): Promise<T> => {
    const [result] = await Promise.all([
      promise,
      new Promise((r) => setTimeout(r, minMs)),
    ]);
    return result;
  };

  // Step 1 → 2: 영상 URL 제출 후 분석 시작
  const handleSubmitUrls = async (urls: string[]) => {
    setVideoUrls(urls);
    setCurrentStep("analyzing");
    setError(null);

    try {
      // 최소 8초 대기 (영상 수집 + AI 분석이 빠르게 끝나더라도)
      const data = await withMinDelay(analyzeVideos(urls), 8000);
      setAnalysisId(data.analysis_id);
      setAnalyzedVideos(data.videos);
      setTopics(data.topics);
      setCurrentStep("topics");
    } catch (err) {
      console.error(err);
      const message = err instanceof Error ? err.message : "알 수 없는 오류";

      if (message.includes("Failed to fetch")) {
        setError("백엔드 서버에 연결할 수 없습니다. 백엔드(python app.py)가 실행 중인지 확인해주세요.");
      } else {
        setError(`분석 중 오류 발생: ${message}`);
      }
      setCurrentStep("input");
    }
  };

  // Step 3: 주제 선택 → 콘텐츠 생성
  const handleSelectTopic = async (topic: TopicSuggestion) => {
    setSelectedTopic(topic);
    setCurrentStep("generating");
    setError(null);

    try {
      // 최소 10초 대기 (대본 생성은 실제로도 오래 걸림)
      const data = await withMinDelay(generateContent(analysisId, topic.id), 10000);
      setGeneratedContent(data);
      setCurrentStep("result");
    } catch (err) {
      console.error(err);
      const message = err instanceof Error ? err.message : "알 수 없는 오류";
      setError(`콘텐츠 생성 중 오류: ${message}`);
      setCurrentStep("topics");
    }
  };

  // 다시 주제 추천 받기 (백엔드 재요청)
  const handleRetryTopics = async () => {
    setIsRetrying(true);
    setError(null);

    try {
      const data = await withMinDelay(
        retryTopics(
          analysisId,
          topics.map((t) => ({ topic: t.topic }))
        ),
        5000
      );
      setTopics(data.topics);
    } catch (err) {
      console.error(err);
      const message = err instanceof Error ? err.message : "알 수 없는 오류";
      setError(`재추천 중 오류: ${message}`);
    } finally {
      setIsRetrying(false);
    }
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
    setError(null);
    setIsRetrying(false);
  };

  return (
    <div className="min-h-screen">
      <Header onReset={handleReset} />

      <main className="max-w-6xl mx-auto px-6 pb-20">
        <StepIndicator currentStep={currentStep} />

        {/* 에러 배너 */}
        {error && (
          <div className="max-w-3xl mx-auto mb-6">
            <div className="flex items-start gap-3 p-4 bg-red-500/5 border border-red-500/20 rounded-xl text-sm text-red-400">
              <span className="flex-shrink-0 mt-0.5">⚠</span>
              <div>
                <p className="font-medium mb-1">오류 발생</p>
                <p className="text-red-400/80">{error}</p>
              </div>
              <button
                onClick={() => setError(null)}
                className="flex-shrink-0 ml-auto text-red-400/50 hover:text-red-400"
              >
                ✕
              </button>
            </div>
          </div>
        )}

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
            isRetrying={isRetrying}
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
