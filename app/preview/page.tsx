'use client';

import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import Link from 'next/link';
import { useAppStore } from '@/shared/store/useAppStore';
import { buildPageRuntime } from '@/lib/buildPageRuntime';

// Mobile frame dimensions — the simulated device screen
const FRAME_WIDTH = 390;
const FRAME_HEIGHT = 844;

export default function PreviewPage() {
  const pages = useAppStore((s) => s.pages);
  const navMap = useAppStore((s) => s.navMap);

  const [currentPageId, setCurrentPageId] = useState<string | null>(null);
  const [history, setHistory] = useState<string[]>([]);
  const [isApiLoading, setIsApiLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{ text: string; type: 'info' | 'warn' | 'error' } | null>(null);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  // Set first page as starting point when pages are available
  useEffect(() => {
    if (pages.length > 0 && currentPageId === null) {
      setCurrentPageId(pages[0].id);
      setHistory([pages[0].id]);
    }
  }, [pages, currentPageId]);

  // Navigate to a page by id
  const navigate = useCallback(
    (targetPageId: string) => {
      const exists = pages.find((p) => p.id === targetPageId);
      if (!exists) {
        console.warn(`Preview: unknown page id "${targetPageId}"`);
        return;
      }
      setCurrentPageId(targetPageId);
      setHistory((prev) => [...prev, targetPageId]);
      setIsApiLoading(false);
    },
    [pages]
  );

  // Go back one step in history
  const goBack = useCallback(() => {
    setHistory((prev) => {
      if (prev.length <= 1) return prev;
      const next = prev.slice(0, -1);
      setCurrentPageId(next[next.length - 1]);
      return next;
    });
  }, []);

  // Restart from the first page
  const restart = useCallback(() => {
    if (pages.length > 0) {
      const firstId = pages[0].id;
      setCurrentPageId(firstId);
      setHistory([firstId]);
      setIsApiLoading(false);
    }
  }, [pages]);

  // Handle postMessage events sent by the runtime script inside the iframe
  const handleMessage = useCallback(
    (event: MessageEvent) => {
      if (!event.data || typeof event.data !== 'object') return;
      const msg = event.data as {
        type: string;
        to?: string;
        outcome?: string;
        available?: string[];
        message?: string;
      };

      if (msg.type === 'preview:navigate' && msg.to) {
        setStatusMessage(null);
        navigate(msg.to);
      } else if (msg.type === 'preview:api-start') {
        setIsApiLoading(true);
        setStatusMessage({ text: 'API call in progress...', type: 'info' });
      } else if (msg.type === 'preview:api-done') {
        setIsApiLoading(false);
        setStatusMessage({ text: `API returned outcome: "${msg.outcome}"`, type: 'info' });
        setTimeout(() => setStatusMessage(null), 3000);
      } else if (msg.type === 'preview:api-unmatched') {
        setIsApiLoading(false);
        setStatusMessage({
          text: `API returned "${msg.outcome}" but no route matches. Available: ${(msg.available ?? []).join(', ')}`,
          type: 'warn',
        });
      } else if (msg.type === 'preview:api-error') {
        setIsApiLoading(false);
        setStatusMessage({ text: `API error: ${msg.message}`, type: 'error' });
      }
    },
    [navigate]
  );

  // Attach and clean up the message listener
  useEffect(() => {
    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [handleMessage]);

  // Find the current page object
  const currentPage = useMemo(
    () => pages.find((p) => p.id === currentPageId) ?? null,
    [pages, currentPageId]
  );

  // Build the full HTML document string for the iframe
  const srcDoc = useMemo(() => {
    if (!currentPage) return '';
    return buildPageRuntime(currentPage, navMap);
  }, [currentPage, navMap]);

  // Empty state — nothing saved yet
  if (pages.length === 0) {
    return (
      <div
        style={{
          height: '100vh',
          background: '#0f172a',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 16,
          color: '#94a3b8',
          fontFamily: 'system-ui, sans-serif',
        }}
      >
        <p style={{ margin: 0, fontSize: 15 }}>
          Nothing to preview. Design pages in the Template Builder and save them first.
        </p>
        <div style={{ display: 'flex', gap: 12 }}>
          <Link
            href="/builder"
            style={{
              padding: '8px 18px',
              background: '#3b82f6',
              color: '#fff',
              borderRadius: 8,
              fontSize: 13,
              textDecoration: 'none',
            }}
          >
            Go to Template Builder
          </Link>
          <Link
            href="/flow"
            style={{
              padding: '8px 18px',
              background: '#334155',
              color: '#fff',
              borderRadius: 8,
              fontSize: 13,
              textDecoration: 'none',
            }}
          >
            Go to Logic Builder
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div
      style={{
        height: '100vh',
        display: 'flex',
        flexDirection: 'column',
        background: '#0f172a',
        fontFamily: 'system-ui, sans-serif',
      }}
    >
      {/* ── Top toolbar ── */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          padding: '0 20px',
          height: 52,
          background: '#1e293b',
          borderBottom: '1px solid #334155',
          flexShrink: 0,
        }}
      >
        <span style={{ fontWeight: 600, fontSize: 14, color: '#f8fafc', marginRight: 8 }}>
          Preview
        </span>

        {/* Back */}
        <button
          onClick={goBack}
          disabled={history.length <= 1}
          style={{
            padding: '4px 12px',
            borderRadius: 6,
            border: 'none',
            background: '#334155',
            color: history.length <= 1 ? '#475569' : '#f8fafc',
            cursor: history.length <= 1 ? 'not-allowed' : 'pointer',
            fontSize: 12,
          }}
        >
          ← Back
        </button>

        {/* Restart */}
        <button
          onClick={restart}
          style={{
            padding: '4px 12px',
            borderRadius: 6,
            border: 'none',
            background: '#334155',
            color: '#f8fafc',
            cursor: 'pointer',
            fontSize: 12,
          }}
        >
          ↺ Restart
        </button>

        {/* Current page label */}
        <span style={{ fontSize: 12, color: '#64748b' }}>
          {currentPage?.name ?? '—'}
        </span>

        {/* Status message */}
        {statusMessage && (
          <span
            style={{
              fontSize: 12,
              padding: '2px 10px',
              borderRadius: 20,
              background:
                statusMessage.type === 'error'
                  ? '#450a0a'
                  : statusMessage.type === 'warn'
                  ? '#422006'
                  : '#0c2a4a',
              color:
                statusMessage.type === 'error'
                  ? '#fca5a5'
                  : statusMessage.type === 'warn'
                  ? '#fbbf24'
                  : '#93c5fd',
            }}
          >
            {statusMessage.text}
          </span>
        )}

        {/* No nav warning */}
        {navMap.length === 0 && (
          <span
            style={{
              fontSize: 12,
              color: '#fbbf24',
              background: '#422006',
              padding: '2px 10px',
              borderRadius: 20,
            }}
          >
            No navigation configured — go to Logic Builder to connect pages
          </span>
        )}

        <div style={{ flex: 1 }} />

        {/* Breadcrumb trail */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          {history.map((pageId, i) => {
            const p = pages.find((x) => x.id === pageId);
            const isLast = i === history.length - 1;
            return (
              <span key={`${pageId}-${i}`} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                <span
                  style={{
                    fontSize: 11,
                    color: isLast ? '#f8fafc' : '#64748b',
                    fontWeight: isLast ? 600 : 400,
                  }}
                >
                  {p?.name ?? pageId}
                </span>
                {!isLast && (
                  <span style={{ fontSize: 11, color: '#475569' }}>→</span>
                )}
              </span>
            );
          })}
        </div>
      </div>

      {/* ── Main area ── */}
      <div
        style={{
          flex: 1,
          display: 'flex',
          overflow: 'hidden',
        }}
      >
        {/* Left sidebar — page list */}
        <div
          style={{
            width: 180,
            background: '#1e293b',
            borderRight: '1px solid #334155',
            overflowY: 'auto',
            flexShrink: 0,
            padding: '12px 0',
          }}
        >
          <div
            style={{
              fontSize: 10,
              color: '#475569',
              fontWeight: 700,
              padding: '0 14px 8px',
              textTransform: 'uppercase',
              letterSpacing: '0.06em',
            }}
          >
            Pages
          </div>
          {pages.map((page) => {
            const isActive = page.id === currentPageId;
            return (
              <div
                key={page.id}
                onClick={() => navigate(page.id)}
                style={{
                  padding: '9px 14px',
                  fontSize: 13,
                  cursor: 'pointer',
                  color: isActive ? '#f8fafc' : '#94a3b8',
                  background: isActive ? '#334155' : 'transparent',
                  borderLeft: isActive
                    ? '3px solid #3b82f6'
                    : '3px solid transparent',
                  userSelect: 'none',
                }}
              >
                {page.name}
              </div>
            );
          })}
        </div>

        {/* Centre — device frame */}
        <div
          style={{
            flex: 1,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            overflow: 'auto',
            padding: 40,
          }}
        >
          {currentPage && srcDoc ? (
            <MobileFrame
              srcDoc={srcDoc}
              pageKey={currentPageId ?? 'none'}
              iframeRef={iframeRef}
            />
          ) : (
            <div style={{ color: '#475569', fontSize: 14 }}>
              Select a page from the sidebar.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Mobile frame component ──────────────────────────────────────────────────

interface MobileFrameProps {
  srcDoc: string;
  pageKey: string;
  iframeRef: React.RefObject<HTMLIFrameElement | null>;
}

function MobileFrame({ srcDoc, pageKey, iframeRef }: MobileFrameProps) {
  // Scale the 390×844 frame to fit comfortably in the viewport.
  // We target a displayed height of ~70vh.
  const displayHeight = Math.min(700, typeof window !== 'undefined' ? window.innerHeight * 0.78 : 700);
  const scale = displayHeight / FRAME_HEIGHT;
  const displayWidth = FRAME_WIDTH * scale;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14 }}>
      {/* Phone shell */}
      <div
        style={{
          width: displayWidth,
          height: displayHeight,
          borderRadius: 40 * scale,
          background: '#1e293b',
          padding: 10 * scale,
          boxShadow: '0 30px 80px rgba(0,0,0,0.5), 0 0 0 1px #334155',
          position: 'relative',
          flexShrink: 0,
        }}
      >
        {/* Notch */}
        <div
          style={{
            position: 'absolute',
            top: 14 * scale,
            left: '50%',
            transform: 'translateX(-50%)',
            width: 80 * scale,
            height: 20 * scale,
            background: '#0f172a',
            borderRadius: 12 * scale,
            zIndex: 10,
          }}
        />

        {/* Screen area */}
        <div
          style={{
            width: '100%',
            height: '100%',
            borderRadius: 30 * scale,
            overflow: 'hidden',
            background: '#fff',
            position: 'relative',
          }}
        >
          {/* Scale wrapper — renders the iframe at true pixel size then scales it down */}
          <div
            style={{
              width: FRAME_WIDTH,
              height: FRAME_HEIGHT,
              transformOrigin: 'top left',
              transform: `scale(${scale})`,
              position: 'absolute',
              top: 0,
              left: 0,
            }}
          >
            <iframe
              key={pageKey}
              ref={iframeRef}
              srcDoc={srcDoc}
              style={{
                width: FRAME_WIDTH,
                height: FRAME_HEIGHT,
                border: 'none',
                display: 'block',
              }}
              sandbox="allow-scripts"
              title="App preview"
            />
          </div>
        </div>
      </div>

      {/* Frame label */}
      <span style={{ fontSize: 11, color: '#475569' }}>
        Mobile — {FRAME_WIDTH} × {FRAME_HEIGHT}
      </span>
    </div>
  );
}
