// NOTE: This route intentionally does NOT set `export const runtime = "edge"`.
// It runs in the Node.js runtime (default) so that its outbound fetch shares
// the same server IP as /api/get-streams. YouTube CDN embeds the requesting IP
// in the `ip=` query param of every signed stream URL; if the proxy ran on
// Vercel's Edge network (a different PoP) the IP would differ from the one
// baked into the URL → 403. Node.js runtime and the API route that resolves
// the URL both run on the same Vercel serverless function instance → same IP.

// User-Agent strings per YouTube client type.
// MWEB URLs are signed for mobile Safari; sending a desktop UA causes 403.
// WEB URLs expect a desktop Chrome UA.
// ANDROID URLs are signed for the YouTube Android app; no Origin/Referer header is expected.
// Defaulting to MWEB UA is the safest fallback because MWEB CDN endpoints tolerate
// mismatches less often than WEB.
const USER_AGENTS: Record<string, string> = {
  mweb: "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1",
  web: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36",
  android: "com.google.android.youtube/19.09.37 (Linux; U; Android 14) gzip",
};

// Origin and Referer per client type.
// YouTube CDN validates these for adaptive (rqh=1) streams.
// MWEB expects m.youtube.com; WEB expects www.youtube.com.
// ANDROID app does not send Origin or Referer — omit them for that client.
const ORIGINS: Record<string, string> = {
  mweb: "https://m.youtube.com",
  web: "https://www.youtube.com",
};

const REFERERS: Record<string, string> = {
  mweb: "https://m.youtube.com/",
  web: "https://www.youtube.com/",
};

// Allowlist of hostnames the proxy is permitted to forward to.
// This guards against SSRF — any host not ending with one of these suffixes
// receives a 400 before we ever open a connection.
const ALLOWED_HOSTNAME_SUFFIXES = [
  ".googlevideo.com",
  ".youtube.com",
  ".youtu.be",
  ".ytimg.com",
  ".ggpht.com",
  // Exact matches (no subdomain)
  "googlevideo.com",
  "youtube.com",
  "youtu.be",
  "ytimg.com",
  "ggpht.com",
];

// Headers we pass through verbatim from the upstream response.
const PASS_THROUGH_RESPONSE_HEADERS = [
  "content-type",
  "content-length",
  "content-range",
  "accept-ranges",
  "last-modified",
  "etag",
] as const;

function isAllowedHost(hostname: string): boolean {
  const lower = hostname.toLowerCase();
  return ALLOWED_HOSTNAME_SUFFIXES.some(
    (suffix) => lower === suffix || lower.endsWith(`.${suffix.replace(/^\./, "")}`)
  );
}

