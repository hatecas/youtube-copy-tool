"use client";

import { Loader2, Search, Brain, FileText } from "lucide-react";

interface AnalysisStepProps {
  videoUrls: string[];
  isGenerating?: boolean;
}

export default function AnalysisStep({ videoUrls, isGenerating }: AnalysisStepProps) {
  const steps = isGenerating
    ? [
        { icon: Brain, label: "선택한 주제 기반 콘텐츠 기획중...", done: false },
        { icon: FileText, label: "썸네일 & 제목 생성중...", done: false },
        { icon: FileText, label: "타겟별 대본 작성중...", done: false },
      ]
    : [
        { icon: Search, label: "영상 정보 수집중...", done: false },
        { icon: FileText, label: "자막/대본 추출중...", done: false },
        { icon: Brain, label: "AI 분석 & 주제 추천 생성중...", done: false },
      ];

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
            ? "선택하신 주제에 맞는 최적의 콘텐츠를 만들고 있습니다"
            : `${videoUrls.length}개 영상의 썸네일, 제목, 대본을 분석중입니다`}
        </p>
      </div>

      {/* Loading animation */}
      <div className="max-w-md mx-auto">
        <div className="card p-8 animate-pulse-glow">
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
          <div className="space-y-4">
            {steps.map((step, i) => {
              const Icon = step.icon;
              return (
                <div
                  key={i}
                  className={`
                    flex items-center gap-3 p-3 rounded-xl transition-all
                    ${i === 0 ? "bg-accent/5 border border-accent/10" : "opacity-40"}
                  `}
                >
                  <div
                    className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                      i === 0 ? "bg-accent/15 text-accent" : "bg-bg-secondary text-text-muted"
                    }`}
                  >
                    {i === 0 ? (
                      <Loader2 size={14} className="animate-spin" />
                    ) : (
                      <Icon size={14} />
                    )}
                  </div>
                  <span className={`text-sm ${i === 0 ? "text-text-primary" : "text-text-muted"}`}>
                    {step.label}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        <p className="text-center text-sm text-text-muted mt-6">
          보통 30초~1분 정도 소요됩니다
        </p>
      </div>
    </div>
  );
}
