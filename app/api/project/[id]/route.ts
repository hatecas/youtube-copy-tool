import { NextRequest, NextResponse } from "next/server";

const BACKEND_URL = (process.env.BACKEND_URL || process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:5000").replace(/\/+$/, "");

export const maxDuration = 60;

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const res = await fetch(`${BACKEND_URL}/api/project/${id}`, {
      cache: "no-store",
    });

    const text = await res.text();
    try {
      const data = JSON.parse(text);
      return NextResponse.json(data, { status: res.status });
    } catch {
      console.error("[project] 백엔드 응답이 JSON이 아님:", text.slice(0, 500));
      return NextResponse.json(
        { error: `백엔드 응답 오류 (status ${res.status})` },
        { status: 502 }
      );
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("[project] 백엔드 연결 실패:", message);
    return NextResponse.json(
      { error: `백엔드 연결 실패: ${message}` },
      { status: 500 }
    );
  }
}
