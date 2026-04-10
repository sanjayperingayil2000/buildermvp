interface FileStatusCardProps {
  fileName: string;
  status: 'success' | 'error';
  screenCount?: number;
  errorMessage?: string;
}

export default function FileStatusCard({ fileName, status, screenCount, errorMessage }: FileStatusCardProps) {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        padding: '8px 12px',
        borderRadius: 6,
        background: 'rgba(15, 15, 26, 0.5)',
        borderLeft: `3px solid ${status === 'success' ? '#35d7bb' : '#ef4444'}`,
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ fontSize: 13, color: '#e2e8f0', fontWeight: 500 }}>{fileName}</span>
        {status === 'success' ? (
          <span style={{ fontSize: 12, color: '#35d7bb' }}>{screenCount} screen(s)</span>
        ) : (
          <span style={{ fontSize: 12, color: '#ef4444' }}>Error</span>
        )}
      </div>
      {status === 'error' && errorMessage && (
        <div style={{ fontSize: 11, color: '#fca5a5', marginTop: 4 }}>
          {errorMessage}
        </div>
      )}
    </div>
  );
}