import Link from 'next/link';

export default function AppHeader() {
  return (
    <header
      style={{
        position: 'sticky',
        top: 0,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        height: '48px',
        padding: '0 20px',
        background: '#1e1e2e',
        borderBottom: '1px solid #2a2a3e',
        zIndex: 20,
      }}
    >
      <span
        style={{
          color: '#35d7bb',
          fontWeight: 700,
          fontSize: '16px',
          letterSpacing: '0.5px',
        }}
      >
        Kiosk Flow Editor
      </span>

      <nav style={{ display: 'flex', gap: '20px' }}>
        <Link
          href="/import"
          style={{
            color: '#dae5e6',
            textDecoration: 'none',
            fontSize: '14px',
            fontWeight: 500,
            padding: '6px 12px',
            borderRadius: '4px',
            transition: 'background 0.15s',
          }}
        >
          Import Manifest
        </Link>
        <Link
          href="/flow-editor"
          style={{
            color: '#dae5e6',
            textDecoration: 'none',
            fontSize: '14px',
            fontWeight: 500,
            padding: '6px 12px',
            borderRadius: '4px',
            transition: 'background 0.15s',
          }}
        >
          Flow Editor
        </Link>
      </nav>
    </header>
  );
}
