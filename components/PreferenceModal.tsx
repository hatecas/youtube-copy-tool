"use client";

import { useState, useEffect } from "react";
import { X, Plus, Trash2, Link2, Tag, Loader2, CheckCircle } from "lucide-react";

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:5000";
const STORAGE_KEY = "yt_preferences";

export interface Preferences {
  keywords: string[];
  channels: { id: string; name: string }[];
}

export function loadPreferences(): Preferences {
  if (typeof window === "undefined") return { keywords: [], channels: [] };
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || "null") || { keywords: [], channels: [] };
  } catch {
    return { keywords: [], channels: [] };
  }
}

function savePreferences(prefs: Preferences) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(prefs));
}

interface Props {
  onClose: () => void;
}

export default function PreferenceModal({ onClose }: Props) {
  const [prefs, setPrefs] = useState<Preferences>({ keywords: [], channels: [] });
  const [newKeyword, setNewKeyword] = useState("");
  const [channelUrl, setChannelUrl] = useState("");
  const [channelLoading, setChannelLoading] = useState(false);
  const [channelError, setChannelError] = useState("");
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    setPrefs(loadPreferences());
  }, []);

  const addKeyword = () => {
    const kw = newKeyword.trim();
    if (!kw || prefs.keywords.includes(kw)) return;
    const next = { ...prefs, keywords: [...prefs.keywords, kw] };
    setPrefs(next);
    savePreferences(next);
    setNewKeyword("");
    flashSaved();
  };

  const removeKeyword = (kw: string) => {
    const next = { ...prefs, keywords: prefs.keywords.filter((k) => k !== kw) };
    setPrefs(next);
    savePreferences(next);
  };

  const addChannel = async () => {
    const url = channelUrl.trim();
    if (!url) return;
    setChannelLoading(true);
    setChannelError("");
    try {
      const res = await fetch(`${BACKEND_URL}/api/channel-info?url=${encodeURIComponent(url)}`);
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      if (prefs.channels.some((c) => c.id === data.channelId)) {
        setChannelError("이미 등록된 채널입니다.");
        return;
      }
      const next = {
        ...prefs,
        channels: [...prefs.channels, { id: data.channelId, name: data.channelName }],
      };
      setPrefs(next);
      savePreferences(next);
      setChannelUrl("");
      flashSaved();
    } catch (e: unknown) {
      setChannelError(e instanceof Error ? e.message : "채널 정보를 가져오지 못했습니다.");
    } finally {
      setChannelLoading(false);
    }
  };

  const removeChannel = (id: string) => {
    const next = { ...prefs, channels: prefs.channels.filter((c) => c.id !== id) };
    setPrefs(next);
    savePreferences(next);
  };

  const flashSaved = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm px-4">
      <div className="bg-bg-primary border border-border rounded-2xl w-full max-w-lg shadow-2xl">
        {/* 헤더 */}
        <div className="flex items-center justify-between p-5 border-b border-border">
          <div>
            <h2 className="font-bold text-lg">추천 설정</h2>
            <p className="text-xs text-text-muted mt-0.5">내 취향에 맞는 영상을 추천받으세요</p>
          </div>
          <div className="flex items-center gap-3">
            {saved && (
              <span className="flex items-center gap-1 text-xs text-success">
                <CheckCircle size={13} /> 저장됨
              </span>
            )}
            <button onClick={onClose} className="p-1.5 text-text-muted hover:text-text-secondary transition-colors">
              <X size={18} />
            </button>
          </div>
        </div>

        <div className="p-5 space-y-6 max-h-[70vh] overflow-y-auto">
          {/* 키워드 섹션 */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Tag size={15} className="text-accent" />
              <h3 className="font-semibold text-sm">검색 키워드</h3>
            </div>
            <p className="text-xs text-text-muted mb-3">추천받고 싶은 주제 키워드를 추가하세요.</p>

            <div className="flex gap-2 mb-3">
              <input
                type="text"
                value={newKeyword}
                onChange={(e) => setNewKeyword(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && addKeyword()}
                placeholder="예: AI 영상 제작, 쇼츠 자동화"
                className="input-field flex-1 text-sm"
              />
              <button onClick={addKeyword} className="btn-primary px-3 py-2 flex items-center gap-1 text-sm">
                <Plus size={14} /> 추가
              </button>
            </div>

            {prefs.keywords.length === 0 ? (
              <p className="text-xs text-text-muted italic">등록된 키워드 없음 (기본 키워드로 추천)</p>
            ) : (
              <div className="flex flex-wrap gap-2">
                {prefs.keywords.map((kw) => (
                  <span key={kw} className="flex items-center gap-1.5 bg-accent/10 text-accent text-xs px-3 py-1.5 rounded-full">
                    {kw}
                    <button onClick={() => removeKeyword(kw)} className="hover:text-red-400 transition-colors">
                      <X size={11} />
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* 채널 섹션 */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Link2 size={15} className="text-accent" />
              <h3 className="font-semibold text-sm">즐겨찾는 채널</h3>
            </div>
            <p className="text-xs text-text-muted mb-3">
              마음에 드는 채널의 영상 링크를 붙여넣으면 자동으로 채널이 등록돼요.
            </p>

            <div className="flex gap-2 mb-2">
              <input
                type="text"
                value={channelUrl}
                onChange={(e) => { setChannelUrl(e.target.value); setChannelError(""); }}
                onKeyDown={(e) => e.key === "Enter" && addChannel()}
                placeholder="유튜브 영상 URL 붙여넣기"
                className={`input-field flex-1 text-sm ${channelError ? "border-red-500/50" : ""}`}
              />
              <button
                onClick={addChannel}
                disabled={channelLoading}
                className="btn-primary px-3 py-2 flex items-center gap-1 text-sm disabled:opacity-50"
              >
                {channelLoading ? <Loader2 size={14} className="animate-spin" /> : <Plus size={14} />}
                추가
              </button>
            </div>
            {channelError && <p className="text-xs text-red-400 mb-2">{channelError}</p>}

            {prefs.channels.length === 0 ? (
              <p className="text-xs text-text-muted italic">등록된 채널 없음</p>
            ) : (
              <div className="space-y-2">
                {prefs.channels.map((ch) => (
                  <div key={ch.id} className="flex items-center justify-between bg-bg-secondary rounded-lg px-3 py-2">
                    <span className="text-sm font-medium">{ch.name}</span>
                    <button onClick={() => removeChannel(ch.id)} className="text-text-muted hover:text-red-400 transition-colors">
                      <Trash2 size={14} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="p-4 border-t border-border">
          <button onClick={onClose} className="btn-primary w-full">완료</button>
        </div>
      </div>
    </div>
  );
}
