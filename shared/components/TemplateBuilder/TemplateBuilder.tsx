'use client';

import { useEffect, useRef, useCallback, useState } from 'react';
import grapesjs, { Editor } from 'grapesjs';
import 'grapesjs/dist/css/grapes.min.css';
import newsletterPlugin from './index';
import PagesPanel from './PagesPanel';
import { extractPagesForFlow } from './extractPagesForFlow';
import { useAppStore } from '@/shared/store/useAppStore';
import type { PluginOptions } from '@/shared/models/template-builder-plugin';

const mockFlutterJson = {
  "manifestVersion": "1.0.0",
  "generatedAt": "2026-04-07T10:48:45Z",
  "generatedBy": "figma-to-flutter-architect",
  "appMeta": {
    "appName": "Petro7 AutoPago",
    "packageName": "com.petro7.autopago",
    "figmaFileId": "extracted_from_png",
    "figmaFileName": "Home_Screen_Design",
    "totalPages": 1,
    "entryPage": "welcome_page"
  },
  "theme": {
    "colorTokens": {
      "primary": "#FF266B54",
      "primaryVariant": "#FF1A4F3D",
      "secondary": "#FFE05030",
      "background": "#FF266B54",
      "surface": "#FFFFFFFF",
      "error": "#FFB00020",
      "onPrimary": "#FFFFFFFF",
      "onBackground": "#FFFFFFFF",
      "onSurface": "#FF266B54",
      "textPrimary": "#FFFFFFFF",
      "textSecondary": "#FFD0D0D0",
      "divider": "#FFBDBDBD"
    },
    "typography": {
      "fontFamily": "Roboto",
      "h1": { "size": 96, "weight": 300, "letterSpacing": -1.5 },
      "h2": { "size": 60, "weight": 300, "letterSpacing": -0.5 },
      "body1": { "size": 16, "weight": 400, "letterSpacing": 0.5 },
      "body2": { "size": 14, "weight": 400, "letterSpacing": 0.25 },
      "button": { "size": 16, "weight": 600, "letterSpacing": 1.0 },
      "caption": { "size": 12, "weight": 400, "letterSpacing": 0.4 }
    },
    "borderRadius": {
      "small": 4,
      "medium": 8,
      "large": 16,
      "pill": 100
    },
    "spacing": {
      "xs": 4, "sm": 8, "md": 16, "lg": 24, "xl": 32, "xxl": 48
    }
  },
  "pages": [
    {
      "pageId": "welcome_page",
      "pageTitle": "Welcome Page",
      "screenType": "Splash",
      "isEntryPoint": true,
      "requiresAuth": false,
      "dartClassName": "WelcomePage",
      "dartFileName": "welcome_page.dart",
      "widgetType": "StatelessWidget",
      "layoutRoot": "Scaffold",
      "widgets": [
        {
          "widgetId": "welcome_text",
          "type": "Text",
          "label": "Welcome Greeting",
          "properties": {
            "text": "Bienvenido a",
            "fontSize": 28,
            "color": "#FFFFFFFF"
          }
        },
        {
          "widgetId": "petro7_logo",
          "type": "Image",
          "label": "Petro 7 Logo",
          "properties": {
            "height": 80,
            "assetPath": "assets/images/Logo-white.png"
          }
        },
        {
          "widgetId": "autopago_logo",
          "type": "Image",
          "label": "AutoPago Logo",
          "properties": {
            "height": 60,
            "assetPath": "assets/images/AutoPago_Logo.png"
          }
        },
        {
          "widgetId": "iniciar_button",
          "type": "ElevatedButton",
          "label": "Start Button CTA",
          "properties": {
            "text": "INICIAR",
            "backgroundColor": "#FFFFFFFF",
            "textColor": "#FF266B54",
            "width": "full"
          },
          "navigationTarget": "login_page",
          "navigationCondition": null
        }
      ],
      "stateFields": [],
      "conditionalElements": [],
      "widgetCode": "import 'package:flutter/material.dart';\n\nclass WelcomePage extends StatelessWidget {\n  const WelcomePage({super.key});\n\n  @override\n  Widget build(BuildContext context) {\n    return Scaffold(\n      backgroundColor: const Color(0xFF266B54),\n      body: SafeArea(\n        child: Center(\n          child: Padding(\n            padding: const EdgeInsets.symmetric(horizontal: 40.0),\n            child: Column(\n              mainAxisAlignment: MainAxisAlignment.center,\n              crossAxisAlignment: CrossAxisAlignment.center,\n              children: [\n                const Text(\n                  'Bienvenido a',\n                  style: TextStyle(\n                    color: Colors.white,\n                    fontSize: 28,\n                    fontWeight: FontWeight.w600,\n                  ),\n                ),\n                const SizedBox(height: 40),\n                Image.asset(\n                  'assets/images/Logo-white.png',\n                  height: 80,\n                  fit: BoxFit.contain,\n                ),\n                const SizedBox(height: 24),\n                Image.asset(\n                  'assets/images/AutoPago_Logo.png',\n                  height: 60,\n                  fit: BoxFit.contain,\n                ),\n                const SizedBox(height: 64),\n                SizedBox(\n                  width: double.infinity,\n                  height: 48,\n                  child: ElevatedButton(\n                    onPressed: () {\n                      // NAV: -> login_page\n                    },\n                    style: ElevatedButton.styleFrom(\n                      backgroundColor: Colors.white,\n                      foregroundColor: const Color(0xFF266B54),\n                      elevation: 0,\n                      shape: RoundedRectangleBorder(\n                        borderRadius: BorderRadius.circular(8),\n                      ),\n                    ),\n                    child: const Text(\n                      'INICIAR',\n                      style: TextStyle(\n                        fontSize: 16,\n                        fontWeight: FontWeight.w600,\n                        letterSpacing: 1.0,\n                      ),\n                    ),\n                  ),\n                ),\n              ],\n            ),\n          ),\n        ),\n      ),\n    );\n  }\n}",
      "reactFlowNode": {
        "nodeId": "welcome_page",
        "position": { "x": 0, "y": 0 },
        "dimensions": { "width": 180, "height": 80 },
        "label": "Welcome",
        "type": "pageNode"
      }
    }
  ],
  "navigationGraph": [
    {
      "edgeId": "nav_001",
      "sourcePageId": "welcome_page",
      "targetPageId": "login_page",
      "triggerWidget": "iniciar_button",
      "triggerType": "onTap",
      "transitionType": "slideLeft",
      "transitionDuration": 300,
      "condition": null,
      "label": "Navigate to Login/Home"
    }
  ],
  "conditionalNavigation": [],
  "globalConditions": {}
}

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
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  useEffect(() => {
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

    // --- Auto-assign data-page-id ---
    editor.Pages.getAll().forEach((page) => {
      ensurePageId(editor, page.getId());
    });

    editor.on('page:add', (page: { getId: () => string }) => {
      ensurePageId(editor, page.getId());
    });

    editor.on('page:select', () => {
      ensurePageId(editor);
      scanAndAssignActionIds(editor);
    });

    // --- Auto-assign data-action-id to buttons/anchors ---
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

    // Lightweight unsaved-changes indicator — only flips a local boolean
    const markDirty = () => setHasUnsavedChanges(true);
    editor.on('change:changesCount', markDirty);

    // Signal that editor is ready for PagesPanel rendering
    setEditorReady(editor);

    return () => {
      editor.off('change:changesCount', markDirty);
      editor.destroy();
      editorRef.current = null;
      setEditorReady(null);
    };
  }, [pluginOptions]);

  const handleSave = useCallback(() => {
    const editor = editorRef.current;
    if (!editor) {
      console.warn('Editor not initialized yet.');
      return;
    }

    const rawJson = editor.getProjectData();
    const pagesForFlow = extractPagesForFlow(editor);

    useAppStore.getState().setRawJson(rawJson as Record<string, unknown>);
    useAppStore.getState().setPages(pagesForFlow);

    setHasUnsavedChanges(false);

    console.log('Saved:', { projectData: rawJson, extractedPages: pagesForFlow });
  }, []);

