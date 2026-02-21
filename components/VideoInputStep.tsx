"use client";

import { useState } from "react";
import { Plus, Trash2, ArrowRight, Link2, AlertCircle } from "lucide-react";
import { extractVideoId, getThumbnailUrl } from "@/lib/api";

interface VideoInputStepProps {
  onSubmit: (urls: string[]) => void;
}

export default function VideoInputStep({ onSubmit }: VideoInputStepProps) {
  const [urls, setUrls] = useState<string[]>(["", "", ""]);
  const [errors, setErrors] = useState<boolean[]>([false, false, false]);

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

  const validCount = urls.filter(
    (url) => url.trim() && extractVideoId(url)
  ).length;

  return (
    <div className="animate-fade-in-up">
      {/* Hero */}
      <div className="text-center mb-10">
        <div className="inline-flex items-center gap-2 badge badge-accent mb-4">
          <span className="w-1.5 h-1.5 rounded-full bg-accent animate-pulse" />
          STEP 1
        </div>
        <h2 className="text-3xl font-bold mb-3 tracking-tight">
          레퍼런스 영상을 입력하세요
        </h2>
        <p className="text-text-secondary text-base max-w-lg mx-auto">
          카피하고 싶은 유튜브 영상 링크를 최소 3개 이상 입력해주세요.
          <br />
          조회수가 높은 영상부터 자동으로 분석합니다.
        </p>
      </div>

      {/* URL Inputs */}
      <div className="max-w-2xl mx-auto space-y-3 mb-6">
        {urls.map((url, index) => {
          const videoId = url.trim() ? extractVideoId(url) : null;
          const isValid = url.trim() && videoId;
          const hasError = errors[index] && url.trim();

          return (
            <div
              key={index}
              className={`
                card p-4 flex items-center gap-4
                animate-fade-in-up stagger-${Math.min(index + 1, 5)}
                ${isValid ? "border-success/30" : ""}
                ${hasError ? "border-red-500/50" : ""}
              `}
            >
              {/* Thumbnail preview */}
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

              {/* Input */}
              <div className="flex-1 relative">
                <input
                  type="text"
                  value={url}
                  onChange={(e) => updateUrl(index, e.target.value)}
                  placeholder={`영상 ${index + 1} URL (예: https://youtube.com/watch?v=...)`}
                  className={`
                    input-field pr-10
                    ${hasError ? "border-red-500/50 focus:border-red-500" : ""}
                  `}
                />
                {isValid && (
                  <div className="absolute right-3 top-1/2 -translate-y-1/2">
                    <div className="w-5 h-5 rounded-full bg-success/20 flex items-center justify-center">
                      <svg
                        width="10"
                        height="8"
                        viewBox="0 0 10 8"
                        fill="none"
                        className="text-success"
                      >
                        <path
                          d="M1 4L3.5 6.5L9 1"
                          stroke="currentColor"
                          strokeWidth="1.5"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                    </div>
                  </div>
                )}
              </div>

              {/* Remove button */}
              {urls.length > 3 && (
                <button
                  onClick={() => removeUrl(index)}
                  className="p-2 text-text-muted hover:text-red-400 transition-colors"
                >
                  <Trash2 size={16} />
                </button>
              )}
            </div>
          );
        })}
      </div>

      {/* Add more */}
      <div className="max-w-2xl mx-auto mb-8">
        <button
          onClick={addUrl}
          disabled={urls.length >= 10}
          className="w-full py-3 border border-dashed border-border rounded-xl text-text-muted hover:text-text-secondary hover:border-text-muted transition-all flex items-center justify-center gap-2 text-sm disabled:opacity-30"
        >
          <Plus size={16} />
          영상 추가 (최대 10개)
        </button>
      </div>

      {/* Error message */}
      {errors.some((e, i) => e && urls[i].trim()) && (
        <div className="max-w-2xl mx-auto mb-6">
          <div className="flex items-center gap-2 text-red-400 text-sm bg-red-500/5 border border-red-500/20 rounded-xl px-4 py-3">
            <AlertCircle size={16} />
            올바른 YouTube URL을 입력해주세요
          </div>
        </div>
      )}

      {/* Submit */}
      <div className="max-w-2xl mx-auto flex items-center justify-between">
        <p className="text-sm text-text-muted">
          <span className={validCount >= 3 ? "text-success font-semibold" : ""}>
            {validCount}
          </span>
          /3 이상 입력됨
        </p>
        <button
          onClick={validateAndSubmit}
          disabled={validCount < 3}
          className="btn-primary flex items-center gap-2"
        >
          분석 시작
          <ArrowRight size={16} />
        </button>
      </div>
    </div>
  );
}
