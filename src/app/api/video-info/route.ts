import { NextRequest, NextResponse } from "next/server";
import { fetchRealMeta } from "@/lib/ytdlp";

export async function GET(request: NextRequest) {
  const url = request.nextUrl.searchParams.get("url");

  if (!url) {
    return NextResponse.json({ error: "Missing url param" }, { status: 400 });
  }

  try {
    const meta = await fetchRealMeta(url);
    return NextResponse.json(meta);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to fetch metadata";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
