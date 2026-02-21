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
} from "lucide-react";
import { AnalyzedVideo, TopicSuggestion } from "@/lib/types";
import { formatViewCount, formatDate } from "@/lib/api";

interface TopicSelectStepProps {
  videos: AnalyzedVideo[];
  topics: TopicSuggestion[];
  onSelectTopic: (topic: TopicSuggestion) => void;
  onRetry: () => void;
}

export default function TopicSelectStep({
  videos,
  topics,
  onSelectTopic,
  onRetry,
}: TopicSelectStepProps) {
  const [showVideos, setShowVideos] = useState(false);
  const [hoveredTopic, setHoveredTopic] = useState<string | null>(null);

  // 조회수 높은 순 정렬
  const sortedVideos = [...videos].sort((a, b) => b.viewCount - a.viewCount);

  return (
    <div className="animate-fade-in-up">
      <div className="text-center mb-8">
        <div className="inline-flex items-center gap-2 badge badge-success mb-4">
          <Sparkles size={12} />
          분석 완료
        </div>
        <h2 className="text-3xl font-bold mb-3 tracking-tight">
          주제를 선택하세요
        </h2>
        <p className="text-text-secondary">
          레퍼런스 영상 분석 결과 아래 주제들이 높은 성과를 낼 것으로 예측됩니다
        </p>
      </div>

      {/* 분석된 영상 요약 (접이식) */}
      <div className="max-w-3xl mx-auto mb-8">
        <button
          onClick={() => setShowVideos(!showVideos)}
          className="card w-full p-4 flex items-center justify-between group"
        >
          <div className="flex items-center gap-3">
            <BarChart3 size={18} className="text-accent" />
            <span className="text-sm font-medium">
              분석된 영상 {videos.length}개
            </span>
            <span className="text-xs text-text-muted">
              (조회수 높은 순 정렬)
            </span>
          </div>
          {showVideos ? (
            <ChevronUp size={16} className="text-text-muted" />
          ) : (
            <ChevronDown size={16} className="text-text-muted" />
          )}
        </button>

        {showVideos && (
          <div className="mt-2 space-y-2 animate-fade-in-up">
            {sortedVideos.map((video, i) => (
              <div key={video.id} className="card p-4 flex items-center gap-4">
                <div className="text-lg font-bold text-text-muted w-6 text-center">
                  {i + 1}
                </div>
                <div className="w-24 h-14 rounded-lg overflow-hidden flex-shrink-0 bg-bg-secondary">
                  <img
                    src={video.thumbnail}
                    alt={video.title}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{video.title}</p>
                  <div className="flex items-center gap-3 mt-1">
                    <span className="text-xs text-text-muted">
                      {video.channelName}
                    </span>
                    <span className="flex items-center gap-1 text-xs text-text-muted">
                      <Eye size={10} />
                      {formatViewCount(video.viewCount)}
                    </span>
                    <span className="text-xs text-text-muted">
                      {formatDate(video.publishedAt)}
                    </span>
                  </div>
                </div>
                {video.viewRatio > 1.5 && (
                  <div className="badge badge-accent text-[11px]">
                    <TrendingUp size={10} className="mr-1" />
                    {video.viewRatio.toFixed(1)}x
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 주제 카드들 */}
      <div className="max-w-3xl mx-auto space-y-4 mb-8">
        {topics.map((topic, i) => (
          <div
            key={topic.id}
            className={`
              card p-6 cursor-pointer transition-all duration-300
              animate-fade-in-up stagger-${i + 1}
              ${hoveredTopic === topic.id ? "border-accent/50 bg-bg-card-hover" : ""}
            `}
            onMouseEnter={() => setHoveredTopic(topic.id)}
            onMouseLeave={() => setHoveredTopic(null)}
            onClick={() => onSelectTopic(topic)}
          >
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1">
                {/* Confidence badge */}
                <div className="flex items-center gap-2 mb-3">
                  <div
                    className={`badge text-[11px] ${
                      topic.confidence >= 80
                        ? "badge-success"
                        : topic.confidence >= 60
                        ? "badge-accent"
                        : "bg-warning/10 text-warning border border-warning/20"
                    }`}
                  >
                    적중률 {topic.confidence}%
                  </div>
                  <span className="text-xs text-text-muted">추천 #{i + 1}</span>
                </div>

                {/* Topic title */}
                <h3 className="text-lg font-bold mb-2">{topic.topic}</h3>

                {/* Target */}
                <div className="flex items-center gap-2 mb-3">
                  <Users size={14} className="text-text-muted" />
                  <span className="text-sm text-text-secondary">
                    타겟: {topic.target}
                  </span>
                </div>

                {/* Reasoning */}
                <p className="text-sm text-text-muted leading-relaxed">
                  {topic.reasoning}
                </p>
              </div>

              {/* Select button */}
              <button
                className={`
                  flex-shrink-0 w-10 h-10 rounded-xl border transition-all flex items-center justify-center
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
          className="btn-secondary inline-flex items-center gap-2 text-sm"
        >
          <RefreshCw size={14} />
          마음에 드는 주제가 없어요 — 다시 추천받기
        </button>
      </div>
    </div>
  );
}
