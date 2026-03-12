"use client";

import { useState } from "react";
import {
  Upload,
  ArrowLeft,
  RotateCcw,
  ExternalLink,
  CheckCircle,
  AlertTriangle,
  Download,
  Film,
  Image,
  FileSpreadsheet,
  Mic,
} from "lucide-react";
import { ConfirmedContent, ProductionAssets } from "@/lib/types";

interface UploadStepProps {
  confirmed: ConfirmedContent;
  assets: ProductionAssets;
  onUpload: () => Promise<{ status: string; message?: string }>;
  onBack: () => void;
  onReset: () => void;
  backendUrl?: string;
}

export default function UploadStep({
  confirmed,
  assets,
  onUpload,
  onBack,
  onReset,
  backendUrl = "",
}: UploadStepProps) {
  const [uploadStatus, setUploadStatus] = useState<"idle" | "uploading" | "success" | "info">("idle");
  const [message, setMessage] = useState("");

  const getAssetUrl = (url: string | null) => {
    if (!url) return "";
    if (url.startsWith("http")) return url;
    return `${backendUrl}${url}`;
  };

  const handleUpload = async () => {
    setUploadStatus("uploading");
    try {
      const result = await onUpload();
      if (result.status === "ready") {
        setUploadStatus("info");
        setMessage(result.message || "YouTube OAuth 인증이 필요합니다.");
      } else {
        setUploadStatus("success");
        setMessage("업로드가 완료되었습니다!");
      }
    } catch (err) {
      setUploadStatus("info");
      setMessage(err instanceof Error ? err.message : "업로드 중 오류가 발생했습니다.");
    }
  };

  const downloadItems = [
    { key: "videoUrl", icon: Film, label: "영상 (MP4)", color: "text-accent" },
    { key: "thumbnailUrl", icon: Image, label: "썸네일 (PNG)", color: "text-purple-400" },
    { key: "pptUrl", icon: FileSpreadsheet, label: "PPT", color: "text-blue-400" },
    { key: "ttsUrl", icon: Mic, label: "음성 (MP3)", color: "text-emerald-400" },
  ];

  return (
    <div className="animate-fade-in-up">
      {/* Header */}
      <div className="text-center mb-10">
        <div className="inline-flex items-center gap-2 badge badge-success mb-4">
          <Upload size={12} />
          업로드
        </div>
        <h2 className="text-3xl font-bold mb-3 tracking-tight">
          제작이 완료되었습니다!
        </h2>
        <p className="text-text-secondary max-w-lg mx-auto">
          에셋을 다운로드하거나 YouTube에 직접 업로드하세요
        </p>
      </div>

      <div className="max-w-3xl mx-auto space-y-6">
        {/* 요약 카드 */}
        <section className="card p-6 border-accent/20">
          <h3 className="font-bold mb-4">제작 요약</h3>
          <div className="space-y-3 text-sm">
            <div className="flex gap-3">
              <span className="text-text-muted flex-shrink-0 w-16">제목</span>
              <span className="font-medium">{confirmed.title}</span>
            </div>
            <div className="flex gap-3">
              <span className="text-text-muted flex-shrink-0 w-16">썸네일</span>
              <span className="font-bold text-accent">{confirmed.thumbnailText}</span>
            </div>
            <div className="flex gap-3">
              <span className="text-text-muted flex-shrink-0 w-16">주제</span>
              <span>{confirmed.topic?.topic}</span>
            </div>
          </div>
        </section>

        {/* 다운로드 섹션 */}
        <section className="card p-6">
          <h3 className="font-bold mb-4 flex items-center gap-2">
            <Download size={16} />
            에셋 다운로드
          </h3>
          <div className="grid grid-cols-2 gap-3">
            {downloadItems.map(({ key, icon: Icon, label, color }) => {
              const url = assets[key as keyof ProductionAssets];
              if (!url) return null;
              return (
                <a
                  key={key}
                  href={getAssetUrl(url)}
                  download
                  className="flex items-center gap-3 p-4 bg-bg-secondary rounded-xl border border-border/50 hover:border-accent transition-all group"
                >
                  <Icon size={18} className={color} />
                  <span className="text-sm font-medium group-hover:text-accent transition-colors">{label}</span>
                  <Download size={14} className="ml-auto text-text-muted group-hover:text-accent transition-colors" />
                </a>
              );
            })}
          </div>
        </section>

        {/* 영상 미리보기 */}
        {assets.videoUrl && (
          <section className="card p-6">
            <h3 className="font-bold mb-4 flex items-center gap-2">
              <Film size={16} />
              영상 미리보기
            </h3>
            <video
              controls
              className="w-full rounded-xl bg-black"
              src={getAssetUrl(assets.videoUrl)}
            >
              브라우저가 비디오를 지원하지 않습니다.
            </video>
          </section>
        )}

        {/* YouTube 업로드 */}
        <section className="card p-6">
          <h3 className="font-bold mb-4 flex items-center gap-2">
            <Upload size={16} />
            YouTube 업로드
          </h3>

          {uploadStatus === "idle" && (
            <div>
              <p className="text-sm text-text-secondary mb-4">
                제작된 영상을 YouTube에 바로 업로드할 수 있습니다.
                Google 계정 연동이 필요합니다.
              </p>
              <button
                onClick={handleUpload}
                className="btn-primary flex items-center gap-2"
              >
                <Upload size={14} />
                YouTube 업로드
              </button>
            </div>
          )}

          {uploadStatus === "uploading" && (
            <div className="flex items-center gap-3 p-4 bg-accent/5 rounded-xl">
              <div className="animate-spin w-5 h-5 border-2 border-accent border-t-transparent rounded-full" />
              <span className="text-sm">업로드 준비 중...</span>
            </div>
          )}

          {uploadStatus === "info" && (
            <div className="p-4 bg-warning/5 border border-warning/20 rounded-xl">
              <div className="flex items-start gap-3">
                <AlertTriangle size={18} className="text-warning flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-medium mb-1">안내</p>
                  <p className="text-sm text-text-secondary">{message}</p>
                  <p className="text-xs text-text-muted mt-2">
                    수동으로 업로드하려면 위에서 영상을 다운로드한 후 YouTube Studio에서 직접 업로드해주세요.
                  </p>
                </div>
              </div>
            </div>
          )}

          {uploadStatus === "success" && (
            <div className="p-4 bg-success/5 border border-success/20 rounded-xl">
              <div className="flex items-center gap-3">
                <CheckCircle size={18} className="text-success" />
                <div>
                  <p className="text-sm font-medium">{message}</p>
                  <a href="#" className="text-xs text-accent flex items-center gap-1 mt-1 hover:underline">
                    YouTube Studio에서 확인 <ExternalLink size={10} />
                  </a>
                </div>
              </div>
            </div>
          )}
        </section>

        {/* Actions */}
        <div className="flex items-center justify-between pt-4">
          <button onClick={onBack} className="btn-secondary flex items-center gap-2 text-sm">
            <ArrowLeft size={14} />
            제작 결과 보기
          </button>
          <button onClick={onReset} className="btn-primary flex items-center gap-2">
            <RotateCcw size={14} />
            새 프로젝트 시작
          </button>
        </div>
      </div>
    </div>
  );
}
