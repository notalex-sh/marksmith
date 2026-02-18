// Data types for bookmarks, folders, and application state.

export interface Bookmark {
  id: string;
  type: 'bookmark';
  title: string;
  href: string;
  addDate: number;
  iconData: string | null;
  iconURI: string | null;
}

export interface Folder {
  id: string;
  type: 'folder';
  title: string;
  addDate: number;
  lastModified: number;
  personalToolbarFolder?: boolean;
  children: TreeNode[];
}

export type TreeNode = Folder | Bookmark;

export interface HistoryEntry {
  roots: Folder[];
  selectedId: string | null;
}

export interface Toast {
  id: string;
  message: string;
  type: 'success' | 'error' | 'info';
}
