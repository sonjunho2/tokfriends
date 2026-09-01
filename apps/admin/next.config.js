/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  i18n: {
    locales: ['ko', 'en'],
    defaultLocale: 'ko',
  },
}

module.exports = nextConfig