export async function GET(request: Request): Promise<Response> {
  const { searchParams } = new URL(request.url);
  const targetEncoded = searchParams.get("u");
  const fileName = searchParams.get("fn") ?? "";
  // "ua" param carries the YouTube client type that generated this URL.
  // Values: "mweb" (adaptive, MWEB client) | "web" (combined, WEB client) | "android" (ANDROID fallback).
  // Defaults to "mweb" — the strictest of the three, safe to over-apply for unknown values.
  const uaKey = (searchParams.get("ua") ?? "mweb").toLowerCase();
  const userAgent = USER_AGENTS[uaKey] ?? USER_AGENTS["mweb"]!;
  // ANDROID client does not send Origin or Referer (native app behaviour).
  const isAndroid = uaKey === "android";
  const origin = isAndroid ? null : (ORIGINS[uaKey] ?? ORIGINS["mweb"]!);
  const referer = isAndroid ? null : (REFERERS[uaKey] ?? REFERERS["mweb"]!);

  if (!targetEncoded) {
    return Response.json(
      { error: "missing_param", message: "Query param 'u' is required." },
      { status: 400 }
    );
  }

  // Decode and parse — catch malformed URLs early.
  let targetUrl: URL;
  try {
    targetUrl = new URL(targetEncoded);
  } catch {
    return Response.json(
      { error: "invalid_url", message: "Query param 'u' is not a valid URL." },
      { status: 400 }
    );
  }

  // SSRF guard — reject anything that isn't a known YouTube CDN hostname.
  if (!isAllowedHost(targetUrl.hostname)) {
    return Response.json(
      {
        error: "forbidden_host",
        message: `Host '${targetUrl.hostname}' is not in the proxy allowlist.`,
      },
      { status: 400 }
    );
  }

  // Build upstream request headers.
  // User-Agent, Origin, and Referer must match the YouTube client that signed
  // the URL — MWEB URLs are tied to mobile Safari; WEB to desktop Chrome;
  // ANDROID to the YouTube app (no Origin/Referer).
  // Referer is required by YouTube CDN for adaptive streams with rqh=1: the
  // CDN validates that Referer matches the expected origin for the client type.
  // Accept-Encoding: identity prevents the Node runtime from auto-decompressing
  // the response body, which would corrupt the raw media bytes we pipe through.
  const upstreamHeaders: Record<string, string> = {
    "user-agent": userAgent,
    "accept": "*/*",
    "accept-encoding": "identity",
  };
  // Only set Origin/Referer for browser-based clients (MWEB, WEB).
  // The Android app UA does not send these headers.
  if (origin !== null) {
    upstreamHeaders["origin"] = origin;
  }
  if (referer !== null) {
    upstreamHeaders["referer"] = referer;
  }

  // Forward Range header from client → upstream so partial-content (206) works.
  const rangeHeader = request.headers.get("range");
  if (rangeHeader) {
    upstreamHeaders["range"] = rangeHeader;
  }

  let upstream: Response;
  try {
    upstream = await fetch(targetUrl.toString(), {
      headers: upstreamHeaders,
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Upstream fetch failed.";
    return Response.json(
      { error: "upstream_error", message: msg },
      { status: 502 }
    );
  }

  // Relay upstream errors with their original status code.
  // Log a structured diagnostic to help identify the cause (e.g. ip= mismatch,
  // rqh=1 enforcement, expired URL, UA rejection).
  if (!upstream.ok && upstream.status !== 206) {
    let upstreamBody = "";
    try {
      upstreamBody = (await upstream.text()).slice(0, 300);
    } catch {
      // ignore — body read failure doesn't change the error path
    }
    console.error("[proxy] upstream error", {
      status: upstream.status,
      statusText: upstream.statusText,
      ua: uaKey,
      targetHost: targetUrl.hostname,
      targetHasRqh: targetUrl.searchParams.get("rqh"),
      targetIp: targetUrl.searchParams.get("ip"),
      upstreamBody,
    });
    return Response.json(
      {
        error: "upstream_error",
        message: `Upstream returned ${upstream.status} ${upstream.statusText}`,
      },
      { status: upstream.status }
    );
  }

  // Build the response headers from upstream pass-through list.
  const responseHeaders = new Headers();

  for (const header of PASS_THROUGH_RESPONSE_HEADERS) {
    const value = upstream.headers.get(header);
    if (value !== null) {
      responseHeaders.set(header, value);
    }
  }

  // Never cache — YouTube CDN URLs expire in ~6 hours.
  responseHeaders.set("cache-control", "no-store");

  // CORP safety net: under COEP (even credentialless mode) some browsers are
  // stricter than others. Advertising CORP: cross-origin on our own proxy
  // ensures ffmpeg.wasm fetches of these bytes always succeed.
  responseHeaders.set("cross-origin-resource-policy", "cross-origin");

  // Trigger browser/IDM download dialog when a filename is provided.
  if (fileName) {
    responseHeaders.set(
      "content-disposition",
      `attachment; filename="${encodeURIComponent(fileName)}"`
    );
  }

  // Stream the body through without buffering.
  return new Response(upstream.body, {
    status: upstream.status,
    headers: responseHeaders,
  });
}
