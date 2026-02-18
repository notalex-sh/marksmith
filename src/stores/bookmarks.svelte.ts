// Central state store managing the bookmark tree, selection, history, and UI.

import type { Folder, TreeNode, Toast } from '../lib/types';
import { HistoryManager } from '../lib/history';
import {
  nowSec,
  makeRoot,
  makeFolder,
  makeBookmark,
  findNodeById,
  findParent,
  getBreadcrumb,
  countStats,
  isHttpUrl,
  getAllExpandedIds,
  expandPathToNode,
} from '../lib/tree-utils';
import { uid } from '../lib/uid';
import { queueIconFetch, setQueueChangeListener } from '../lib/favicon';
import { searchTree, type SearchResult } from '../lib/search';

const history = new HistoryManager();

let roots = $state<Folder[]>([]);
let selectedId = $state<string | null>(null);
let expandedIds = $state<Record<string, boolean>>({});
let showTreeBookmarks = $state(true);
let toasts = $state<Toast[]>([]);
let searchQuery = $state('');
let iconPending = $state(0);
let modalState = $state<{
  open: boolean;
  title: string;
  type: 'editFolder' | 'editBookmark' | 'confirm' | 'newRoot' | 'importChoice';
  nodeId?: string;
  onConfirm?: () => void;
  message?: string;
  importedData?: TreeNode[];
}>({ open: false, title: '', type: 'confirm' });

let canUndo = $state(false);
let canRedo = $state(false);

const stats = $derived(countStats(roots));
const selectedNode = $derived(selectedId ? findNodeById(roots, selectedId) as Folder | null : null);
const breadcrumb = $derived(selectedId ? getBreadcrumb(roots, selectedId) : []);
const searchResults = $derived<SearchResult[]>(searchQuery ? searchTree(roots, searchQuery) : []);

setQueueChangeListener((pending) => {
  iconPending = pending;
});

// Syncs the reactive canUndo/canRedo flags with the history manager.
function syncHistoryState(): void {
  canUndo = history.canUndo;
  canRedo = history.canRedo;
}

// Saves current state to the undo stack.
function pushHistory(): void {
  history.push(roots, selectedId);
  syncHistoryState();
}

// Initialises the store with a default root folder if empty.
function init(): void {
  if (roots.length === 0) {
    const root = makeRoot('Bookmarks');
    roots = [root];
    expandedIds = { [root.id]: true };
    selectedId = root.id;
  } else if (!selectedId) {
    expandedIds[roots[0].id] = true;
    selectedId = roots[0].id;
  }
}

// Selects a node and expands all parent folders along the path.
function selectNode(id: string): void {
  selectedId = id;
  const pathIds = expandPathToNode(roots, id);
  for (const pid of pathIds) {
    expandedIds[pid] = true;
  }
  expandedIds = { ...expandedIds };
}

// Toggles a single folder open or closed.
function toggleExpanded(id: string): void {
  expandedIds = { ...expandedIds, [id]: !expandedIds[id] };
}

// Opens all folders and shows bookmarks in the tree.
function expandAll(): void {
  expandedIds = getAllExpandedIds(roots);
  showTreeBookmarks = true;
}

// Opens all folders but hides bookmarks from the tree.
function collapseAll(): void {
  expandedIds = getAllExpandedIds(roots);
  showTreeBookmarks = false;
}

// Creates a subfolder inside the given parent folder.
function addFolder(parentId: string, name: string): void {
  const parent = findNodeById(roots, parentId);
  if (!parent || parent.type !== 'folder') return;
  pushHistory();
  const folder = makeFolder(name);
  parent.children.push(folder);
  parent.lastModified = nowSec();
  expandedIds = { ...expandedIds, [parentId]: true };
  roots = [...roots];
  addToast('Folder added', 'success');
}

// Creates a bookmark inside the given parent folder.
function addBookmark(
  parentId: string,
  url: string,
  title: string,
  fetchIcon: boolean,
): void {
  const parent = findNodeById(roots, parentId);
  if (!parent || parent.type !== 'folder') return;
  if (!title) {
    try { title = new URL(url).hostname; } catch { title = url; }
  }
  pushHistory();
  const bm = makeBookmark(url, title);
  parent.children.push(bm);
  parent.lastModified = nowSec();
  expandedIds = { ...expandedIds, [parentId]: true };
  roots = [...roots];

  if (fetchIcon && isHttpUrl(url)) {
    queueIconFetch(bm.id, url).then((result) => {
      const node = findNodeById(roots, bm.id);
      if (node && node.type === 'bookmark') {
        node.iconData = result.iconData;
        node.iconURI = result.iconURI;
        roots = [...roots];
      }
    });
  }

  addToast('Bookmark added', 'success');
}

