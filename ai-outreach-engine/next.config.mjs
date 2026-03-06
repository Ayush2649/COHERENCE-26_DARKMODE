/** @type {import('next').NextConfig} */
const nextConfig = {
  /**
   * Mark better-sqlite3 as external — it's a native C++ module
   * that cannot be bundled by Webpack/Turbopack.
   * This tells Next.js to use Node.js require() for it at runtime.
   */
  serverExternalPackages: ["better-sqlite3"],
};

export default nextConfig;
