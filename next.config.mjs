/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
  experimental: {
    allowedDevOrigins: [
        "http://192.168.88.13:3000" // O IP que pode acessar o servidor de dev além de localhost
    ],
  },
}

export default nextConfig
