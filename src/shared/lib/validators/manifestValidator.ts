export function validateManifest(manifest: unknown): string[] {
  const errors: string[] = [];

  if (!manifest || typeof manifest !== 'object') {
    errors.push('Manifest must be a JSON object.');
    return errors;
  }

  const m = manifest as Record<string, unknown>;

  if (!Array.isArray(m.pages)) {
    errors.push('"pages" must be an array.');
  } else {
    m.pages.forEach((p: unknown, i: number) => {
      if (!p || typeof p !== 'object') {
        errors.push(`pages[${i}] is not an object.`);
        return;
      }
      const page = p as Record<string, unknown>;
      if (typeof page.id !== 'string' || !page.id) {
        errors.push(`pages[${i}].id is missing or not a string.`);
      }
      if (typeof page.name !== 'string' || !page.name) {
        errors.push(`pages[${i}].name is missing or not a string.`);
      }
      if (page.elements !== undefined && !Array.isArray(page.elements)) {
        errors.push(`pages[${i}].elements must be an array.`);
      } else if (Array.isArray(page.elements)) {
        page.elements.forEach((el: unknown, j: number) => {
          if (!el || typeof el !== 'object') {
            errors.push(`pages[${i}].elements[${j}] is not an object.`);
            return;
          }
          const element = el as Record<string, unknown>;
          if (typeof element.id !== 'string' || !element.id) {
            errors.push(`pages[${i}].elements[${j}].id is missing or not a string.`);
          }
          if (typeof element.type !== 'string' || !element.type) {
            errors.push(`pages[${i}].elements[${j}].type is missing or not a string.`);
          }
          if (typeof element.name !== 'string' || !element.name) {
            errors.push(`pages[${i}].elements[${j}].name is missing or not a string.`);
          }
        });
      }
    });
  }

  return errors;
}