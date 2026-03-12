"use client";

import { useState } from "react";
import {
  CheckCircle,
  Image,
  Type,
  FileText,
  Edit3,
  ArrowLeft,
  ArrowRight,
  Sparkles,
} from "lucide-react";
import { GeneratedContent, ConfirmedContent, ScriptVariant } from "@/lib/types";

interface ConfirmStepProps {
  content: GeneratedContent;
  onConfirm: (confirmed: ConfirmedContent) => void;
  onBack: () => void;
}

export default function ConfirmStep({ content, onConfirm, onBack }: ConfirmStepProps) {
  const [selectedTitle, setSelectedTitle] = useState(content.titleSuggestions[0] || "");
  const [selectedThumbnail, setSelectedThumbnail] = useState(content.thumbnailTexts[0] || "");
  const [selectedScriptIdx, setSelectedScriptIdx] = useState(0);
  const [editingTitle, setEditingTitle] = useState(false);
  const [editingThumbnail, setEditingThumbnail] = useState(false);
  const [customTitle, setCustomTitle] = useState("");
  const [customThumbnail, setCustomThumbnail] = useState("");

  const selectedScript = content.scripts[selectedScriptIdx];

  const handleConfirm = () => {
    onConfirm({
      title: selectedTitle,
      thumbnailText: selectedThumbnail,
      script: selectedScript,
      topic: content.selectedTopic,
    });
  };

  return (
    <div className="animate-fade-in-up">
      {/* Header */}
      <div className="text-center mb-10">
        <div className="inline-flex items-center gap-2 badge badge-accent mb-4">
          <CheckCircle size={12} />
          최종 확정
        </div>
        <h2 className="text-3xl font-bold mb-3 tracking-tight">
          콘텐츠를 확정해주세요
        </h2>
        <p className="text-text-secondary max-w-lg mx-auto">
          각 항목을 선택하거나 직접 수정할 수 있습니다
        </p>
      </div>

      <div className="max-w-3xl mx-auto space-y-6">
        {/* 제목 선택 */}
        <section className="card p-6 animate-fade-in-up stagger-1">
          <div className="flex items-center gap-3 mb-5">
            <div className="w-9 h-9 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center">
              <Type size={16} className="text-blue-400" />
            </div>
            <div>
              <h3 className="font-bold">영상 제목</h3>
              <p className="text-xs text-text-muted">하나를 선택하거나 직접 수정하세요</p>
            </div>
          </div>

          <div className="space-y-2">
            {content.titleSuggestions.map((title, i) => (
              <button
                key={i}
                onClick={() => { setSelectedTitle(title); setEditingTitle(false); }}
                className={`w-full text-left p-4 rounded-xl border transition-all ${
                  selectedTitle === title && !editingTitle
                    ? "border-accent bg-accent/5"
                    : "border-border/50 bg-bg-secondary hover:border-border"
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${
                    selectedTitle === title && !editingTitle ? "border-accent" : "border-text-muted"
                  }`}>
                    {selectedTitle === title && !editingTitle && (
                      <div className="w-2.5 h-2.5 rounded-full bg-accent" />
                    )}
                  </div>
                  <span className="text-sm font-medium">{title}</span>
                </div>
              </button>
            ))}

            {/* 직접 수정 */}
            <button
              onClick={() => {
                setEditingTitle(true);
                setCustomTitle(selectedTitle);
              }}
              className={`w-full text-left p-4 rounded-xl border transition-all ${
                editingTitle
                  ? "border-accent bg-accent/5"
                  : "border-border/50 bg-bg-secondary hover:border-border"
              }`}
            >
              <div className="flex items-center gap-3">
                <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${
                  editingTitle ? "border-accent" : "border-text-muted"
                }`}>
                  {editingTitle && <div className="w-2.5 h-2.5 rounded-full bg-accent" />}
                </div>
                <Edit3 size={14} className="text-text-muted" />
                <span className="text-sm text-text-muted">직접 수정</span>
              </div>
            </button>

            {editingTitle && (
              <input
                type="text"
                value={customTitle}
                onChange={(e) => {
                  setCustomTitle(e.target.value);
                  setSelectedTitle(e.target.value);
                }}
                className="input-field mt-2"
                placeholder="제목을 입력하세요"
                autoFocus
              />
            )}
          </div>
        </section>

        {/* 썸네일 텍스트 선택 */}
        <section className="card p-6 animate-fade-in-up stagger-2">
          <div className="flex items-center gap-3 mb-5">
            <div className="w-9 h-9 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center">
              <Image size={16} className="text-purple-400" />
            </div>
            <div>
              <h3 className="font-bold">썸네일 텍스트</h3>
              <p className="text-xs text-text-muted">썸네일에 들어갈 문구를 선택하세요</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {content.thumbnailTexts.map((text, i) => (
              <button
                key={i}
                onClick={() => { setSelectedThumbnail(text); setEditingThumbnail(false); }}
                className={`p-4 rounded-xl border transition-all text-center ${
                  selectedThumbnail === text && !editingThumbnail
                    ? "border-accent bg-accent/5"
                    : "border-border/50 bg-bg-secondary hover:border-border"
                }`}
              >
                <span className="text-lg font-bold">{text}</span>
              </button>
            ))}
          </div>

          <button
            onClick={() => {
              setEditingThumbnail(true);
              setCustomThumbnail(selectedThumbnail);
            }}
            className={`w-full mt-3 text-left p-3 rounded-xl border transition-all ${
              editingThumbnail
                ? "border-accent bg-accent/5"
                : "border-border/50 bg-bg-secondary hover:border-border"
            }`}
          >
            <div className="flex items-center gap-2 justify-center">
              <Edit3 size={14} className="text-text-muted" />
              <span className="text-sm text-text-muted">직접 수정</span>
            </div>
          </button>

          {editingThumbnail && (
            <input
              type="text"
              value={customThumbnail}
              onChange={(e) => {
                setCustomThumbnail(e.target.value);
                setSelectedThumbnail(e.target.value);
              }}
              className="input-field mt-2"
              placeholder="썸네일 텍스트를 입력하세요"
              autoFocus
            />
          )}
        </section>

        {/* 대본 선택 */}
        <section className="card p-6 animate-fade-in-up stagger-3">
          <div className="flex items-center gap-3 mb-5">
            <div className="w-9 h-9 rounded-xl bg-accent/10 border border-accent/20 flex items-center justify-center">
              <FileText size={16} className="text-accent" />
            </div>
            <div>
              <h3 className="font-bold">대본 선택</h3>
              <p className="text-xs text-text-muted">제작에 사용할 대본 버전을 선택하세요</p>
            </div>
          </div>

          <div className="space-y-3">
            {content.scripts.map((script, i) => (
              <button
                key={script.id}
                onClick={() => setSelectedScriptIdx(i)}
                className={`w-full text-left p-4 rounded-xl border transition-all ${
                  selectedScriptIdx === i
                    ? "border-accent bg-accent/5"
                    : "border-border/50 bg-bg-secondary hover:border-border"
                }`}
              >
                <div className="flex items-start gap-3">
                  <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 mt-0.5 ${
                    selectedScriptIdx === i ? "border-accent" : "border-text-muted"
                  }`}>
                    {selectedScriptIdx === i && (
                      <div className="w-2.5 h-2.5 rounded-full bg-accent" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold mb-1">버전 {i + 1}</p>
                    <p className="text-xs text-text-muted mb-2">{script.targetDescription}</p>
                    <p className="text-xs text-text-secondary line-clamp-3">
                      {script.intro.slice(0, 150)}...
                    </p>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </section>

        {/* 확정 요약 */}
        <section className="card p-6 animate-fade-in-up stagger-4 border-accent/30">
          <div className="flex items-center gap-3 mb-4">
            <Sparkles size={18} className="text-accent" />
            <h3 className="font-bold">확정 내용 요약</h3>
          </div>
          <div className="space-y-3 text-sm">
            <div className="flex gap-3">
              <span className="text-text-muted flex-shrink-0 w-20">제목</span>
              <span className="font-medium">{selectedTitle}</span>
            </div>
            <div className="flex gap-3">
              <span className="text-text-muted flex-shrink-0 w-20">썸네일</span>
              <span className="font-bold text-accent">{selectedThumbnail}</span>
            </div>
            <div className="flex gap-3">
              <span className="text-text-muted flex-shrink-0 w-20">대본</span>
              <span>버전 {selectedScriptIdx + 1} - {selectedScript?.targetDescription}</span>
            </div>
          </div>
        </section>

        {/* Actions */}
        <div className="flex items-center justify-between pt-4 animate-fade-in-up stagger-5">
          <button onClick={onBack} className="btn-secondary flex items-center gap-2 text-sm">
            <ArrowLeft size={14} />
            결과 다시 보기
          </button>
          <button onClick={handleConfirm} className="btn-primary flex items-center gap-2">
            확정하고 제작 시작
            <ArrowRight size={14} />
          </button>
        </div>
      </div>
    </div>
  );
}
