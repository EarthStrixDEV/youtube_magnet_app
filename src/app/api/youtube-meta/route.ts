import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const url = request.nextUrl.searchParams.get("url");

  if (!url) {
    return NextResponse.json({ error: "Missing url param" }, { status: 400 });
  }

  try {
    const oembedUrl = `https://www.youtube.com/oembed?url=${encodeURIComponent(url)}&format=json`;
    const res = await fetch(oembedUrl, { next: { revalidate: 3600 } });

    if (!res.ok) {
      return NextResponse.json(
        { error: "Failed to fetch video metadata" },
        { status: res.status }
      );
    }

    const data = await res.json();

    return NextResponse.json({
      title: data.title ?? "Untitled Video",
      author: data.author_name ?? "",
      thumbnail: data.thumbnail_url ?? "",
    });
  } catch {
    return NextResponse.json(
      { error: "Failed to fetch metadata" },
      { status: 500 }
    );
  }
}