// Parses multi-line text into bookmarks and adds them to a folder.
function bulkAdd(parentId: string, text: string, fetchIcons: boolean): { added: number; skipped: number } {
  const parent = findNodeById(roots, parentId);
  if (!parent || parent.type !== 'folder') return { added: 0, skipped: 0 };

  const lines = text.split('\n').map((s) => s.trim()).filter(Boolean);
  let added = 0;
  let skipped = 0;

  pushHistory();
  for (const line of lines) {
    let url = '';
    let title = '';
    const parts = line.split(',');
    if (parts.length > 1) {
      url = parts[0].trim();
      title = parts.slice(1).join(',').trim();
    } else {
      url = line.trim();
    }
    if (!url) { skipped++; continue; }
    if (!title) {
      try { title = new URL(url).hostname; } catch { title = url; }
    }
    const bm = makeBookmark(url, title);
    parent.children.push(bm);
    added++;

    if (fetchIcons && isHttpUrl(url)) {
      queueIconFetch(bm.id, url).then((result) => {
        const node = findNodeById(roots, bm.id);
        if (node && node.type === 'bookmark') {
          node.iconData = result.iconData;
          node.iconURI = result.iconURI;
          roots = [...roots];
        }
      });
    }
  }

  parent.lastModified = nowSec();
  expandedIds = { ...expandedIds, [parentId]: true };
  roots = [...roots];

  if (added > 0) addToast(`Added ${added} bookmark${added !== 1 ? 's' : ''}`, 'success');
  return { added, skipped };
}

// Removes a node (root or child) from the tree.
function deleteNode(nodeId: string): void {
  pushHistory();
  const rootIndex = roots.findIndex((r) => r.id === nodeId);
  if (rootIndex !== -1) {
    roots.splice(rootIndex, 1);
    if (selectedId === nodeId) {
      selectedId = roots.length > 0 ? roots[0].id : null;
    }
  } else {
    const parent = findParent(roots, nodeId);
    if (!parent) return;
    const idx = parent.children.findIndex((c) => c.id === nodeId);
    if (idx === -1) return;
    parent.children.splice(idx, 1);
    parent.lastModified = nowSec();
    if (selectedId === nodeId) {
      selectedId = parent.id;
    }
  }
  roots = [...roots];
  addToast('Deleted', 'success');
}

// Updates a node's title and optionally its href.
function editNode(nodeId: string, updates: { title?: string; href?: string }): void {
  const node = findNodeById(roots, nodeId);
  if (!node) return;
  pushHistory();
  if (updates.title !== undefined) node.title = updates.title;
  if (node.type === 'bookmark' && updates.href !== undefined) {
    node.href = updates.href;
  }
  if (node.type === 'folder') {
    node.lastModified = nowSec();
  } else {
    const parent = findParent(roots, nodeId);
    if (parent) parent.lastModified = nowSec();
  }
  roots = [...roots];
}

// Replaces a folder's children with a new ordered list (for drag-and-drop).
function reorderChildren(parentId: string, newChildren: TreeNode[]): void {
  const parent = findNodeById(roots, parentId);
  if (!parent || parent.type !== 'folder') return;
  pushHistory();
  parent.children = newChildren;
  parent.lastModified = nowSec();
  roots = [...roots];
}

// Replaces the root folder list with a new ordered list (for drag-and-drop).
function reorderRoots(newRoots: Folder[]): void {
  pushHistory();
  roots = newRoots;
}

// Moves a node from its current folder up into the grandparent folder.
function moveToParent(nodeId: string): void {
  const parent = findParent(roots, nodeId);
  if (!parent) return;
  const grandparent = findParent(roots, parent.id);
  if (!grandparent) return;
  const idx = parent.children.findIndex((c) => c.id === nodeId);
  if (idx === -1) return;
  pushHistory();
  const [node] = parent.children.splice(idx, 1);
  parent.lastModified = nowSec();
  const parentIdx = grandparent.children.findIndex((c) => c.id === parent.id);
  grandparent.children.splice(parentIdx + 1, 0, node);
  grandparent.lastModified = nowSec();
  roots = [...roots];
  addToast('Moved to parent folder', 'success');
}

