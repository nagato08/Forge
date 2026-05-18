import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Génère un serveur Node minimal autonome (.next/standalone/server.js)
  // → image Docker beaucoup plus légère
  output: "standalone",
};

export default nextConfig;
