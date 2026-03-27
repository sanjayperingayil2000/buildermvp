'use client';

import { useEffect, useRef, useCallback, useState } from 'react';
import grapesjs, { Editor } from 'grapesjs';
import 'grapesjs/dist/css/grapes.min.css';
import newsletterPlugin from './index';
import PagesPanel from './PagesPanel';
import { extractPagesForFlow } from './extractPagesForFlow';
import { useAppStore } from '@/shared/store/useAppStore';
import type { PluginOptions } from '@/shared/models/template-builder-plugin';

interface TemplateBuilderProps {
  pluginOptions?: Partial<PluginOptions>;
}

const HEADER_HEIGHT = 48;
const PAGES_PANEL_WIDTH = 220;

/** Generate a unique action ID for buttons and anchors */
function generateActionId(): string {
  return 'action-' + Date.now() + '-' + Math.random().toString(36).slice(2, 7);
}

/** Ensure a page's root component has data-page-id set */
function ensurePageId(editor: Editor, pageId?: string) {
  const page = pageId
    ? editor.Pages.getAll().find((p) => p.getId() === pageId)
    : editor.Pages.getSelected();
  if (!page) return;

  const root = page.getMainComponent();
  if (root) {
    root.addAttributes({ 'data-page-id': page.getId() });
  }
}

/** Scan all buttons/anchors on the current page and assign data-action-id if missing */
function scanAndAssignActionIds(editor: Editor) {
  const wrapper = editor.getWrapper();
  if (!wrapper) return;

  const matches = wrapper.find('button, a');
  matches.forEach((component) => {
    const attrs = component.getAttributes();
    if (!attrs['data-action-id']) {
      component.addAttributes({ 'data-action-id': generateActionId() });
    }
  });
}

/** Register the readonly-text trait type and add it to button/link components */
function registerTraitsAndComponents(editor: Editor) {
  // Register readonly-text trait type
  editor.TraitManager.addType('readonly-text', {
    createInput({ trait }) {
      const el = document.createElement('div');
      el.style.padding = '5px 8px';
      el.style.color = '#dae5e6';
      el.style.fontSize = '12px';
      el.style.fontFamily = 'monospace';
      el.style.background = '#2b2e3b';
      el.style.borderRadius = '3px';
      el.style.wordBreak = 'break-all';
      el.style.userSelect = 'text';
      return el;
    },
    onUpdate({ elInput, component }) {
      const actionId = component.getAttributes()['data-action-id'] || '—';
      elInput.textContent = actionId;
    },
  });

  // Extend the default link component type
  const defaultLinkType = editor.DomComponents.getType('link');
  const defaultLinkModel = defaultLinkType?.model;

  editor.DomComponents.addType('link', {
    model: {
      defaults: {
        ...defaultLinkModel?.prototype?.defaults,
        traits: [
          ...(defaultLinkModel?.prototype?.defaults?.traits || []),
          {
            type: 'readonly-text',
            name: 'data-action-id',
            label: 'Action ID',
          },
        ],
      },
    },
  });

  // Extend the default default component to catch <a> tags that aren't 'link' type
  // And also handle <button> tags
  // For button type - GrapesJS doesn't have a built-in 'button' type,
  // so we register one matching tagName 'a' class 'button' and general buttons
  editor.DomComponents.addType('button-action', {
    isComponent: (el) => el.tagName === 'BUTTON',
    model: {
      defaults: {
        tagName: 'button',
        traits: [
          {
            type: 'readonly-text',
            name: 'data-action-id',
            label: 'Action ID',
          },
        ],
      },
    },
  });
}

export default function TemplateBuilder({ pluginOptions }: TemplateBuilderProps) {
  const editorRef = useRef<Editor | null>(null);
  const [editorReady, setEditorReady] = useState<Editor | null>(null);

  useEffect(() => {
    if (editorRef.current) return;

    const editor = grapesjs.init({
      container: '#gjs',
      height: '100%',
      width: '100%',
      fromElement: false,
      storageManager: false,
      plugins: [newsletterPlugin],
      pluginsOpts: {
        [newsletterPlugin as unknown as string]: {
          ...pluginOptions,
        },
      },
    });

    editorRef.current = editor;

    // --- Register traits & component types ---
    registerTraitsAndComponents(editor);

    // --- Task 2: Auto-assign data-page-id ---
    // Set for all existing pages immediately
    editor.Pages.getAll().forEach((page) => {
      ensurePageId(editor, page.getId());
    });

    // Listen for new pages
    editor.on('page:add', (page: { getId: () => string }) => {
      ensurePageId(editor, page.getId());
    });

    // On page select, re-ensure the page ID (handles component tree recreation)
    editor.on('page:select', () => {
      ensurePageId(editor);
      // Task 3: Also scan for missing action IDs on page switch
      scanAndAssignActionIds(editor);
    });

    // --- Task 3: Auto-assign data-action-id to buttons/anchors ---
    editor.on('component:add', (component: { get: (key: string) => string; getAttributes: () => Record<string, string>; addAttributes: (attrs: Record<string, string>) => void }) => {
      const type = component.get('type');
      const tagName = component.get('tagName');

      const isButton = type === 'button' || type === 'button-action' || tagName === 'button';
      const isAnchor = type === 'link' || tagName === 'a';

      if (isButton || isAnchor) {
        const attrs = component.getAttributes();
        if (!attrs['data-action-id']) {
          component.addAttributes({ 'data-action-id': generateActionId() });
        }
      }
    });

    // Initial scan for existing components
    scanAndAssignActionIds(editor);

    // Signal that editor is ready for PagesPanel rendering
    setEditorReady(editor);

    return () => {
      if (editorRef.current) {
        editorRef.current.destroy();
        editorRef.current = null;
        setEditorReady(null);
      }
    };
  }, [pluginOptions]);

  const handleSave = useCallback(() => {
    const editor = editorRef.current;
    if (!editor) {
      console.warn('Editor not initialized yet.');
      return;
    }

    // 1. Get raw project data
    const rawJson = editor.getProjectData();

    // 2. Get structured per-page data
    const pagesForFlow = extractPagesForFlow(editor);

    // 3. Write to Zustand store
    useAppStore.getState().setRawJson(rawJson as Record<string, unknown>);
    useAppStore.getState().setPages(pagesForFlow);

    // 4. Log both for verification
    console.log('=== Raw GrapesJS Project Data ===');
    console.log(JSON.stringify(rawJson, null, 2));
    console.log('=== Structured Pages for Flow ===');
    console.log(JSON.stringify(pagesForFlow, null, 2));
  }, []);

  return (
<div style={{ display: 'flex', flexDirection: 'column', height: '100%', flex: 1 }}>      <header
        style={{
          left: 0,
          right: 0,
          height: `${HEADER_HEIGHT}px`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'flex-end',
          padding: '0 16px',
          background: '#2b2e3b',
          borderBottom: '1px solid #3a3f4e',
flexShrink: 0,        }}
      >
        <button
          onClick={handleSave}
          style={{
            padding: '8px 20px',
            backgroundColor: '#35d7bb',
            color: '#1e1e2e',
            border: 'none',
            borderRadius: '6px',
            fontWeight: 600,
            fontSize: '14px',
            cursor: 'pointer',
          }}
        >
          Save App UI
        </button>
      </header>
      <div
        style={{
          display: 'flex',
          flex: 1,
          minHeight: 0,
        }}
      >
        {editorReady && <PagesPanel editor={editorReady} />}
        <div id="gjs" style={{ flex: 1 }} />
      </div>
    </div>
  );
}
