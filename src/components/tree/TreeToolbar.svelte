<!-- Toolbar buttons for creating root folders, importing, and exporting bookmarks. -->
<script lang="ts">
  import { parseNetscapeHTML } from '../../lib/import-bookmarks';
  import { exportNetscapeHTML } from '../../lib/export-bookmarks';

  let { store }: { store: any } = $props();

  let fileInput: HTMLInputElement;

  // Opens the file picker for importing a bookmark HTML file.
  function handleImport() {
    fileInput.click();
  }

  // Parses the selected file and opens the import choice modal.
  async function onFileSelected(e: Event) {
    const input = e.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;

    const text = await file.text();

    if (!text.includes('<!DOCTYPE NETSCAPE-Bookmark-file-1>') && text.includes('<title>Marksmith</title>')) {
      store.addToast('This appears to be the app file, not exported bookmarks', 'error');
      input.value = '';
      return;
    }

    const imported = parseNetscapeHTML(text);
    if (!imported || !imported.length) {
      store.addToast('No bookmarks found in file', 'error');
      input.value = '';
      return;
    }

    store.openModal({
      open: true,
      title: 'Import Bookmarks',
      type: 'importChoice',
      importedData: imported,
    });

    input.value = '';
  }

  // Generates and downloads a Netscape bookmark HTML file.
  function handleExport() {
    const html = exportNetscapeHTML(store.roots);
    const ts = new Date();
    const pad = (n: number) => String(n).padStart(2, '0');
    const fname = `bookmarks_${ts.getFullYear()}-${pad(ts.getMonth() + 1)}-${pad(ts.getDate())}_${pad(ts.getHours())}-${pad(ts.getMinutes())}.html`;
    const blob = new Blob([html], { type: 'text/html' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = fname;
    document.body.appendChild(a);
    a.click();
    setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 100);
    store.addToast('Exported bookmarks file', 'success');
  }

  // Opens the new root folder modal.
  function handleNewRoot() {
    store.openModal({
      open: true,
      title: 'New Root Folder',
      type: 'newRoot',
    });
  }
</script>

<div class="flex items-center gap-px">
  <button
    class="inline-flex items-center gap-0.5 px-2 py-1 text-[10px] text-text-tertiary transition-colors hover:text-text"
    onclick={handleNewRoot}
    title="Create new root folder"
  >
    <svg class="h-2.5 w-2.5" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
      <path stroke-linecap="round" stroke-linejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
    </svg>
    new
  </button>
  <button
    class="inline-flex items-center gap-0.5 px-2 py-1 text-[10px] text-text-tertiary transition-colors hover:text-text"
    onclick={handleImport}
    title="Import bookmarks from HTML file"
  >
    <svg class="h-2.5 w-2.5" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
      <path stroke-linecap="round" stroke-linejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
    </svg>
    import
  </button>
  <input
    bind:this={fileInput}
    type="file"
    accept="text/html,.html,.htm"
    class="hidden"
    onchange={onFileSelected}
  />
  <button
    class="inline-flex items-center gap-0.5 px-2 py-1 text-[10px] text-accent transition-colors hover:text-accent-hover"
    onclick={handleExport}
    title="Export bookmarks as HTML file"
  >
    <svg class="h-2.5 w-2.5" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
      <path stroke-linecap="round" stroke-linejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M7.5 7.5l4.5-4.5m0 0l4.5 4.5M12 3v13.5" />
    </svg>
    export
  </button>
</div>
