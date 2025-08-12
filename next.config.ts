/** @type {import('next').NextConfig} */
const nextConfig = {
  // НЕТ output: 'export' — серверный режим
  images: { unoptimized: true }
};

module.exports = nextConfig;
