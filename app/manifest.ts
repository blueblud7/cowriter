import type { MetadataRoute } from 'next';

// Web App Manifest — makes CoWriter installable ("Add to Home Screen") and
// launchable standalone. Next auto-serves this at /manifest.webmanifest and
// injects the <link rel="manifest"> tag. Colors match the default twilight palette.
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'CoWriter — 함께 쓰는 글',
    short_name: 'CoWriter',
    description: 'AI가 곁에서 도와주는 글쓰기. 어린이부터 전문 작가까지.',
    start_url: '/',
    scope: '/',
    display: 'standalone',
    orientation: 'portrait',
    lang: 'ko',
    background_color: '#F1ECF2',
    theme_color: '#8B6FB8',
    icons: [
      { src: '/icon.svg', sizes: 'any', type: 'image/svg+xml', purpose: 'any' },
      { src: '/icon-maskable.svg', sizes: 'any', type: 'image/svg+xml', purpose: 'maskable' },
    ],
  };
}
