// Utility functions for creating, searching, and traversing the bookmark tree.

import type { Folder, Bookmark, TreeNode } from './types';
import { uid } from './uid';

// Returns the current time in seconds since epoch.
export const nowSec = () => Math.floor(Date.now() / 1000);

// Creates a new root-level folder with optional toolbar flag.
export function makeRoot(title: string, toolbar = false): Folder {
  return {
    id: uid(),
    type: 'folder',
    title,
    addDate: nowSec(),
    lastModified: nowSec(),
    personalToolbarFolder: toolbar,
    children: [],
  };
}

// Creates a new subfolder.
export function makeFolder(title: string): Folder {
  return {
    id: uid(),
    type: 'folder',
    title,
    addDate: nowSec(),
    lastModified: nowSec(),
    children: [],
  };
}

// Creates a new bookmark node.
export function makeBookmark(
  url: string,
  title: string,
  iconData: string | null = null,
  iconURI: string | null = null,
): Bookmark {
  return {
    id: uid(),
    type: 'bookmark',
    title,
    href: url,
    addDate: nowSec(),
    iconData,
    iconURI,
  };
}

// Finds a node by ID anywhere in the tree, returns null if not found.
export function findNodeById(roots: Folder[], id: string): TreeNode | null {
  for (const root of roots) {
    const found = findInFolder(root, id);
    if (found) return found;
  }
  return null;
}

// Recursively searches a folder and its children for a node by ID.
function findInFolder(folder: Folder, id: string): TreeNode | null {
  if (folder.id === id) return folder;
  for (const child of folder.children) {
    if (child.id === id) return child;
    if (child.type === 'folder') {
      const found = findInFolder(child, id);
      if (found) return found;
    }
  }
  return null;
}

// Finds the parent folder of a node by ID, returns null if not found.
export function findParent(roots: Folder[], nodeId: string): Folder | null {
  for (const root of roots) {
    const found = findParentInFolder(root, nodeId);
    if (found) return found;
  }
  return null;
}

// Recursively searches for the parent folder containing a node.
function findParentInFolder(folder: Folder, nodeId: string): Folder | null {
  for (const child of folder.children) {
    if (child.id === nodeId) return folder;
    if (child.type === 'folder') {
      const found = findParentInFolder(child, nodeId);
      if (found) return found;
    }
  }
  return null;
}

// Returns an array of {id, title} segments forming the path to a node.
export function getBreadcrumb(roots: Folder[], nodeId: string): { id: string; title: string }[] {
  for (const root of roots) {
    const path = getBreadcrumbPath(root, nodeId, [{ id: root.id, title: root.title }]);
    if (path) return path;
  }
  return [];
}

// Recursively builds the breadcrumb path to a target node.
function getBreadcrumbPath(folder: Folder, targetId: string, path: { id: string; title: string }[]): { id: string; title: string }[] | null {
  if (folder.id === targetId) return path;
  for (const child of folder.children) {
    if (child.type === 'folder') {
      const result = getBreadcrumbPath(child, targetId, [...path, { id: child.id, title: child.title }]);
      if (result) return result;
    }
  }
  return null;
}

// Counts total folders and bookmarks across all roots.
export function countStats(roots: Folder[]): { folders: number; bookmarks: number } {
  let folders = 0;
  let bookmarks = 0;
  // Recursively tallies folder and bookmark counts.
  function walk(items: TreeNode[]) {
    for (const item of items) {
      if (item.type === 'folder') {
        folders++;
        walk(item.children);
      } else {
        bookmarks++;
      }
    }
  }
  walk(roots);
  return { folders, bookmarks };
}

// Deep clones an object using JSON serialization.
export function deepClone<T>(obj: T): T {
  return JSON.parse(JSON.stringify(obj));
}

// Checks if a string is a valid http or https URL.
export function isHttpUrl(s: string): boolean {
  try {
    const u = new URL(s);
    return u.protocol === 'http:' || u.protocol === 'https:';
  } catch {
    return false;
  }
}

// Returns a record of all folder IDs set to true (for expanding all).
export function getAllExpandedIds(roots: Folder[]): Record<string, boolean> {
  const ids: Record<string, boolean> = {};
  // Recursively collects all folder IDs.
  function walk(folder: Folder) {
    ids[folder.id] = true;
    for (const ch of folder.children) {
      if (ch.type === 'folder') walk(ch);
    }
  }
  for (const root of roots) walk(root);
  return ids;
}

// Returns an array of folder IDs from root to target, for expanding the path.
export function expandPathToNode(roots: Folder[], nodeId: string): string[] {
  for (const root of roots) {
    const path = getPathIds(root, nodeId, [root.id]);
    if (path) return path;
  }
  return [];
}

// Recursively builds the folder ID path to a target node.
function getPathIds(folder: Folder, targetId: string, path: string[]): string[] | null {
  if (folder.id === targetId) return path;
  for (const child of folder.children) {
    if (child.type === 'folder') {
      const result = getPathIds(child, targetId, [...path, child.id]);
      if (result) return result;
    }
  }
  return null;
}
