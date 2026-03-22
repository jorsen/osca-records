import { ImageResponse } from 'next/og';

export const runtime = 'edge';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const wide = searchParams.get('wide') === '1';

  const w = wide ? 1280 : 390;
  const h = wide ? 800 : 844;

  return new ImageResponse(
    (
      <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', backgroundColor: '#f0fdf4', fontFamily: 'sans-serif' }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, backgroundColor: 'white', borderBottom: '4px solid #15803d', padding: '16px 24px' }}>
          <span style={{ fontSize: 32 }}>🏛️</span>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <span style={{ fontSize: 20, fontWeight: 900, color: '#15803d' }}>OSCA Records</span>
            <span style={{ fontSize: 12, color: '#9ca3af' }}>Office for Senior Citizens Affairs</span>
          </div>
        </div>
        {/* Content */}
        <div style={{ display: 'flex', flexDirection: 'column', padding: 24, gap: 16, flex: 1 }}>
          {/* Stats */}
          <div style={{ display: 'flex', gap: 12 }}>
            {[['👥', 'Total', '124'], ['✅', 'Pensioners', '67'], ['📋', 'Non-Pension', '57']].map(([icon, label, val]) => (
              <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 10, backgroundColor: 'white', borderRadius: 16, padding: '12px 16px', border: '1px solid #e5e7eb', flex: 1 }}>
                <span style={{ fontSize: 24 }}>{icon}</span>
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  <span style={{ fontSize: 22, fontWeight: 900, color: '#1f2937' }}>{val}</span>
                  <span style={{ fontSize: 11, color: '#6b7280' }}>{label}</span>
                </div>
              </div>
            ))}
          </div>
          {/* Table preview */}
          <div style={{ backgroundColor: 'white', borderRadius: 16, border: '1px solid #e5e7eb', overflow: 'hidden', flex: 1 }}>
            <div style={{ padding: '12px 16px', borderBottom: '1px solid #f3f4f6', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: 14, fontWeight: 700, color: '#1f2937' }}>Member Records</span>
              <span style={{ fontSize: 11, color: '#9ca3af' }}>124 members</span>
            </div>
            {['Juan dela Cruz', 'Maria Santos', 'Pedro Reyes', 'Ana Garcia'].map((name, i) => (
              <div key={name} style={{ padding: '10px 16px', backgroundColor: i % 2 === 0 ? 'white' : '#f9fafb', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #f3f4f6' }}>
                <span style={{ fontSize: 13, fontWeight: 600, color: '#374151' }}>{name}</span>
                <span style={{ fontSize: 11, backgroundColor: i % 3 === 0 ? '#dcfce7' : '#f3f4f6', color: i % 3 === 0 ? '#15803d' : '#6b7280', padding: '2px 8px', borderRadius: 6 }}>
                  {i % 3 === 0 ? '✅ Pensioner' : 'Non-Pensioner'}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    ),
    { width: w, height: h }
  );
}
