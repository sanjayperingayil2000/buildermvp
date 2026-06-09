import type { Manifest } from '@/shared/types/manifest';
import { normalizeFlutterManifest } from '@/shared/lib/adapters/flutterManifestAdapter';
import { normalizeWidgetManifest } from '@/shared/lib/adapters/widgetManifestAdapter';
import { normalizeComponentManifest } from '@/shared/lib/adapters/componentSchemaAdapter';
import { validateManifest } from '@/shared/lib/validators/manifestValidator';

export function readAndValidateFile(file: File): Promise<{ fileName: string; status: 'success' | 'error'; errorMessage?: string; manifest?: Manifest; screenCount: number }> {
  return new Promise((resolve) => {
    if (!file.name.endsWith('.json')) {
      resolve({ fileName: file.name, status: 'error', errorMessage: 'Not a .json file', screenCount: 0 });
      return;
    }
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const text = e.target?.result as string;
        let parsed = JSON.parse(text);

        const rawJson = parsed as Record<string, unknown>;

        // Structural detection — duck-type by inspecting the first page's shape
        if (
          rawJson.schema_version === '1.0' ||
          (rawJson.pages && typeof rawJson.pages === 'object' && !Array.isArray(rawJson.pages))
        ) {
          parsed = normalizeComponentManifest(rawJson);
        } else if (Array.isArray(rawJson.pages) && rawJson.pages.length > 0) {
          const firstPage = rawJson.pages[0] as Record<string, unknown>;

          // Pages with 'widgets' → widget manifest, needs normalisation
          if ('widgets' in firstPage) {
            parsed = normalizeWidgetManifest(rawJson);
          }
          // Pages with 'children'/'child' → Flutter format
          else if ('children' in firstPage || 'child' in firstPage) {
            parsed = normalizeFlutterManifest(rawJson);
          }
          // Pages with 'elements' → already internal format, pass through
          // (no transformation needed)
        } else if (
          rawJson.targetPlatform === 'flutter' ||
          rawJson.flutterNotes
        ) {
          // Top-level Flutter markers (no pages array structure to inspect)
          parsed = normalizeFlutterManifest(rawJson);
        }

        const errors = validateManifest(parsed);
        if (errors.length > 0) {
          resolve({ fileName: file.name, status: 'error', errorMessage: errors.join(', '), screenCount: 0 });
        } else {
          const manifest = parsed as Manifest;
          resolve({ fileName: file.name, status: 'success', manifest, screenCount: Array.isArray(manifest.pages) ? manifest.pages.length : 0 });
        }
      } catch {
        resolve({ fileName: file.name, status: 'error', errorMessage: 'Invalid JSON parsing', screenCount: 0 });
      }
    };
    reader.onerror = () => resolve({ fileName: file.name, status: 'error', errorMessage: 'File read error', screenCount: 0 });
    reader.readAsText(file);
  });
}

export function mergeManifests(manifests: Manifest[]): Manifest {
  return { pages: manifests.flatMap((m) => m.pages) };
}