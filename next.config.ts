import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // LUMI ships heavy 3D only where it belongs: the mascot & hero.
  experimental: {
    optimizePackageImports: ["lucide-react", "framer-motion"],
  },
};

export default nextConfig;
