import { createNextConfig } from "./next.config.shared.mjs";

/** @type {import('next').NextConfig} */
const nextConfig = createNextConfig(process.env.NODE_ENV);

export default nextConfig;
