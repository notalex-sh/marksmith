// Undo/redo history manager using deep-cloned snapshots.

import type { HistoryEntry, Folder } from './types';
import { deepClone } from './tree-utils';

const MAX_HISTORY = 50;

export class HistoryManager {
  private undoStack: HistoryEntry[] = [];
  private redoStack: HistoryEntry[] = [];

  // Saves current state to the undo stack and clears redo.
  push(roots: Folder[], selectedId: string | null): void {
    this.undoStack.push(deepClone({ roots, selectedId }));
    if (this.undoStack.length > MAX_HISTORY) {
      this.undoStack.shift();
    }
    this.redoStack = [];
  }

  // Pops last state from undo stack, pushes current to redo, returns restored state.
  undo(currentRoots: Folder[], currentSelectedId: string | null): HistoryEntry | null {
    const entry = this.undoStack.pop();
    if (!entry) return null;
    this.redoStack.push(deepClone({ roots: currentRoots, selectedId: currentSelectedId }));
    return deepClone(entry);
  }

  // Pops last state from redo stack, pushes current to undo, returns restored state.
  redo(currentRoots: Folder[], currentSelectedId: string | null): HistoryEntry | null {
    const entry = this.redoStack.pop();
    if (!entry) return null;
    this.undoStack.push(deepClone({ roots: currentRoots, selectedId: currentSelectedId }));
    return deepClone(entry);
  }

  // Returns whether there are entries available to undo.
  get canUndo(): boolean {
    return this.undoStack.length > 0;
  }

  // Returns whether there are entries available to redo.
  get canRedo(): boolean {
    return this.redoStack.length > 0;
  }

  // Clears both undo and redo stacks.
  clear(): void {
    this.undoStack = [];
    this.redoStack = [];
  }
}
