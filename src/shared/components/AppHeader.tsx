import Link from 'next/link';

interface AppHeaderProps {
  children?: React.ReactNode;
}

export default function AppHeader({ children }: AppHeaderProps) {
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
      {children ? (
        <div style={{ display: 'flex', alignItems: 'center' }}>
          {children}
        </div>
      ) : (
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
      )}

      <nav style={{ display: 'flex', gap: '20px' }}>
        <Link
          href="/"
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
          Projects
        </Link>
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
          Import
        </Link>
      </nav>
    </header>
  );
}