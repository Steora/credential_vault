import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  allowedDevOrigins: ["blaze-interstellar-enda.ngrok-free.dev"],
  logging: {
    serverFunctions: false,
  },
  // Notes with inline images send base64 in the Server Action payload; default is 1 MB.
  experimental: {
    serverActions: {
      bodySizeLimit: "10mb",
    },
  },
};

export default nextConfig;
