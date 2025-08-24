/** @type {import('next').NextConfig} */
const nextConfig = {
  // включаем статический экспорт в ./out
  output: 'export',
  images: { unoptimized: true }, // чтобы export не упирался в next/image оптимизацию
  trailingSlash: true,           // удобно для FTP-хостингов (опционально)
};

module.exports = nextConfig;
