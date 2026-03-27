import Link from 'next/link';

export default function Home() {
  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '24px',
        background: '#0f0f1a',
        color: '#ededed',
        fontFamily: 'Arial, Helvetica, sans-serif',
      }}
    >
      <h1 style={{ fontSize: '28px', fontWeight: 700, margin: 0, color: '#35d7bb' }}>
        Kiosk App Builder
      </h1>
      <p style={{ color: '#9ca3af', fontSize: '15px', margin: 0 }}>
        Choose a module to get started
      </p>

      <div style={{ display: 'flex', gap: '16px', marginTop: '8px' }}>
        <Link
          href="/builder"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '14px 32px',
            backgroundColor: '#35d7bb',
            color: '#1e1e2e',
            textDecoration: 'none',
            borderRadius: '8px',
            fontWeight: 600,
            fontSize: '15px',
            minWidth: '180px',
            transition: 'opacity 0.15s',
          }}
        >
          Template Builder
        </Link>
        <Link
          href="/flow"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '14px 32px',
            backgroundColor: '#373d49',
            color: '#dae5e6',
            textDecoration: 'none',
            borderRadius: '8px',
            fontWeight: 600,
            fontSize: '15px',
            minWidth: '180px',
            border: '1px solid #4a5568',
            transition: 'opacity 0.15s',
          }}
        >
          Logic Builder
        </Link>
      </div>
    </div>
  );
}
