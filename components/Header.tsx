"use client";

import { Youtube, RotateCcw } from "lucide-react";

interface HeaderProps {
  onReset: () => void;
}

export default function Header({ onReset }: HeaderProps) {
  return (
    <header className="sticky top-0 z-50 backdrop-blur-xl bg-bg-primary/80 border-b border-border">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 h-14 sm:h-16 flex items-center justify-between">
        <div className="flex items-center gap-2.5 sm:gap-3 cursor-pointer" onClick={onReset}>
          <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-accent/10 border border-accent/20 flex items-center justify-center">
            <Youtube size={16} className="text-accent sm:w-[18px] sm:h-[18px]" />
          </div>
          <div>
            <h1 className="text-[14px] sm:text-[15px] font-bold text-text-primary tracking-tight">
              YouTube Copy Tool
            </h1>
            <p className="text-[10px] sm:text-[11px] text-text-muted -mt-0.5 hidden sm:block">
              영상 분석 & 콘텐츠 생성
            </p>
          </div>
        </div>

        <button
          onClick={onReset}
          className="flex items-center gap-1.5 sm:gap-2 text-xs sm:text-sm text-text-secondary hover:text-accent transition-colors"
        >
          <RotateCcw size={14} />
          <span>새로 시작</span>
        </button>
      </div>
    </header>
  );
}
