export function getNextDistDir(nodeEnv = process.env.NODE_ENV) {
  return nodeEnv === "development" ? ".next-dev" : ".next";
}

export function createNextConfig(nodeEnv = process.env.NODE_ENV) {
  return {
    distDir: getNextDistDir(nodeEnv),
    images: {
      remotePatterns: [
        {
          protocol: "https",
          hostname: "**",
        },
        {
          protocol: "https",
          hostname: "*.r2.dev",
        },
        {
          protocol: "https",
          hostname: "pub-*.r2.dev",
        },
      ],
    },
  };
}
