<!-- Multi-purpose modal dialog for editing, confirming, creating, and importing. -->
<script lang="ts">
  import { findNodeById } from '../../lib/tree-utils';
  import { fade, scale } from 'svelte/transition';

  let { store }: { store: any } = $props();
  let modal = $derived(store.modalState);

  let editTitle = $state('');
  let editUrl = $state('');
  let newRootName = $state('');
  let newRootToolbar = $state(false);

  // Populates form fields when the modal opens based on its type.
  $effect(() => {
    if (modal.open) {
      if (modal.type === 'editFolder' || modal.type === 'editBookmark') {
        const node = modal.nodeId ? findNodeById(store.roots, modal.nodeId) : null;
        if (node) {
          editTitle = node.title;
          editUrl = node.type === 'bookmark' ? node.href : '';
        }
      } else if (modal.type === 'newRoot') {
        newRootName = 'Bookmarks bar';
        newRootToolbar = false;
      }
    }
  });

  // Saves the modal form data based on the current modal type.
  function handleSave() {
    if (modal.type === 'editFolder' && modal.nodeId) {
      if (editTitle.trim()) store.editNode(modal.nodeId, { title: editTitle.trim() });
      store.closeModal();
    } else if (modal.type === 'editBookmark' && modal.nodeId) {
      const updates: { title?: string; href?: string } = {};
      if (editTitle.trim()) updates.title = editTitle.trim();
      if (editUrl.trim()) updates.href = editUrl.trim();
      store.editNode(modal.nodeId, updates);
      store.closeModal();
    } else if (modal.type === 'newRoot') {
      if (newRootName.trim()) store.addRoot(newRootName.trim(), newRootToolbar);
      store.closeModal();
    } else if (modal.type === 'confirm' && modal.onConfirm) {
      modal.onConfirm();
    }
  }

  // Closes on escape, saves on enter for non-confirm modals.
  function handleKeydown(e: KeyboardEvent) {
    if (e.key === 'Escape') store.closeModal();
    if (e.key === 'Enter' && modal.type !== 'confirm') handleSave();
  }

  // Closes the modal when clicking the backdrop.
  function handleBackdropClick(e: MouseEvent) {
    if (e.target === e.currentTarget) store.closeModal();
  }

  const inputClass = "w-full border-b border-border bg-transparent py-1.5 text-[12px] text-text outline-none transition-colors focus:border-accent";
  const labelClass = "mb-1 block text-[10px] uppercase tracking-wider text-text-tertiary";
  const btnSecondary = "px-3 py-1.5 text-[11px] text-text-tertiary transition-colors hover:text-text";
  const btnPrimary = "px-3 py-1.5 text-[11px] text-accent transition-colors hover:text-accent-hover";
  const btnDanger = "px-3 py-1.5 text-[11px] text-danger transition-colors hover:text-danger";
</script>

{#if modal.open}
  <!-- svelte-ignore a11y_no_static_element_interactions -->
  <div
    class="fixed inset-0 z-50 flex items-center justify-center bg-black/60"
    onclick={handleBackdropClick}
    onkeydown={handleKeydown}
    transition:fade={{ duration: 120 }}
  >
    <div class="w-[90%] max-w-sm border border-border bg-surface p-5 shadow-2xl anim-scale-in" role="dialog" aria-modal="true" transition:scale={{ duration: 120, start: 0.97 }}>
      <h3 class="mb-4 text-[12px] font-bold text-text">{modal.title}</h3>

      {#if modal.type === 'confirm'}
        <p class="mb-5 text-[11px] leading-relaxed text-text-secondary">{modal.message}</p>
        <div class="flex justify-end gap-1">
          <button class={btnSecondary} onclick={() => store.closeModal()}>cancel</button>
          <button class={btnDanger} onclick={handleSave}>confirm</button>
        </div>

      {:else if modal.type === 'editFolder'}
        <label for="edit-folder-name" class={labelClass}>folder name</label>
        <!-- svelte-ignore a11y_autofocus -->
        <input id="edit-folder-name" type="text" bind:value={editTitle} onkeydown={handleKeydown} class="{inputClass} mb-4" autofocus />
        <div class="flex justify-end gap-1">
          <button class={btnSecondary} onclick={() => store.closeModal()}>cancel</button>
          <button class={btnPrimary} onclick={handleSave}>save</button>
        </div>

      {:else if modal.type === 'editBookmark'}
        <label for="edit-bm-title" class={labelClass}>title</label>
        <!-- svelte-ignore a11y_autofocus -->
        <input id="edit-bm-title" type="text" bind:value={editTitle} onkeydown={handleKeydown} class="{inputClass} mb-3" autofocus />
        <label for="edit-bm-url" class={labelClass}>url</label>
        <input id="edit-bm-url" type="text" bind:value={editUrl} onkeydown={handleKeydown} class="{inputClass} mb-4" />
        <div class="flex justify-end gap-1">
          <button class={btnSecondary} onclick={() => store.closeModal()}>cancel</button>
          <button class={btnPrimary} onclick={handleSave}>save</button>
        </div>

      {:else if modal.type === 'importChoice'}
        <p class="mb-4 text-[11px] leading-relaxed text-text-secondary">How should the imported bookmarks be added?</p>
        <div class="space-y-2 mb-4">
          <button
            class="w-full border border-border px-3 py-2.5 text-left transition-all hover:border-accent/50 hover:bg-accent/5"
            onclick={() => { store.importRoots(modal.importedData, 'replace'); store.closeModal(); }}
          >
            <div class="text-[11px] text-text">Replace all</div>
            <div class="text-[10px] text-text-tertiary">Remove existing bookmarks and use imported ones</div>
          </button>
          <button
            class="w-full border border-border px-3 py-2.5 text-left transition-all hover:border-accent/50 hover:bg-accent/5"
            onclick={() => { store.importRoots(modal.importedData, 'alongside'); store.closeModal(); }}
          >
            <div class="text-[11px] text-text">Add alongside</div>
            <div class="text-[10px] text-text-tertiary">Keep existing bookmarks and add imported folders next to them</div>
          </button>
          {#if store.selectedId}
            <button
              class="w-full border border-border px-3 py-2.5 text-left transition-all hover:border-accent/50 hover:bg-accent/5"
              onclick={() => { store.importRoots(modal.importedData, 'merge'); store.closeModal(); }}
            >
              <div class="text-[11px] text-text">Merge into "{store.selectedNode?.title}"</div>
              <div class="text-[10px] text-text-tertiary">Add imported items into the currently selected folder</div>
            </button>
          {/if}
        </div>
        <div class="flex justify-end">
          <button class={btnSecondary} onclick={() => store.closeModal()}>cancel</button>
        </div>

      {:else if modal.type === 'newRoot'}
        <label for="new-root-name" class={labelClass}>folder name</label>
        <!-- svelte-ignore a11y_autofocus -->
        <input id="new-root-name" type="text" bind:value={newRootName} onkeydown={handleKeydown} class="{inputClass} mb-3" autofocus />
        <label class="mb-4 flex cursor-pointer items-center gap-1.5 text-[11px] text-text-tertiary">
          <input type="checkbox" bind:checked={newRootToolbar} class="h-3 w-3 accent-accent" />
          personal toolbar folder
        </label>
        <div class="flex justify-end gap-1">
          <button class={btnSecondary} onclick={() => store.closeModal()}>cancel</button>
          <button class={btnPrimary} onclick={handleSave}>create</button>
        </div>
      {/if}
    </div>
  </div>
{/if}