// Adds a new root-level folder.
function addRoot(name: string, isToolbar: boolean): void {
  pushHistory();
  const root = makeRoot(name, isToolbar);
  roots = [...roots, root];
  expandedIds = { ...expandedIds, [root.id]: true };
  selectedId = root.id;
  addToast('Root folder added', 'success');
}

// Imports parsed bookmark nodes using the chosen merge strategy.
function importRoots(imported: TreeNode[], mode: 'replace' | 'merge' | 'alongside'): void {
  pushHistory();
  if (mode === 'merge' && selectedId) {
    const folder = findNodeById(roots, selectedId);
    if (folder && folder.type === 'folder') {
      folder.children.push(...imported);
      folder.lastModified = nowSec();
      expandedIds = { ...expandedIds, [folder.id]: true };
    }
  } else {
    const newRoots = imported.filter((item): item is Folder => item.type === 'folder');
    if (newRoots.length === 0) {
      const wrap = makeRoot('Imported');
      wrap.children.push(...imported);
      newRoots.push(wrap);
    }
    if (mode === 'alongside') {
      roots = [...roots, ...newRoots];
    } else {
      roots = newRoots;
      selectedId = null;
      expandedIds = {};
    }
  }
  expandedIds = getAllExpandedIds(roots);
  showTreeBookmarks = true;
  roots = [...roots];
  if (!selectedId && roots.length > 0) {
    selectedId = roots[0].id;
  }
  const s = countStats(roots);
  addToast(`Imported ${s.folders} folders, ${s.bookmarks} bookmarks`, 'success');
}

// Clears all data and creates a fresh default root folder.
function reset(): void {
  history.clear();
  syncHistoryState();
  const root = makeRoot('Bookmarks');
  roots = [root];
  expandedIds = { [root.id]: true };
  selectedId = root.id;
  showTreeBookmarks = true;
  addToast('Reset complete', 'success');
}

// Restores the previous state from the undo stack.
function undo(): void {
  const entry = history.undo(roots, selectedId);
  if (!entry) return;
  roots = entry.roots;
  selectedId = entry.selectedId;
  syncHistoryState();
  addToast('Undone', 'info');
}

// Restores the next state from the redo stack.
function redo(): void {
  const entry = history.redo(roots, selectedId);
  if (!entry) return;
  roots = entry.roots;
  selectedId = entry.selectedId;
  syncHistoryState();
  addToast('Redone', 'info');
}

// Shows a temporary toast notification.
function addToast(message: string, type: Toast['type'] = 'info'): void {
  const id = uid();
  toasts = [...toasts, { id, message, type }];
  setTimeout(() => {
    toasts = toasts.filter((t) => t.id !== id);
  }, 3000);
}

// Opens a modal dialog with the given configuration.
function openModal(config: typeof modalState): void {
  modalState = config;
}

// Closes the currently open modal.
function closeModal(): void {
  modalState = { open: false, title: '', type: 'confirm' };
}

// Updates the search query string.
function setSearchQuery(q: string): void {
  searchQuery = q;
}

// Returns the reactive store object for use by components.
export function getStore() {
  return {
    get roots() { return roots; },
    get selectedId() { return selectedId; },
    get expandedIds() { return expandedIds; },
    get showTreeBookmarks() { return showTreeBookmarks; },
    get stats() { return stats; },
    get selectedNode() { return selectedNode; },
    get breadcrumb() { return breadcrumb; },
    get toasts() { return toasts; },
    get searchQuery() { return searchQuery; },
    get searchResults() { return searchResults; },
    get iconPending() { return iconPending; },
    get modalState() { return modalState; },
    get canUndo() { return canUndo; },
    get canRedo() { return canRedo; },

    init,
    selectNode,
    toggleExpanded,
    expandAll,
    collapseAll,
    addFolder,
    addBookmark,
    bulkAdd,
    deleteNode,
    editNode,
    reorderChildren,
    reorderRoots,
    moveToParent,
    addRoot,
    importRoots,
    reset,
    undo,
    redo,
    addToast,
    openModal,
    closeModal,
    setSearchQuery,
  };
}
