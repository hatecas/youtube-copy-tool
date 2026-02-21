"use client";

import { useEffect, useState } from "react";
import { Loader2, Search, Brain, FileText, CheckCircle2 } from "lucide-react";

interface AnalysisStepProps {
  videoUrls: string[];
  isGenerating?: boolean;
}

export default function AnalysisStep({ videoUrls, isGenerating }: AnalysisStepProps) {
  const [activeStep, setActiveStep] = useState(0);

  const steps = isGenerating
    ? [
        { icon: Brain, label: "선택한 주제 기반 콘텐츠 기획중...", duration: 3000 },
        { icon: FileText, label: "썸네일 & 제목 생성중...", duration: 4000 },
        { icon: FileText, label: "타겟별 대본 작성중 (4섹션 구성)...", duration: 6000 },
      ]
    : [
        { icon: Search, label: `영상 ${videoUrls.length}개 정보 수집중...`, duration: 3000 },
        { icon: FileText, label: "자막/대본 추출중 (인트로~5분)...", duration: 5000 },
        { icon: Brain, label: "AI가 영상 패턴 분석 & 주제 추천 생성중...", duration: 8000 },
      ];

  // 단계별 진행 애니메이션
  useEffect(() => {
    if (activeStep < steps.length - 1) {
      const timer = setTimeout(() => {
        setActiveStep((prev) => prev + 1);
      }, steps[activeStep].duration);
      return () => clearTimeout(timer);
    }
  }, [activeStep, steps.length]);

  return (
    <div className="animate-fade-in-up">
      <div className="text-center mb-12">
        <div className="inline-flex items-center gap-2 badge badge-accent mb-4">
          <Loader2 size={12} className="animate-spin" />
          {isGenerating ? "생성중" : "분석중"}
        </div>
        <h2 className="text-3xl font-bold mb-3 tracking-tight">
          {isGenerating ? "콘텐츠를 생성하고 있어요" : "영상을 분석하고 있어요"}
        </h2>
        <p className="text-text-secondary">
          {isGenerating
            ? "AI가 레퍼런스를 참고하여 고품질 콘텐츠를 만들고 있습니다"
            : `${videoUrls.length}개 영상의 제목, 조회수, 대본을 수집하고 AI가 분석 중입니다`}
        </p>
      </div>

      {/* Loading animation */}
      <div className="max-w-lg mx-auto">
        <div className="card p-8">
          {/* Spinner */}
          <div className="flex justify-center mb-8">
            <div className="relative">
              <div className="w-20 h-20 rounded-2xl bg-accent/5 border border-accent/20 flex items-center justify-center">
                <Loader2 size={28} className="text-accent animate-spin" />
              </div>
              <div className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-accent animate-ping" />
            </div>
          </div>

          {/* Progress steps */}
          <div className="space-y-3">
            {steps.map((step, i) => {
              const Icon = step.icon;
              const isDone = i < activeStep;
              const isActive = i === activeStep;

              return (
                <div
                  key={i}
                  className={`
                    flex items-center gap-3 p-4 rounded-xl transition-all duration-500
                    ${isActive ? "bg-accent/5 border border-accent/10" : ""}
                    ${isDone ? "bg-success/5 border border-success/10" : ""}
                    ${!isActive && !isDone ? "opacity-30" : ""}
                  `}
                >
                  <div
                    className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${
                      isDone
                        ? "bg-success/15 text-success"
                        : isActive
                        ? "bg-accent/15 text-accent"
                        : "bg-bg-secondary text-text-muted"
                    }`}
                  >
                    {isDone ? (
                      <CheckCircle2 size={14} />
                    ) : isActive ? (
                      <Loader2 size={14} className="animate-spin" />
                    ) : (
                      <Icon size={14} />
                    )}
                  </div>
                  <span
                    className={`text-sm ${
                      isDone
                        ? "text-success"
                        : isActive
                        ? "text-text-primary font-medium"
                        : "text-text-muted"
                    }`}
                  >
                    {isDone ? step.label.replace("...", " 완료") : step.label}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        <p className="text-center text-sm text-text-muted mt-6">
          {isGenerating
            ? "대본 생성에 30초~1분 정도 소요됩니다"
            : "영상 수집 + AI 분석에 30초~1분 정도 소요됩니다"}
        </p>
      </div>
    </div>
  );
}
