import { NextResponse } from "next/server";

const BACKEND_URL = (process.env.BACKEND_URL || "http://localhost:5000").replace(/\/+$/, "");

export async function GET() {
  const result: Record<string, unknown> = {
    frontend: "ok",
    backend_url: BACKEND_URL,
    backend_url_configured: !!process.env.BACKEND_URL,
  };

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 5000);

    const res = await fetch(`${BACKEND_URL}/api/health`, {
      cache: "no-store",
      signal: controller.signal,
    });
    clearTimeout(timeout);

    const text = await res.text();
    try {
      result.backend = JSON.parse(text);
      result.backend_status = "connected";
    } catch {
      result.backend_status = "invalid_response";
      result.backend_response = text.slice(0, 200);
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    result.backend_status = "unreachable";
    result.backend_error = message;
  }

  return NextResponse.json(result);
}
