"use client";

import { Youtube, RotateCcw } from "lucide-react";

interface HeaderProps {
  onReset: () => void;
}

export default function Header({ onReset }: HeaderProps) {
  return (
    <header className="sticky top-0 z-50 backdrop-blur-xl bg-bg-primary/80 border-b border-border">
      <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
        <div className="flex items-center gap-3 cursor-pointer" onClick={onReset}>
          <div className="w-9 h-9 rounded-xl bg-accent/10 border border-accent/20 flex items-center justify-center">
            <Youtube size={18} className="text-accent" />
          </div>
          <div>
            <h1 className="text-[15px] font-bold text-text-primary tracking-tight">
              YouTube Copy Tool
            </h1>
            <p className="text-[11px] text-text-muted -mt-0.5">
              영상 분석 & 콘텐츠 생성
            </p>
          </div>
        </div>

        <button
          onClick={onReset}
          className="flex items-center gap-2 text-sm text-text-secondary hover:text-accent transition-colors"
        >
          <RotateCcw size={14} />
          새로 시작
        </button>
      </div>
    </header>
  );
}
