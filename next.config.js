/** @type {import('next').NextConfig} */
const isGhPagesBuild = process.env.GITHUB_ACTIONS === "true" && !!process.env.GITHUB_REPOSITORY;
const repoName = process.env.GITHUB_REPOSITORY?.split("/")[1] || "";
const basePath = isGhPagesBuild && repoName ? `/${repoName}` : "";

const nextConfig = {
  experimental: {
    serverActions: { bodySizeLimit: "10mb" },
  },
  ...(isGhPagesBuild
    ? {
        output: "export",
        images: { unoptimized: true },
        trailingSlash: true,
        basePath,
        assetPrefix: basePath,
      }
    : {}),
};

module.exports = nextConfig;
