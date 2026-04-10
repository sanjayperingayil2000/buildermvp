import type { Manifest } from '@/shared/types/manifest';
import { normalizeFlutterManifest } from './flutterManifestAdapter';

export function detectAndNormalizeManifest(rawJson: unknown): Manifest {
  const json = rawJson as Record<string, unknown>;
  const isFlutter = 
    json.targetPlatform === 'flutter' || 
    json.flutterNotes || 
    (Array.isArray(json.pages) && json.pages.length > 0 && typeof json.pages[0] === 'object' && (
      'widgets' in (json.pages[0] as Record<string, unknown>) || 
      'children' in (json.pages[0] as Record<string, unknown>) ||
      'child' in (json.pages[0] as Record<string, unknown>)
    ));

  if (isFlutter) {
    return normalizeFlutterManifest(rawJson);
  }

  return rawJson as Manifest;
}

export { normalizeFlutterManifest } from './flutterManifestAdapter';