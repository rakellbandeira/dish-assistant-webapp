import type { NextConfig } from "next";

// Where the FastAPI backend runs. 
const BACKEND_URL = process.env.BACKEND_URL ?? "http://localhost:8000";

const nextConfig: NextConfig = {
  // The browser only ever talks to this Next.js app; /api/* is forwarded to FastAPI.
  // That keeps everything same-origin, auth cookies / CORS not needed.
  async rewrites() {
    return [
      {
        source: "/api/:path*",
        destination: `${BACKEND_URL}/api/:path*`,
      },
    ];
  },
};

export default nextConfig;