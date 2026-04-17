import type { Manifest } from '@/shared/types/manifest';
import { normalizeFlutterManifest } from '@/shared/lib/adapters/flutterManifestAdapter';
import { normalizeV2Manifest } from '@/shared/lib/adapters/v2ManifestAdapter';
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
        
        // Check for v2.0 manifest first - never treat as Flutter
        if (rawJson.manifest_version === '2.0') {
          parsed = normalizeV2Manifest(rawJson);
        } else if (
          rawJson.targetPlatform === 'flutter' || 
          rawJson.flutterNotes || 
          (Array.isArray(rawJson.pages) && rawJson.pages.length > 0 && typeof rawJson.pages[0] === 'object' && (
            'children' in (rawJson.pages[0] as Record<string, unknown>) ||
            'child' in (rawJson.pages[0] as Record<string, unknown>)
          ))
        ) {
          // Only check for children/child, NOT widgets - widgets are v2.0 format
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