"use client";

import { useState, useEffect } from "react";
import Header from "@/components/Header";
import StepIndicator from "@/components/StepIndicator";
import VideoInputStep from "@/components/VideoInputStep";
import AnalysisStep from "@/components/AnalysisStep";
import TopicSelectStep from "@/components/TopicSelectStep";
import ResultStep from "@/components/ResultStep";
import ConfirmStep from "@/components/ConfirmStep";
import ProductionStep from "@/components/ProductionStep";
import UploadStep from "@/components/UploadStep";
import {
  AnalyzedVideo,
  TopicSuggestion,
  GeneratedContent,
  ConfirmedContent,
  ProductionAssets,
} from "@/lib/types";
import {
  analyzeVideos,
  retryTopics,
  generateContent,
  confirmContent,
  startProduction,
  uploadToYoutube,
  getProjectStatus,
} from "@/lib/api";

export type AppStep =
  | "input"
  | "analyzing"
  | "topics"
  | "generating"
  | "result"
  | "confirm"
  | "producing"
  | "production"
  | "upload";

const ACCESS_CODE = "5656";
const STORAGE_KEY = "yt_access_granted";

function AccessGate({ onGranted }: { onGranted: () => void }) {
  const [input, setInput] = useState("");
  const [error, setError] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (input === ACCESS_CODE) {
      localStorage.setItem(STORAGE_KEY, "1");
      onGranted();
    } else {
      setError(true);
      setInput("");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-6">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="text-4xl mb-4">🔒</div>
          <h1 className="text-2xl font-bold mb-2">입장 코드를 입력하세요</h1>
          <p className="text-text-muted text-sm">허가된 사용자만 접근할 수 있습니다.</p>
        </div>
        <form onSubmit={handleSubmit} className="space-y-3">
          <input
            type="password"
            value={input}
            onChange={(e) => { setInput(e.target.value); setError(false); }}
            placeholder="입장 코드"
            autoFocus
            className={`input-field text-center text-lg tracking-widest ${error ? "border-red-500/50" : ""}`}
          />
          {error && <p className="text-red-400 text-sm text-center">코드가 올바르지 않습니다.</p>}
          <button type="submit" className="btn-primary w-full">
            입장하기
          </button>
        </form>
      </div>
    </div>
  );
}

export default function Home() {
  const [accessGranted, setAccessGranted] = useState(false);
  const [currentStep, setCurrentStep] = useState<AppStep>("input");
  const [videoUrls, setVideoUrls] = useState<string[]>([]);
  const [analyzedVideos, setAnalyzedVideos] = useState<AnalyzedVideo[]>([]);
  const [topics, setTopics] = useState<TopicSuggestion[]>([]);
  const [, setSelectedTopic] = useState<TopicSuggestion | null>(null);
  const [generatedContent, setGeneratedContent] = useState<GeneratedContent | null>(null);
  const [confirmedContent, setConfirmedContent] = useState<ConfirmedContent | null>(null);
  const [productionAssets, setProductionAssets] = useState<ProductionAssets | null>(null);
  const [isProducing, setIsProducing] = useState(false);
  const [analysisId, setAnalysisId] = useState<string>("");
  const [error, setError] = useState<string | null>(null);
  const [isRetrying, setIsRetrying] = useState(false);

  useEffect(() => {
    if (localStorage.getItem(STORAGE_KEY) === "1") {
      setAccessGranted(true);
    }
  }, []);

  if (!accessGranted) {
    return <AccessGate onGranted={() => setAccessGranted(true)} />;
  }

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

  // 다시 주제 추천 받기
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

  // Step 5: 콘텐츠 확정
  const handleConfirm = async (confirmed: ConfirmedContent) => {
    setConfirmedContent(confirmed);
    setError(null);

    try {
      await confirmContent(analysisId, confirmed);
      setCurrentStep("production");
    } catch (err) {
      console.error(err);
      const message = err instanceof Error ? err.message : "알 수 없는 오류";
      setError(`확정 중 오류: ${message}`);
    }
  };

  // Step 6-9: 제작 시작
  const handleStartProduction = async () => {
    setIsProducing(true);
    setProductionAssets(null);
    setError(null);

    try {
      // 제작 API 호출 (폴링으로 완료 대기)
      const assets = await startProduction(analysisId) as ProductionAssets;
      setProductionAssets(assets);
      setIsProducing(false);
    } catch (err) {
      console.error(err);
      setIsProducing(false);
      // 부분 에셋이라도 가져오기
      try {
        const project = await getProjectStatus(analysisId);
        if (project.production_assets) {
          setProductionAssets(project.production_assets);
        }
      } catch {
        // ignore
      }
      const message = err instanceof Error ? err.message : "알 수 없는 오류";
      setError(`제작 중 오류: ${message}`);
    }
  };

  // Step 10: YouTube 업로드
  const handleUpload = async () => {
    return await uploadToYoutube(analysisId);
  };

  // 처음부터 다시 시작
  const handleReset = () => {
    setCurrentStep("input");
    setVideoUrls([]);
    setAnalyzedVideos([]);
    setTopics([]);
    setSelectedTopic(null);
    setGeneratedContent(null);
    setConfirmedContent(null);
    setProductionAssets(null);
    setIsProducing(false);
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
            onConfirm={() => setCurrentStep("confirm")}
          />
        )}

        {currentStep === "confirm" && generatedContent && (
          <ConfirmStep
            content={generatedContent}
            onConfirm={handleConfirm}
            onBack={() => setCurrentStep("result")}
          />
        )}

        {(currentStep === "production" || currentStep === "producing") && confirmedContent && (
          <ProductionStep
            confirmed={confirmedContent}
            assets={productionAssets}
            isProducing={isProducing}
            onStartProduction={handleStartProduction}
            onNext={() => setCurrentStep("upload")}
            onBack={() => setCurrentStep("confirm")}
          />
        )}

        {currentStep === "upload" && confirmedContent && productionAssets && (
          <UploadStep
            confirmed={confirmedContent}
            assets={productionAssets}
            onUpload={handleUpload}
            onBack={() => setCurrentStep("production")}
            onReset={handleReset}
          />
        )}
      </main>
    </div>
  );
}
