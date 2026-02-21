"use client";

import { useState } from "react";
import {
  Image,
  Type,
  FileText,
  Copy,
  Check,
  ArrowLeft,
  RotateCcw,
  Users,
  Sparkles,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { GeneratedContent, AnalyzedVideo } from "@/lib/types";

interface ResultStepProps {
  content: GeneratedContent;
  videos: AnalyzedVideo[];
  onReset: () => void;
  onBack: () => void;
}

export default function ResultStep({ content, onReset, onBack }: ResultStepProps) {
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [expandedScript, setExpandedScript] = useState<string | null>(
    content.scripts[0]?.id || null
  );

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const CopyButton = ({ text, id }: { text: string; id: string }) => (
    <button
      onClick={() => copyToClipboard(text, id)}
      className="flex-shrink-0 p-2 rounded-lg hover:bg-bg-secondary transition-colors text-text-muted hover:text-accent"
      title="복사"
    >
      {copiedId === id ? (
        <Check size={14} className="text-success" />
      ) : (
        <Copy size={14} />
      )}
    </button>
  );

  return (
    <div className="animate-fade-in-up">
      {/* Header */}
      <div className="text-center mb-6 sm:mb-10">
        <div className="inline-flex items-center gap-2 badge badge-success mb-3 sm:mb-4">
          <Sparkles size={12} />
          생성 완료
        </div>
        <h2 className="text-2xl sm:text-3xl font-bold mb-2 sm:mb-3 tracking-tight">
          콘텐츠가 준비되었습니다
        </h2>
        <p className="text-sm sm:text-base text-text-secondary max-w-lg mx-auto px-2">
          <span className="text-accent font-medium">{content.selectedTopic.topic}</span>
          {" "}주제로 생성된 결과물입니다
        </p>
      </div>

      <div className="max-w-3xl mx-auto space-y-4 sm:space-y-6">
        {/* 섹션 1: 썸네일 텍스트 문구 */}
        <section className="card p-4 sm:p-6 animate-fade-in-up stagger-1">
          <div className="flex items-center gap-2.5 sm:gap-3 mb-4 sm:mb-5">
            <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center">
              <Image size={14} className="text-purple-400 sm:w-[16px] sm:h-[16px]" />
            </div>
            <div>
              <h3 className="text-sm sm:text-base font-bold">썸네일 텍스트 문구</h3>
              <p className="text-[10px] sm:text-xs text-text-muted">추천 3개</p>
            </div>
          </div>

          <div className="space-y-2">
            {content.thumbnailTexts.map((text, i) => (
              <div
                key={i}
                className="flex items-center justify-between gap-2 sm:gap-3 p-3 sm:p-4 bg-bg-secondary rounded-xl border border-border/50"
              >
                <div className="flex items-center gap-2 sm:gap-3 min-w-0">
                  <span className="text-xs font-bold text-text-muted w-4 sm:w-5 flex-shrink-0">
                    {i + 1}
                  </span>
                  <span className="text-xs sm:text-sm font-semibold break-words">{text}</span>
                </div>
                <CopyButton text={text} id={`thumb-${i}`} />
              </div>
            ))}
          </div>
        </section>

        {/* 섹션 2: 제목 추천 */}
        <section className="card p-4 sm:p-6 animate-fade-in-up stagger-2">
          <div className="flex items-center gap-2.5 sm:gap-3 mb-4 sm:mb-5">
            <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center">
              <Type size={14} className="text-blue-400 sm:w-[16px] sm:h-[16px]" />
            </div>
            <div>
              <h3 className="text-sm sm:text-base font-bold">제목 추천</h3>
              <p className="text-[10px] sm:text-xs text-text-muted">추천 2개</p>
            </div>
          </div>

          <div className="space-y-2">
            {content.titleSuggestions.map((title, i) => (
              <div
                key={i}
                className="flex items-center justify-between gap-2 sm:gap-3 p-3 sm:p-4 bg-bg-secondary rounded-xl border border-border/50"
              >
                <div className="flex items-center gap-2 sm:gap-3 min-w-0">
                  <span className="text-xs font-bold text-text-muted w-4 sm:w-5 flex-shrink-0">
                    {i + 1}
                  </span>
                  <span className="text-xs sm:text-sm font-medium break-words">{title}</span>
                </div>
                <CopyButton text={title} id={`title-${i}`} />
              </div>
            ))}
          </div>
        </section>

        {/* 섹션 3: 인트로~대본 */}
        <section className="card p-4 sm:p-6 animate-fade-in-up stagger-3">
          <div className="flex items-center gap-2.5 sm:gap-3 mb-4 sm:mb-5">
            <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-accent/10 border border-accent/20 flex items-center justify-center">
              <FileText size={14} className="text-accent sm:w-[16px] sm:h-[16px]" />
            </div>
            <div>
              <h3 className="text-sm sm:text-base font-bold">인트로 & 대본</h3>
              <p className="text-[10px] sm:text-xs text-text-muted">
                타겟별 2개 버전
              </p>
            </div>
          </div>

          <div className="space-y-3">
            {content.scripts.map((script, i) => (
              <div
                key={script.id}
                className="bg-bg-secondary rounded-xl border border-border/50 overflow-hidden"
              >
                {/* Script header */}
                <button
                  onClick={() =>
                    setExpandedScript(
                      expandedScript === script.id ? null : script.id
                    )
                  }
                  className="w-full flex items-center justify-between p-3 sm:p-4 hover:bg-bg-card transition-colors"
                >
                  <div className="flex items-center gap-2 sm:gap-3">
                    <div className="w-6 h-6 sm:w-7 sm:h-7 rounded-lg bg-accent/10 flex items-center justify-center">
                      <Users size={11} className="text-accent sm:w-[12px] sm:h-[12px]" />
                    </div>
                    <div className="text-left">
                      <p className="text-xs sm:text-sm font-semibold">버전 {i + 1}</p>
                      <p className="text-[10px] sm:text-xs text-text-muted">
                        {script.targetDescription}
                      </p>
                    </div>
                  </div>
                  {expandedScript === script.id ? (
                    <ChevronUp size={16} className="text-text-muted" />
                  ) : (
                    <ChevronDown size={16} className="text-text-muted" />
                  )}
                </button>

                {/* Script content */}
                {expandedScript === script.id && (
                  <div className="px-3 pb-3 sm:px-4 sm:pb-4 animate-fade-in-up">
                    {/* Intro */}
                    <div className="mb-3 sm:mb-4">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-[10px] sm:text-xs font-bold text-accent uppercase tracking-wider">
                          인트로
                        </span>
                        <CopyButton text={script.intro} id={`intro-${script.id}`} />
                      </div>
                      <div className="p-3 sm:p-4 bg-bg-primary rounded-xl text-xs sm:text-sm leading-relaxed text-text-secondary">
                        {script.intro}
                      </div>
                    </div>

                    {/* Body */}
                    <div className="mb-3 sm:mb-4">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-[10px] sm:text-xs font-bold text-blue-400 uppercase tracking-wider">
                          본문 구성
                        </span>
                        <CopyButton text={script.body} id={`body-${script.id}`} />
                      </div>
                      <div className="p-3 sm:p-4 bg-bg-primary rounded-xl text-xs sm:text-sm leading-relaxed text-text-secondary whitespace-pre-line">
                        {script.body}
                      </div>
                    </div>

                    {/* Full copy */}
                    <button
                      onClick={() =>
                        copyToClipboard(
                          `[인트로]\n${script.intro}\n\n[본문]\n${script.body}`,
                          `full-${script.id}`
                        )
                      }
                      className="w-full py-2.5 sm:py-3 rounded-xl border border-border hover:border-accent text-xs sm:text-sm text-text-secondary hover:text-accent transition-all flex items-center justify-center gap-2"
                    >
                      {copiedId === `full-${script.id}` ? (
                        <>
                          <Check size={14} className="text-success" />
                          복사됨!
                        </>
                      ) : (
                        <>
                          <Copy size={14} />
                          전체 대본 복사
                        </>
                      )}
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        </section>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 sm:gap-0 pt-4 animate-fade-in-up stagger-4">
          <button onClick={onBack} className="btn-secondary flex items-center justify-center gap-2 text-sm">
            <ArrowLeft size={14} />
            주제 다시 선택
          </button>
          <button onClick={onReset} className="btn-primary flex items-center justify-center gap-2">
            <RotateCcw size={14} />
            새 프로젝트 시작
          </button>
        </div>
      </div>
    </div>
  );
}
