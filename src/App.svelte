<!-- Root application shell with sidebar tree, editor panel, and global keyboard shortcuts. -->
<script lang="ts">
  import { getStore } from './stores/bookmarks.svelte';
  import Header from './components/layout/Header.svelte';
  import TreeView from './components/tree/TreeView.svelte';
  import TreeToolbar from './components/tree/TreeToolbar.svelte';
  import EditorPanel from './components/editor/EditorPanel.svelte';
  import Modal from './components/ui/Modal.svelte';
  import ToastContainer from './components/ui/ToastContainer.svelte';
  import { onMount } from 'svelte';

  const store = getStore();

  onMount(() => {
    store.init();

    // Dispatches global keyboard shortcuts for undo, redo, search, and escape.
    function handleKeydown(e: KeyboardEvent) {
      if (e.key === 'z' && (e.ctrlKey || e.metaKey) && e.shiftKey) {
        e.preventDefault();
        store.redo();
      } else if (e.key === 'z' && (e.ctrlKey || e.metaKey)) {
        e.preventDefault();
        store.undo();
      } else if ((e.key === 'f' && (e.ctrlKey || e.metaKey)) || (e.key === '/' && !isInputFocused())) {
        e.preventDefault();
        document.getElementById('search-input')?.focus();
      } else if (e.key === 'Escape') {
        store.closeModal();
        store.setSearchQuery('');
        (document.activeElement as HTMLElement)?.blur();
      }
    }

    // Returns true if an input or textarea is currently focused.
    function isInputFocused(): boolean {
      const el = document.activeElement;
      return el instanceof HTMLInputElement || el instanceof HTMLTextAreaElement;
    }

    window.addEventListener('keydown', handleKeydown);
    return () => window.removeEventListener('keydown', handleKeydown);
  });

  let showMobileTree = $state(true);

  let sidebarWidth = $state(320);
  let isResizing = $state(false);

  // Begins sidebar drag-resize, tracking mouse movement until release.
  function startResize(e: MouseEvent) {
    e.preventDefault();
    isResizing = true;
    const startX = e.clientX;
    const startWidth = sidebarWidth;

    // Updates sidebar width clamped between 200px and 600px.
    function onMove(ev: MouseEvent) {
      const w = startWidth + (ev.clientX - startX);
      sidebarWidth = Math.max(200, Math.min(w, 600));
    }

    // Ends the resize and removes mouse listeners.
    function onUp() {
      isResizing = false;
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
    }

    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
  }
</script>

<div class="flex h-screen flex-col bg-bg text-text" style={isResizing ? 'user-select: none; cursor: col-resize;' : ''}>
  <Header {store} />

  <div class="flex border-b border-border md:hidden">
    <button
      class="flex-1 py-2 text-center text-[11px] transition-colors
        {showMobileTree ? 'border-b border-accent text-accent' : 'text-text-tertiary hover:text-text-secondary'}"
      onclick={() => showMobileTree = true}
    >
      tree
    </button>
    <button
      class="flex-1 py-2 text-center text-[11px] transition-colors
        {!showMobileTree ? 'border-b border-accent text-accent' : 'text-text-tertiary hover:text-text-secondary'}"
      onclick={() => showMobileTree = false}
    >
      editor
    </button>
  </div>

  <div class="flex min-h-0 flex-1">
    <aside
      class="flex flex-shrink-0 flex-col {showMobileTree ? '' : 'hidden md:flex'}"
      style="width: {sidebarWidth}px;"
    >
      <div class="flex items-center justify-between border-b border-border px-3 py-1.5">
        <span class="text-[10px] text-text-tertiary uppercase tracking-wider">tree</span>
        <TreeToolbar {store} />
      </div>
      <TreeView {store} />
    </aside>

    <!-- svelte-ignore a11y_no_static_element_interactions -->
    <div
      class="hidden w-1 flex-shrink-0 cursor-col-resize md:block {isResizing ? 'bg-accent/30' : 'bg-border hover:bg-accent/20'} transition-colors"
      onmousedown={startResize}
    ></div>

    <main class="flex min-w-0 flex-1 flex-col {!showMobileTree ? '' : 'hidden md:flex'}">
      <EditorPanel {store} />
    </main>
  </div>

  <Modal {store} />
  <ToastContainer {store} />
</div>
