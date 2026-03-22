import { ImageResponse } from 'next/og';

export const runtime = 'edge';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const size = Math.min(parseInt(searchParams.get('size') || '512'), 512);

  return new ImageResponse(
    (
      <div
        style={{
          width: '100%', height: '100%', display: 'flex',
          alignItems: 'center', justifyContent: 'center',
          backgroundColor: '#15803d',
          borderRadius: size * 0.2,
        }}
      >
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: size * 0.38, lineHeight: 1 }}>🏛️</span>
          <span style={{
            fontSize: size * 0.16, fontWeight: 900, color: 'white',
            letterSpacing: 2, fontFamily: 'sans-serif',
          }}>OSCA</span>
        </div>
      </div>
    ),
    { width: size, height: size }
  );
}
