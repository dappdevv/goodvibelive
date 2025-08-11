import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  eslint: {
    // Warning: This allows production builds to successfully complete even if
    // your project has ESLint errors.
    ignoreDuringBuilds: true,
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "dashscope-result-sgp.oss-ap-southeast-1.aliyuncs.com",
      },
      {
        protocol: "https",
        hostname: "dashscope-result.oss-cn-beijing.aliyuncs.com",
      },
      { protocol: "https", hostname: "tempfile.aiquickdraw.com" },
      { protocol: "https", hostname: "file.aiquickdraw.com" },
      { protocol: "https", hostname: "sunoapi.org.redpandaai.co" },
      { protocol: "https", hostname: "api.sunoapi.org" },
    ],
  },
};

export default nextConfig;
