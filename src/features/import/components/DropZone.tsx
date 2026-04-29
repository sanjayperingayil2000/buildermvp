interface DropZoneProps {
  isDragging: boolean;
  onDragOver: (e: React.DragEvent) => void;
  onDragLeave: () => void;
  onDrop: (e: React.DragEvent) => void;
  onClick: () => void;
}

export default function DropZone({ isDragging, onDragOver, onDragLeave, onDrop, onClick }: DropZoneProps) {
  return (
    <div
      onDragOver={onDragOver}
      onDragLeave={onDragLeave}
      onDrop={onDrop}
      onClick={onClick}
      style={{
        border: `2px dashed ${isDragging ? '#35d7bb' : '#334155'}`,
        borderRadius: 12,
        padding: '40px 20px',
        textAlign: 'center',
        cursor: 'pointer',
        background: isDragging ? 'rgba(53, 215, 187, 0.06)' : 'rgba(15, 23, 42, 0.5)',
        transition: 'all 0.2s ease',
      }}
    >
      <div
        style={{
          width: 52,
          height: 52,
          borderRadius: 12,
          background: 'rgba(53, 215, 187, 0.1)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          margin: '0 auto 16px',
        }}
      >
        <svg
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          stroke="#35d7bb"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
          <polyline points="14 2 14 8 20 8" />
          <line x1="12" y1="18" x2="12" y2="12" />
          <line x1="9" y1="15" x2="12" y2="12" />
          <line x1="15" y1="15" x2="12" y2="12" />
        </svg>
      </div>

      <p style={{ fontSize: 14, color: '#94a3b8', margin: '0 0 8px 0' }}>
        {isDragging ? 'Drop your file here...' : 'Drag & drop your manifest.json here'}
      </p>
      <span style={{ fontSize: 12, color: '#475569' }}>
        or click to browse — accepts .json files only
      </span>
    </div>
  );
}