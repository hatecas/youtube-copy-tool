"use client";

import { useState } from "react";
import {
  TrendingUp,
  Users,
  Sparkles,
  ArrowRight,
  RefreshCw,
  Eye,
  ChevronDown,
  ChevronUp,
  BarChart3,
  FileText,
  Loader2,
} from "lucide-react";
import { AnalyzedVideo, TopicSuggestion } from "@/lib/types";
import { formatViewCount, formatDate } from "@/lib/api";

interface TopicSelectStepProps {
  videos: AnalyzedVideo[];
  topics: TopicSuggestion[];
  onSelectTopic: (topic: TopicSuggestion) => void;
  onRetry: () => void;
  isRetrying?: boolean;
}

export default function TopicSelectStep({
  videos,
  topics,
  onSelectTopic,
  onRetry,
  isRetrying,
}: TopicSelectStepProps) {
  const [showVideos, setShowVideos] = useState(true); // 기본 펼침
  const [hoveredTopic, setHoveredTopic] = useState<string | null>(null);
  const [expandedTranscript, setExpandedTranscript] = useState<string | null>(null);

  // 조회수 높은 순 정렬
  const sortedVideos = [...videos].sort((a, b) => b.viewCount - a.viewCount);

  return (
    <div className="animate-fade-in-up">
      <div className="text-center mb-6 sm:mb-8">
        <div className="inline-flex items-center gap-2 badge badge-success mb-3 sm:mb-4">
          <Sparkles size={12} />
          분석 완료
        </div>
        <h2 className="text-2xl sm:text-3xl font-bold mb-2 sm:mb-3 tracking-tight">
          분석 결과 & 주제 추천
        </h2>
        <p className="text-sm sm:text-base text-text-secondary px-2">
          레퍼런스 영상 {videos.length}개를 분석했습니다. 아래에서 추천 주제를 선택하세요.
        </p>
      </div>

      {/* 분석된 영상 상세 (기본 펼침) */}
      <div className="max-w-3xl mx-auto mb-6 sm:mb-8">
        <button
          onClick={() => setShowVideos(!showVideos)}
          className="card w-full p-3 sm:p-4 flex items-center justify-between group"
        >
          <div className="flex items-center gap-2 sm:gap-3">
            <BarChart3 size={16} className="text-accent sm:w-[18px] sm:h-[18px]" />
            <span className="text-sm font-bold">
              분석된 영상 {videos.length}개
            </span>
            <span className="text-xs text-text-muted hidden sm:inline">
              (조회수 높은 순)
            </span>
          </div>
          {showVideos ? (
            <ChevronUp size={16} className="text-text-muted" />
          ) : (
            <ChevronDown size={16} className="text-text-muted" />
          )}
        </button>

        {showVideos && (
          <div className="mt-2 space-y-3 animate-fade-in-up">
            {sortedVideos.map((video, i) => (
              <div key={video.id} className="card p-3 sm:p-4">
                <div className="flex items-start gap-2 sm:gap-4">
                  <div className="text-base sm:text-lg font-bold text-text-muted w-5 sm:w-6 text-center flex-shrink-0 pt-1">
                    {i + 1}
                  </div>
                  <div className="w-20 h-12 sm:w-28 sm:h-16 rounded-lg overflow-hidden flex-shrink-0 bg-bg-secondary">
                    <img
                      src={video.thumbnail}
                      alt={video.title}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        const img = e.target as HTMLImageElement;
                        if (img.src.includes("maxresdefault")) {
                          img.src = img.src.replace("maxresdefault", "hqdefault");
                        }
                      }}
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs sm:text-sm font-bold mb-1 leading-snug line-clamp-2">{video.title}</p>
                    <div className="flex flex-wrap items-center gap-x-2 sm:gap-x-3 gap-y-1 mb-2">
                      <span className="text-[10px] sm:text-xs text-text-muted">
                        {video.channelName}
                      </span>
                      <span className="flex items-center gap-1 text-[10px] sm:text-xs text-text-muted">
                        <Eye size={10} />
                        {formatViewCount(video.viewCount)}
                      </span>
                      <span className="text-[10px] sm:text-xs text-text-muted hidden sm:inline">
                        {formatDate(video.publishedAt)}
                      </span>
                      {video.viewRatio > 1.5 && (
                        <span className="badge badge-accent text-[9px] sm:text-[10px] py-0">
                          <TrendingUp size={8} className="mr-0.5 sm:w-[9px] sm:h-[9px]" />
                          {video.viewRatio.toFixed(1)}x
                        </span>
                      )}
                    </div>

                    {/* 대본 미리보기 */}
                    {video.transcript && video.transcript !== "자막을 추출할 수 없습니다." && (
                      <div>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setExpandedTranscript(
                              expandedTranscript === video.id ? null : video.id
                            );
                          }}
                          className="flex items-center gap-1.5 text-[10px] sm:text-xs text-accent hover:text-accent/80 transition-colors"
                        >
                          <FileText size={10} />
                          {expandedTranscript === video.id ? "대본 접기" : "대본 보기"}
                        </button>
                        {expandedTranscript === video.id && (
                          <div className="mt-2 p-2 sm:p-3 bg-bg-primary rounded-lg text-[10px] sm:text-xs text-text-muted leading-relaxed max-h-32 sm:max-h-40 overflow-y-auto">
                            {video.transcript.slice(0, 800)}
                            {video.transcript.length > 800 && "..."}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 주제 카드들 */}
      <div className="max-w-3xl mx-auto mb-4">
        <div className="flex items-center gap-2 mb-4">
          <Sparkles size={16} className="text-accent" />
          <h3 className="text-base sm:text-lg font-bold">AI 추천 주제</h3>
        </div>
      </div>

      <div className="max-w-3xl mx-auto space-y-3 sm:space-y-4 mb-6 sm:mb-8">
        {topics.map((topic, i) => (
          <div
            key={topic.id}
            className={`
              card p-4 sm:p-6 cursor-pointer transition-all duration-300
              animate-fade-in-up stagger-${i + 1}
              ${hoveredTopic === topic.id ? "border-accent/50 bg-bg-card-hover" : ""}
            `}
            onMouseEnter={() => setHoveredTopic(topic.id)}
            onMouseLeave={() => setHoveredTopic(null)}
            onClick={() => onSelectTopic(topic)}
          >
            <div className="flex items-start justify-between gap-3 sm:gap-4">
              <div className="flex-1 min-w-0">
                {/* Confidence badge */}
                <div className="flex items-center gap-2 mb-2 sm:mb-3">
                  <div
                    className={`badge text-[10px] sm:text-[11px] ${
                      topic.confidence >= 80
                        ? "badge-success"
                        : topic.confidence >= 60
                        ? "badge-accent"
                        : "bg-warning/10 text-warning border border-warning/20"
                    }`}
                  >
                    적중률 {topic.confidence}%
                  </div>
                  <span className="text-[10px] sm:text-xs text-text-muted">추천 #{i + 1}</span>
                </div>

                {/* Topic title */}
                <h3 className="text-base sm:text-lg font-bold mb-1.5 sm:mb-2">{topic.topic}</h3>

                {/* Target */}
                <div className="flex items-center gap-2 mb-2 sm:mb-3">
                  <Users size={12} className="text-text-muted sm:w-[14px] sm:h-[14px]" />
                  <span className="text-xs sm:text-sm text-text-secondary">
                    타겟: {topic.target}
                  </span>
                </div>

                {/* Reasoning */}
                <p className="text-xs sm:text-sm text-text-muted leading-relaxed">
                  {topic.reasoning}
                </p>
              </div>

              {/* Select button */}
              <button
                className={`
                  flex-shrink-0 w-9 h-9 sm:w-10 sm:h-10 rounded-xl border transition-all flex items-center justify-center
                  ${
                    hoveredTopic === topic.id
                      ? "bg-accent border-accent text-white"
                      : "border-border text-text-muted"
                  }
                `}
              >
                <ArrowRight size={16} />
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* 재시도 */}
      <div className="max-w-3xl mx-auto text-center">
        <button
          onClick={onRetry}
          disabled={isRetrying}
          className="btn-secondary inline-flex items-center gap-2 text-xs sm:text-sm disabled:opacity-50"
        >
          {isRetrying ? (
            <Loader2 size={14} className="animate-spin" />
          ) : (
            <RefreshCw size={14} />
          )}
          {isRetrying
            ? "새로운 주제 추천 받는 중..."
            : "다시 추천받기"}
        </button>
      </div>
    </div>
  );
}
