import type { OutputJson } from './flowToOutputJson';

export function downloadOutputJson(output: OutputJson, projectName?: string): void {
  const jsonStr = JSON.stringify(output, null, 2);
  const blob = new Blob([jsonStr], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const timestamp = new Date()
    .toISOString()
    .replace(/[:.]/g, '-')
    .replace('T', '_')
    .slice(0, 19);
  const safeName = (projectName || 'output').replace(/[^a-zA-Z0-9]/g, '_').toLowerCase();
  const a = document.createElement('a');
  a.href = url;
  a.download = `${safeName}_${timestamp}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}