import type { NextConfig } from "next";
import path from "path";
import { fileURLToPath } from "url";

const projectRoot = path.dirname(fileURLToPath(import.meta.url));

const nextConfig: NextConfig = {
  turbopack: {
    root: projectRoot,
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "img.youtube.com",
      },
      {
        protocol: "https",
        hostname: "i.ytimg.com",
      },
    ],
  },
  // ---------------------------------------------------------------------------
  // COOP/COEP — required to enable SharedArrayBuffer, which the multithreaded
  // ffmpeg.wasm build needs for worker↔main-thread transfers.
  //
  // We use COEP: credentialless (NOT require-corp) so cross-origin resources
  // like YouTube thumbnails (img.youtube.com / i.ytimg.com) load WITHOUT those
  // origins needing to send a Cross-Origin-Resource-Policy header. The browser
  // simply fetches them without credentials, which is fine for public thumbs.
  // ---------------------------------------------------------------------------
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "Cross-Origin-Opener-Policy", value: "same-origin" },
          { key: "Cross-Origin-Embedder-Policy", value: "credentialless" },
        ],
      },
    ];
  },
};

export default nextConfig;
