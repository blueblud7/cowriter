import { ImageResponse } from 'next/og';

// iOS home-screen icon must be PNG; generate it at build with ImageResponse
// (no external rasterizer needed). Next auto-links it as apple-touch-icon.
export const size = { width: 180, height: 180 };
export const contentType = 'image/png';

export default function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: '#8B6FB8',
          color: '#ffffff',
          fontSize: 120,
          fontWeight: 600,
          fontFamily: 'Georgia, serif',
        }}
      >
        C
      </div>
    ),
    { ...size },
  );
}
