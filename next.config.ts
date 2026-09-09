import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Vinext inspects multipart POSTs before dispatching API route handlers.
  // Allow the backend's 80 MiB media budget plus multipart overhead through.
  // Backend per-file limits and authorization remain authoritative.
  experimental: {serverActions: {bodySizeLimit: "85mb"}},
};

export default nextConfig;
