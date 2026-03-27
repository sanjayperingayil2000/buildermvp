'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import type { Editor, Page } from 'grapesjs';

interface PagesPanelProps {
  editor: Editor;
}

export default function PagesPanel({ editor }: PagesPanelProps) {
  const [pages, setPages] = useState<Page[]>([]);
  const [selectedPageId, setSelectedPageId] = useState<string>('');
  const [isAdding, setIsAdding] = useState(false);
  const [addName, setAddName] = useState('');
  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [renameName, setRenameName] = useState('');
  const addInputRef = useRef<HTMLInputElement>(null);
  const renameInputRef = useRef<HTMLInputElement>(null);

  const syncPages = useCallback(() => {
    const allPages = editor.Pages.getAll();
    setPages([...allPages]);
    const selected = editor.Pages.getSelected();
    if (selected) {
      setSelectedPageId(selected.getId());
    }
  }, [editor]);

  useEffect(() => {
    syncPages();

    const onPageChange = () => syncPages();

    editor.on('page:add', onPageChange);
    editor.on('page:remove', onPageChange);
    editor.on('page:select', onPageChange);
    editor.on('page:update', onPageChange);

    return () => {
      editor.off('page:add', onPageChange);
      editor.off('page:remove', onPageChange);
      editor.off('page:select', onPageChange);
      editor.off('page:update', onPageChange);
    };
  }, [editor, syncPages]);

  // Auto-focus the add input when it appears
  useEffect(() => {
    if (isAdding && addInputRef.current) {
      addInputRef.current.focus();
    }
  }, [isAdding]);

  // Auto-focus the rename input when it appears
  useEffect(() => {
    if (renamingId && renameInputRef.current) {
      renameInputRef.current.focus();
    }
  }, [renamingId]);

  const handleSelectPage = (pageId: string) => {
    editor.Pages.select(pageId);
  };

  // --- Add page with inline input ---
  const handleStartAdd = () => {
    setAddName('');
    setIsAdding(true);
  };

  const handleConfirmAdd = () => {
    if (addName.trim()) {
      editor.Pages.add({ name: addName.trim() });
    }
    setIsAdding(false);
    setAddName('');
  };

  const handleCancelAdd = () => {
    setIsAdding(false);
    setAddName('');
  };

  // --- Rename page with inline input ---
  const handleStartRename = (page: Page) => {
    setRenamingId(page.getId());
    setRenameName(page.get('name') || '');
  };

  const handleConfirmRename = () => {
    if (renamingId && renameName.trim()) {
      const page = editor.Pages.getAll().find((p) => p.getId() === renamingId);
      if (page) {
        page.set('name', renameName.trim());
        editor.Pages.select(page.getId());
      }
    }
    setRenamingId(null);
    setRenameName('');
  };

  const handleCancelRename = () => {
    setRenamingId(null);
    setRenameName('');
  };

  const handleDeletePage = (pageId: string) => {
    if (editor.Pages.getAll().length === 1) {
      return; // silently ignore — can't delete last page
    }
    editor.Pages.remove(pageId);
  };

  const inputStyle: React.CSSProperties = {
    width: '100%',
    padding: '6px 8px',
    fontSize: '13px',
    background: '#2b2e3b',
    color: '#ededed',
    border: '1px solid #4c9790',
    borderRadius: '4px',
    outline: 'none',
  };

  const smallBtnStyle: React.CSSProperties = {
    padding: '4px 8px',
    fontSize: '11px',
    fontWeight: 600,
    border: 'none',
    borderRadius: '3px',
    cursor: 'pointer',
  };

  return (
    <div
      style={{
        width: '220px',
        height: '100%',
        backgroundColor: '#373d49',
        borderRight: '1px solid #4a5568',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
      }}
    >
      <div
        style={{
          padding: '12px',
          borderBottom: '1px solid #4a5568',
          color: '#dae5e6',
          fontWeight: 600,
          fontSize: '13px',
          textTransform: 'uppercase',
          letterSpacing: '0.5px',
        }}
      >
        Pages
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: '8px' }}>
        {pages.map((page) => {
          const pageId = page.getId();
          const pageName = page.get('name') || 'Untitled';
          const isActive = pageId === selectedPageId;
          const isRenaming = renamingId === pageId;

          if (isRenaming) {
            return (
              <div key={pageId} style={{ marginBottom: '4px' }}>
                <input
                  ref={renameInputRef}
                  value={renameName}
                  onChange={(e) => setRenameName(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleConfirmRename();
                    if (e.key === 'Escape') handleCancelRename();
                  }}
                  style={inputStyle}
                  placeholder="Page name"
                />
                <div style={{ display: 'flex', gap: '4px', marginTop: '4px' }}>
                  <button
                    onClick={handleConfirmRename}
                    style={{ ...smallBtnStyle, background: '#35d7bb', color: '#1e1e2e', flex: 1 }}
                  >
                    Save
                  </button>
                  <button
                    onClick={handleCancelRename}
                    style={{ ...smallBtnStyle, background: '#4a5568', color: '#dae5e6', flex: 1 }}
                  >
                    Cancel
                  </button>
                </div>
              </div>
            );
          }

          return (
            <div
              key={pageId}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                padding: '8px 10px',
                marginBottom: '4px',
                borderRadius: '4px',
                backgroundColor: isActive ? '#4c9790' : 'transparent',
                color: isActive ? '#fff' : '#dae5e6',
                cursor: 'pointer',
                fontSize: '13px',
                transition: 'background-color 0.15s',
              }}
              onClick={() => handleSelectPage(pageId)}
            >
              <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {pageName}
              </span>

              <button
                onClick={(e) => { e.stopPropagation(); handleStartRename(page); }}
                title="Rename"
                style={{
                  background: 'none',
                  border: 'none',
                  color: isActive ? '#fff' : '#9ca3af',
                  cursor: 'pointer',
                  padding: '2px 4px',
                  fontSize: '12px',
                  lineHeight: 1,
                  flexShrink: 0,
                }}
              >
                ✏️
              </button>

              <button
                onClick={(e) => { e.stopPropagation(); handleDeletePage(pageId); }}
                title="Delete"
                style={{
                  background: 'none',
                  border: 'none',
                  color: isActive ? '#fff' : '#9ca3af',
                  cursor: 'pointer',
                  padding: '2px 4px',
                  fontSize: '12px',
                  lineHeight: 1,
                  flexShrink: 0,
                }}
              >
                ✕
              </button>
            </div>
          );
        })}

        {/* Inline add page form */}
        {isAdding && (
          <div style={{ marginTop: '4px' }}>
            <input
              ref={addInputRef}
              value={addName}
              onChange={(e) => setAddName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleConfirmAdd();
                if (e.key === 'Escape') handleCancelAdd();
              }}
              style={inputStyle}
              placeholder="Page name"
            />
            <div style={{ display: 'flex', gap: '4px', marginTop: '4px' }}>
              <button
                onClick={handleConfirmAdd}
                style={{ ...smallBtnStyle, background: '#35d7bb', color: '#1e1e2e', flex: 1 }}
              >
                Add
              </button>
              <button
                onClick={handleCancelAdd}
                style={{ ...smallBtnStyle, background: '#4a5568', color: '#dae5e6', flex: 1 }}
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>

      <div style={{ padding: '8px', borderTop: '1px solid #4a5568' }}>
        <button
          onClick={handleStartAdd}
          disabled={isAdding}
          style={{
            width: '100%',
            padding: '8px',
            backgroundColor: isAdding ? '#4a5568' : '#35d7bb',
            color: isAdding ? '#9ca3af' : '#1e1e2e',
            border: 'none',
            borderRadius: '4px',
            fontWeight: 600,
            fontSize: '13px',
            cursor: isAdding ? 'default' : 'pointer',
          }}
        >
          + Add Page
        </button>
      </div>
    </div>
  );
}
