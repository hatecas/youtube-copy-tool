"use client";

import { useState, useEffect } from "react";
import {
  Image,
  FileSpreadsheet,
  Mic,
  Film,
  CheckCircle,
  Loader2,
  Clock,
  Download,
  ArrowRight,
  ArrowLeft,
  AlertCircle,
  Play,
} from "lucide-react";
import { ConfirmedContent, ProductionAssets } from "@/lib/types";

interface ProductionStepProps {
  confirmed: ConfirmedContent;
  assets: ProductionAssets | null;
  isProducing: boolean;
  onStartProduction: () => void;
  onNext: () => void;
  onBack: () => void;
  backendUrl?: string;
}

type StepStatus = "pending" | "processing" | "done" | "error";

export default function ProductionStep({
  confirmed,
  assets,
  isProducing,
  onStartProduction,
  onNext,
  onBack,
  backendUrl = "",
}: ProductionStepProps) {
  const [hasStarted, setHasStarted] = useState(false);

  // 에셋 URL이 있으면 해당 단계 완료
  const getStatus = (key: keyof ProductionAssets): StepStatus => {
    if (!hasStarted && !isProducing) return "pending";
    if (assets && assets[key]) return "done";
    if (!isProducing && hasStarted) return assets?.[key] ? "done" : "error";

    // 제작 순서: thumbnail → ppt → tts → video
    const order: (keyof ProductionAssets)[] = ["thumbnailUrl", "pptUrl", "ttsUrl", "videoUrl"];
    const idx = order.indexOf(key);
    const prevDone = idx === 0 || (assets && assets[order[idx - 1]]);
    if (prevDone && !assets?.[key]) return "processing";
    return "pending";
  };

  const handleStart = () => {
    setHasStarted(true);
    onStartProduction();
  };

  useEffect(() => {
    if (isProducing) setHasStarted(true);
  }, [isProducing]);

  const allDone = assets?.thumbnailUrl && assets?.pptUrl && assets?.ttsUrl;
  const videoDone = assets?.videoUrl;

  const steps = [
    {
      key: "thumbnailUrl" as keyof ProductionAssets,
      icon: Image,
      label: "썸네일 이미지",
      desc: `"${confirmed.thumbnailText}" 텍스트로 생성`,
      color: "purple",
    },
    {
      key: "pptUrl" as keyof ProductionAssets,
      icon: FileSpreadsheet,
      label: "PPT 슬라이드",
      desc: "대본 기반 자동 슬라이드 생성",
      color: "blue",
    },
    {
      key: "ttsUrl" as keyof ProductionAssets,
      icon: Mic,
      label: "TTS 음성",
      desc: "한국어 자연음성 변환",
      color: "green",
    },
    {
      key: "videoUrl" as keyof ProductionAssets,
      icon: Film,
      label: "영상 합성",
      desc: "슬라이드 + 음성 → MP4",
      color: "accent",
    },
  ];

  const colorMap: Record<string, string> = {
    purple: "bg-purple-500/10 border-purple-500/20 text-purple-400",
    blue: "bg-blue-500/10 border-blue-500/20 text-blue-400",
    green: "bg-emerald-500/10 border-emerald-500/20 text-emerald-400",
    accent: "bg-accent/10 border-accent/20 text-accent",
  };

  const getAssetUrl = (url: string | null) => {
    if (!url) return "";
    if (url.startsWith("http")) return url;
    return `${backendUrl}${url}`;
  };

  return (
    <div className="animate-fade-in-up">
      {/* Header */}
      <div className="text-center mb-10">
        <div className="inline-flex items-center gap-2 badge badge-accent mb-4">
          <Film size={12} />
          콘텐츠 제작
        </div>
        <h2 className="text-3xl font-bold mb-3 tracking-tight">
          {isProducing ? "제작 중입니다..." : allDone ? "제작 완료!" : "제작을 시작하세요"}
        </h2>
        <p className="text-text-secondary max-w-lg mx-auto">
          확정된 콘텐츠를 바탕으로 썸네일, PPT, TTS, 영상을 자동 생성합니다
        </p>
      </div>

      <div className="max-w-3xl mx-auto space-y-4">
        {/* 제작 단계 카드 */}
        {steps.map((step, i) => {
          const status = getStatus(step.key);
          const Icon = step.icon;
          const assetUrl = assets?.[step.key];

          return (
            <div
              key={step.key}
              className={`card p-5 transition-all ${
                status === "processing" ? "animate-pulse-glow border-accent/40" : ""
              } ${status === "done" ? "border-success/30" : ""}`}
            >
              <div className="flex items-center gap-4">
                {/* 아이콘 */}
                <div className={`w-10 h-10 rounded-xl border flex items-center justify-center flex-shrink-0 ${colorMap[step.color]}`}>
                  <Icon size={18} />
                </div>

                {/* 정보 */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h4 className="font-semibold text-sm">{step.label}</h4>
                    {status === "done" && <CheckCircle size={14} className="text-success" />}
                    {status === "processing" && <Loader2 size={14} className="text-accent animate-spin" />}
                    {status === "pending" && <Clock size={14} className="text-text-muted" />}
                    {status === "error" && <AlertCircle size={14} className="text-red-400" />}
                  </div>
                  <p className="text-xs text-text-muted mt-0.5">{step.desc}</p>
                </div>

                {/* 다운로드/재생 버튼 */}
                {status === "done" && assetUrl && (
                  <div className="flex gap-2 flex-shrink-0">
                    {step.key === "ttsUrl" && (
                      <button
                        onClick={() => {
                          const audio = new Audio(getAssetUrl(assetUrl));
                          audio.play();
                        }}
                        className="p-2 rounded-lg bg-bg-secondary hover:bg-bg-card border border-border transition-colors"
                        title="재생"
                      >
                        <Play size={14} className="text-emerald-400" />
                      </button>
                    )}
                    <a
                      href={getAssetUrl(assetUrl)}
                      download
                      className="p-2 rounded-lg bg-bg-secondary hover:bg-bg-card border border-border transition-colors"
                      title="다운로드"
                    >
                      <Download size={14} className="text-text-secondary" />
                    </a>
                  </div>
                )}
              </div>
            </div>
          );
        })}

        {/* 영상 미리보기 */}
        {videoDone && assets?.videoUrl && (
          <div className="card p-6 border-success/30">
            <h4 className="font-bold mb-3 flex items-center gap-2">
              <Play size={16} className="text-success" />
              영상 미리보기
            </h4>
            <video
              controls
              className="w-full rounded-xl bg-black"
              src={getAssetUrl(assets.videoUrl)}
            >
              브라우저가 비디오를 지원하지 않습니다.
            </video>
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center justify-between pt-4">
          <button onClick={onBack} className="btn-secondary flex items-center gap-2 text-sm">
            <ArrowLeft size={14} />
            확정 내용 수정
          </button>

          {!hasStarted && !isProducing ? (
            <button onClick={handleStart} className="btn-primary flex items-center gap-2">
              제작 시작
              <ArrowRight size={14} />
            </button>
          ) : allDone ? (
            <button onClick={onNext} className="btn-primary flex items-center gap-2">
              업로드로 이동
              <ArrowRight size={14} />
            </button>
          ) : (
            <button disabled className="btn-primary opacity-50 cursor-not-allowed flex items-center gap-2">
              <Loader2 size={14} className="animate-spin" />
              제작 중...
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
