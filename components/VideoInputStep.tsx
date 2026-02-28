"use client";

import { useState, useEffect } from "react";
import { Plus, Trash2, ArrowRight, Link2, AlertCircle, RefreshCw, Sparkles, CheckSquare, Square } from "lucide-react";
import { extractVideoId, getThumbnailUrl } from "@/lib/api";

interface RecommendedVideo {
  videoId: string;
  title: string;
  channelName: string;
  thumbnail: string;
  viewCount: number;
  publishedAt: string;
  url: string;
}

interface VideoInputStepProps {
  onSubmit: (urls: string[]) => void;
}

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:5000";

export default function VideoInputStep({ onSubmit }: VideoInputStepProps) {
  const [urls, setUrls] = useState<string[]>(["", "", ""]);
  const [errors, setErrors] = useState<boolean[]>([false, false, false]);

  // 추천 영상 관련 상태
  const [recommended, setRecommended] = useState<RecommendedVideo[]>([]);
  const [selectedVideos, setSelectedVideos] = useState<RecommendedVideo[]>([]); // 누적 선택
  const [loadingRecommend, setLoadingRecommend] = useState(false);
  const [recommendQuery, setRecommendQuery] = useState("");
  const [mode, setMode] = useState<"recommend" | "manual">("recommend");

  // 컴포넌트 마운트 시 자동 추천
  useEffect(() => {
    fetchRecommended();
  }, []);

  const fetchRecommended = async () => {
    setLoadingRecommend(true);
    try {
      const res = await fetch(`${BACKEND_URL}/api/recommend`);
      const data = await res.json();
      setRecommended(data.videos || []);
      setRecommendQuery(data.query || "");
    } catch (e) {
      console.error("추천 로드 실패:", e);
    } finally {
      setLoadingRecommend(false);
    }
  };

  const toggleSelect = (video: RecommendedVideo) => {
    const alreadySelected = selectedVideos.some((v) => v.videoId === video.videoId);
    if (alreadySelected) {
      setSelectedVideos(selectedVideos.filter((v) => v.videoId !== video.videoId));
    } else {
      if (selectedVideos.length >= 5) return; // 최대 5개
      setSelectedVideos([...selectedVideos, video]);
    }
  };

  const handleRecommendSubmit = () => {
    if (selectedVideos.length < 3) return;
    onSubmit(selectedVideos.map((v) => v.url));
  };

  // 수동 입력 관련
  const addUrl = () => {
    if (urls.length < 10) {
      setUrls([...urls, ""]);
      setErrors([...errors, false]);
    }
  };

  const removeUrl = (index: number) => {
    if (urls.length > 3) {
      setUrls(urls.filter((_, i) => i !== index));
      setErrors(errors.filter((_, i) => i !== index));
    }
  };

  const updateUrl = (index: number, value: string) => {
    const newUrls = [...urls];
    newUrls[index] = value;
    setUrls(newUrls);
    const newErrors = [...errors];
    newErrors[index] = false;
    setErrors(newErrors);
  };

  const validateAndSubmit = () => {
    const newErrors = urls.map((url) => {
      if (!url.trim()) return true;
      return !extractVideoId(url);
    });
    setErrors(newErrors);
    const validUrls = urls.filter((url, i) => !newErrors[i] && url.trim());
    if (validUrls.length >= 3) {
      onSubmit(validUrls);
    }
  };

  const validCount = urls.filter((url) => url.trim() && extractVideoId(url)).length;

  return (
    <div className="animate-fade-in-up">
      {/* Hero */}
      <div className="text-center mb-8">
        <div className="inline-flex items-center gap-2 badge badge-accent mb-4">
          <span className="w-1.5 h-1.5 rounded-full bg-accent animate-pulse" />
          STEP 1
        </div>
        <h2 className="text-3xl font-bold mb-3 tracking-tight">
          레퍼런스 영상을 선택하세요
        </h2>
        <p className="text-text-secondary text-base max-w-lg mx-auto">
          AI가 오늘의 핫한 영상을 추천해드립니다.
          <br />
          3개 이상 선택하거나 직접 링크를 입력하세요.
        </p>
      </div>

      {/* 모드 탭 */}
      <div className="max-w-2xl mx-auto flex gap-2 mb-6">
        <button
          onClick={() => setMode("recommend")}
          className={`flex-1 py-2.5 rounded-xl text-sm font-medium transition-all flex items-center justify-center gap-2 ${
            mode === "recommend"
              ? "bg-accent text-white"
              : "bg-bg-secondary text-text-muted hover:text-text-secondary"
          }`}
        >
          <Sparkles size={15} />
          AI 자동 추천
        </button>
        <button
          onClick={() => setMode("manual")}
          className={`flex-1 py-2.5 rounded-xl text-sm font-medium transition-all flex items-center justify-center gap-2 ${
            mode === "manual"
              ? "bg-accent text-white"
              : "bg-bg-secondary text-text-muted hover:text-text-secondary"
          }`}
        >
          <Link2 size={15} />
          직접 입력
        </button>
      </div>

      {/* AI 추천 모드 */}
      {mode === "recommend" && (
        <div className="max-w-2xl mx-auto">
          {/* 누적 선택된 영상 */}
          {selectedVideos.length > 0 && (
            <div className="mb-5">
              <p className="text-xs text-text-muted mb-2 font-medium uppercase tracking-wide">선택된 영상 ({selectedVideos.length})</p>
              <div className="space-y-2">
                {selectedVideos.map((video) => (
                  <div key={video.videoId} className="card p-3 flex items-center gap-3 border-accent/40 bg-accent/5">
                    <div className="w-16 h-10 rounded overflow-hidden flex-shrink-0 bg-bg-secondary">
                      <img src={video.thumbnail} alt={video.title} className="w-full h-full object-cover"
                        onError={(e) => { (e.target as HTMLImageElement).src = `https://img.youtube.com/vi/${video.videoId}/hqdefault.jpg`; }} />
                    </div>
                    <p className="flex-1 text-xs font-medium line-clamp-1">{video.title}</p>
                    <button onClick={() => toggleSelect(video)} className="text-text-muted hover:text-red-400 transition-colors flex-shrink-0">
                      <Trash2 size={14} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 추천 헤더 */}
          <div className="flex items-center justify-between mb-3">
            <p className="text-sm text-text-muted">
              {recommendQuery && <span>🔍 <b>{recommendQuery}</b> 기준 추천</span>}
            </p>
            <button
              onClick={fetchRecommended}
              disabled={loadingRecommend}
              className="flex items-center gap-1.5 text-sm text-text-muted hover:text-accent transition-colors"
            >
              <RefreshCw size={14} className={loadingRecommend ? "animate-spin" : ""} />
              새로 추천받기
            </button>
          </div>

          {/* 추천 카드 목록 */}
          <div className="space-y-3 mb-6">
            {loadingRecommend
              ? Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="card p-4 animate-pulse">
                    <div className="flex gap-3">
                      <div className="w-24 h-14 bg-bg-secondary rounded-lg flex-shrink-0" />
                      <div className="flex-1 space-y-2">
                        <div className="h-4 bg-bg-secondary rounded w-3/4" />
                        <div className="h-3 bg-bg-secondary rounded w-1/2" />
                      </div>
                    </div>
                  </div>
                ))
              : recommended.map((video) => {
                  const isSelected = selectedVideos.some((v) => v.videoId === video.videoId);
                  return (
                    <div
                      key={video.videoId}
                      onClick={() => toggleSelect(video)}
                      className={`card p-4 flex items-center gap-3 cursor-pointer transition-all ${
                        isSelected ? "border-accent/50 bg-accent/5" : "hover:border-border-hover"
                      }`}
                    >
                      {/* 체크박스 */}
                      <div className={`flex-shrink-0 ${isSelected ? "text-accent" : "text-text-muted"}`}>
                        {isSelected ? <CheckSquare size={20} /> : <Square size={20} />}
                      </div>

                      {/* 썸네일 */}
                      <div className="w-24 h-14 rounded-lg overflow-hidden flex-shrink-0 bg-bg-secondary">
                        <img
                          src={video.thumbnail}
                          alt={video.title}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            (e.target as HTMLImageElement).src = `https://img.youtube.com/vi/${video.videoId}/hqdefault.jpg`;
                          }}
                        />
                      </div>

                      {/* 정보 */}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium leading-snug line-clamp-2 mb-1">
                          {video.title}
                        </p>
                        <p className="text-xs text-text-muted">
                          {video.channelName} · 조회수 {video.viewCount.toLocaleString()}회 · {video.publishedAt}
                        </p>
                      </div>
                    </div>
                  );
                })}
          </div>

          {/* 제출 */}
          <div className="flex items-center justify-between">
            <p className="text-sm text-text-muted">
              <span className={selectedVideos.length >= 3 ? "text-success font-semibold" : ""}>
                {selectedVideos.length}
              </span>
              /3 이상 선택됨
            </p>
            <button
              onClick={handleRecommendSubmit}
              disabled={selectedVideos.length < 3}
              className="btn-primary flex items-center gap-2"
            >
              분석 시작
              <ArrowRight size={16} />
            </button>
          </div>
        </div>
      )}

      {/* 직접 입력 모드 */}
      {mode === "manual" && (
        <div className="max-w-2xl mx-auto">
          <div className="space-y-3 mb-6">
            {urls.map((url, index) => {
              const videoId = url.trim() ? extractVideoId(url) : null;
              const isValid = url.trim() && videoId;
              const hasError = errors[index] && url.trim();

              return (
                <div
                  key={index}
                  className={`card p-4 flex items-center gap-4 animate-fade-in-up stagger-${Math.min(index + 1, 5)} ${
                    isValid ? "border-success/30" : ""
                  } ${hasError ? "border-red-500/50" : ""}`}
                >
                  <div className="w-20 h-12 rounded-lg overflow-hidden flex-shrink-0 bg-bg-secondary">
                    {isValid ? (
                      <img
                        src={getThumbnailUrl(videoId!)}
                        alt="thumbnail"
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`;
                        }}
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Link2 size={16} className="text-text-muted" />
                      </div>
                    )}
                  </div>
                  <div className="flex-1 relative">
                    <input
                      type="text"
                      value={url}
                      onChange={(e) => updateUrl(index, e.target.value)}
                      placeholder={`영상 ${index + 1} URL (예: https://youtube.com/watch?v=...)`}
                      className={`input-field pr-10 ${hasError ? "border-red-500/50 focus:border-red-500" : ""}`}
                    />
                    {isValid && (
                      <div className="absolute right-3 top-1/2 -translate-y-1/2">
                        <div className="w-5 h-5 rounded-full bg-success/20 flex items-center justify-center">
                          <svg width="10" height="8" viewBox="0 0 10 8" fill="none" className="text-success">
                            <path d="M1 4L3.5 6.5L9 1" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                          </svg>
                        </div>
                      </div>
                    )}
                  </div>
                  {urls.length > 3 && (
                    <button onClick={() => removeUrl(index)} className="p-2 text-text-muted hover:text-red-400 transition-colors">
                      <Trash2 size={16} />
                    </button>
                  )}
                </div>
              );
            })}
          </div>

          <div className="mb-8">
            <button
              onClick={addUrl}
              disabled={urls.length >= 10}
              className="w-full py-3 border border-dashed border-border rounded-xl text-text-muted hover:text-text-secondary hover:border-text-muted transition-all flex items-center justify-center gap-2 text-sm disabled:opacity-30"
            >
              <Plus size={16} />
              영상 추가 (최대 10개)
            </button>
          </div>

          {errors.some((e, i) => e && urls[i].trim()) && (
            <div className="mb-6">
              <div className="flex items-center gap-2 text-red-400 text-sm bg-red-500/5 border border-red-500/20 rounded-xl px-4 py-3">
                <AlertCircle size={16} />
                올바른 YouTube URL을 입력해주세요
              </div>
            </div>
          )}

          <div className="flex items-center justify-between">
            <p className="text-sm text-text-muted">
              <span className={validCount >= 3 ? "text-success font-semibold" : ""}>{validCount}</span>/3 이상 입력됨
            </p>
            <button onClick={validateAndSubmit} disabled={validCount < 3} className="btn-primary flex items-center gap-2">
              분석 시작
              <ArrowRight size={16} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
