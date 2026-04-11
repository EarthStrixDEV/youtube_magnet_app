import { NextResponse } from "next/server";
import { checkToolHealth } from "@/lib/ytdlp";
import { isServerMode } from "@/lib/download-tokens";

export async function GET() {
  const health = await checkToolHealth();
  return NextResponse.json({
    ...health,
    deploymentMode: isServerMode() ? "server" : "local",
  });
}
