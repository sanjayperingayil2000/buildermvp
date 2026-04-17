import type { Manifest } from '@/shared/types/manifest';
import { normalizeFlutterManifest } from './flutterManifestAdapter';
import { normalizeV2Manifest } from './v2ManifestAdapter';

type RawJsonRecord = Record<string, unknown>;

function isFlutterFormat(raw: unknown): boolean {
  if (!raw || typeof raw !== 'object') return false;

  const record = raw as RawJsonRecord & { manifest_version?: string };

  if (record.manifest_version) return false;

  if (record.targetPlatform === 'flutter') return true;
  if (record.flutterNotes !== undefined) return true;

  if (Array.isArray(record.pages) && record.pages.length > 0) {
    const firstPage = record.pages[0];
    if (firstPage && typeof firstPage === 'object') {
      return 'children' in firstPage || 'child' in firstPage;
    }
  }

  return false;
}

export function detectAndNormalizeManifest(rawJson: unknown): Manifest {
  const json = rawJson as RawJsonRecord;

  if (json.manifest_version === '2.0') {
    return normalizeV2Manifest(rawJson);
  }

  if (isFlutterFormat(rawJson)) {
    return normalizeFlutterManifest(rawJson);
  }

  return rawJson as Manifest;
}

export { normalizeFlutterManifest } from './flutterManifestAdapter';