// ---------------------------------------------------------
  // NEW: FLUTTER JSON LOAD & EXTRACT
  // ---------------------------------------------------------
  const handleLoadFlutter = useCallback(() => {
    // 2. Pass the Flutter JSON directly into your updated extractor function
    const pagesForFlow = extractPagesForFlow(mockFlutterJson);
    
    // 3. Push the results directly to the store
    useAppStore.getState().setPages(pagesForFlow);
    useAppStore.getState().setRawJson(mockFlutterJson);

    alert('Flutter JSON successfully loaded into React Flow!');
    console.log('Extracted Flutter Pages:', pagesForFlow);
  }, []);

  const handleLoad = useCallback(() => {
    const editor = editorRef.current;
    if (!editor) {
      console.warn('Editor not initialized yet.');
      return;
    }

    const savedRawJson = useAppStore.getState().rawJson;
    if (
      savedRawJson &&
      typeof savedRawJson === 'object' &&
      Object.keys(savedRawJson).length > 0
    ) {
      editor.loadProjectData(savedRawJson as Record<string, unknown>);
    } else {
      alert('No saved design found. Design something and click Save first.');
    }
  }, []);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', flex: 1 }}>
      <header
        style={{
          left: 0,
          right: 0,
          height: `${HEADER_HEIGHT}px`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'flex-end',
          padding: '0 16px',
          gap: '10px',
          background: '#2b2e3b',
          borderBottom: '1px solid #3a3f4e',
          flexShrink: 0,
        }}
      >
        {hasUnsavedChanges && (
          <span style={{ fontSize: 12, color: '#f59e0b', marginRight: 4 }}>
            Unsaved changes
          </span>
        )}

        {/* 4. Add the trigger button to your UI */}
        <button
          onClick={handleLoadFlutter}
          style={{
            padding: '8px 20px',
            backgroundColor: '#8b5cf6', // Purple to stand out
            color: '#ffffff',
            border: 'none',
            borderRadius: '6px',
            fontWeight: 600,
            fontSize: '14px',
            cursor: 'pointer',
          }}
        >
          Push Flutter JSON to Flow
        </button>

        <button
          onClick={handleLoad}
          style={{
            padding: '8px 20px',
            backgroundColor: '#4b5563',
            color: '#e5e7eb',
            border: 'none',
            borderRadius: '6px',
            fontWeight: 600,
            fontSize: '14px',
            cursor: 'pointer',
          }}
        >
          Load saved design
        </button>
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
          Save{hasUnsavedChanges ? ' *' : ''}
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
