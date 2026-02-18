// Full-text search across the bookmark tree by title and URL.

import type { Folder, TreeNode } from './types';

export interface SearchResult {
  node: TreeNode;
  path: string[];
  parentId: string | null;
}

// Searches all roots for nodes matching the query string (case-insensitive).
export function searchTree(roots: Folder[], query: string): SearchResult[] {
  if (!query.trim()) return [];
  const q = query.toLowerCase();
  const results: SearchResult[] = [];

  // Recursively matches children against the query and collects results.
  function walk(folder: Folder, path: string[]) {
    for (const child of folder.children) {
      const childPath = [...path, folder.title];
      if (child.type === 'bookmark') {
        if (child.title.toLowerCase().includes(q) || child.href.toLowerCase().includes(q)) {
          results.push({ node: child, path: childPath, parentId: folder.id });
        }
      } else {
        if (child.title.toLowerCase().includes(q)) {
          results.push({ node: child, path: childPath, parentId: folder.id });
        }
        walk(child, childPath);
      }
    }
  }

  for (const root of roots) {
    if (root.title.toLowerCase().includes(q)) {
      results.push({ node: root, path: [], parentId: null });
    }
    walk(root, []);
  }

  return results;
}
