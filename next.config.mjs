/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "**",
      },
      // Cloudflare R2 domains
      {
        protocol: "https",
        hostname: "*.r2.dev",
      },
      {
        protocol: "https",
        hostname: "pub-*.r2.dev",
      },
      // Add your custom R2 domain if you have one
      // {
      //   protocol: "https",
      //   hostname: "your-custom-domain.com",
      // },
    ],
  },
};

export default nextConfig;
