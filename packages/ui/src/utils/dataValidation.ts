/**
 * Data Validation Utilities
 *
 * Ensures data integrity and helps identify issues with backend responses
 */

/**
 * Deduplicate items by ID, keeping the first occurrence
 * Logs duplicates to console for debugging
 */
export function deduplicateById<T extends { id: string }>(items: T[]): T[] {
  const seen = new Set<string>();
  const duplicates: string[] = [];

  const unique = items.filter((item) => {
    if (seen.has(item.id)) {
      duplicates.push(item.id);
      return false;
    }
    seen.add(item.id);
    return true;
  });

  if (duplicates.length > 0) {
    console.warn(
      `⚠️ Data Deduplication: Found ${duplicates.length} duplicate IDs:`,
      duplicates
    );
  }

  return unique;
}

/**
 * Ensure all items have unique IDs
 * If duplicates exist, append index to make them unique
 * Logs warning to console
 */
export function ensureUniqueIds<T extends { id: string }>(items: T[]): T[] {
  const seen = new Map<string, number>();
  const modified: T[] = [];
  const duplicates: string[] = [];

  items.forEach((item) => {
    if (seen.has(item.id)) {
      const count = seen.get(item.id)!;
      seen.set(item.id, count + 1);
      const uniqueId = `${item.id}-${count}`;
      duplicates.push(`${item.id} → ${uniqueId}`);
      modified.push({ ...item, id: uniqueId } as T);
    } else {
      seen.set(item.id, 1);
      modified.push(item);
    }
  });

  if (duplicates.length > 0) {
    console.warn(
      `⚠️ Data Integrity Issue: Modified ${duplicates.length} duplicate IDs:`,
      duplicates
    );
    console.warn(
      "🔧 This indicates your backend is returning non-unique IDs. Please fix the backend!"
    );
  }

  return modified;
}

/**
 * Validate data structure
 */
export function validateArrayItems<T extends { id: string }>(
  items: T[],
  context: string
): boolean {
  if (!Array.isArray(items)) {
    console.error(`❌ ${context}: Expected array, got ${typeof items}`);
    return false;
  }

  const ids = items.map((item) => item.id);
  const uniqueIds = new Set(ids);

  if (ids.length !== uniqueIds.size) {
    const duplicates = ids.filter((id, index) => ids.indexOf(id) !== index);
    console.error(
      `❌ ${context}: Found duplicate IDs: ${duplicates.join(", ")}`
    );
    return false;
  }

  return true;
}
