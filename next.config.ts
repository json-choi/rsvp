import type { NextConfig } from "next";
import { initOpenNextCloudflareForDev } from "@opennextjs/cloudflare";

const nextConfig: NextConfig = {
  reactCompiler: true,
  images: {
    // 이미지는 R2(/media)와 public에서 그대로 제공한다. Cloudflare Images 비용을 피하기 위해 최적화는 끈다.
    unoptimized: true,
  },
};

export default nextConfig;

// `next dev`에서 wrangler.jsonc의 바인딩(D1, R2)을 로컬로 쓸 수 있게 한다.
initOpenNextCloudflareForDev();
