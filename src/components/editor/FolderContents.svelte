<!-- Drag-and-drop sortable list of a folder's children with edit/delete actions. -->
<script lang="ts">
  import type { TreeNode, Folder, Bookmark } from '../../lib/types';
  import { dndzone } from 'svelte-dnd-action';

  let { store }: { store: any } = $props();

  let folder = $derived(store.selectedNode as Folder | null);
  let dndItems = $derived(folder ? folder.children.map((c: TreeNode) => ({ ...c })) : []);
  let hasParent = $derived(store.breadcrumb.length > 1);

  // Handles drag-and-drop reorder events for folder children.
  function handleDnd(e: CustomEvent<{ items: TreeNode[] }>) {
    if (store.selectedId) {
      store.reorderChildren(store.selectedId, e.detail.items);
    }
  }

  // Opens a confirmation modal to delete a node.
  function handleDelete(item: TreeNode) {
    const label = item.type === 'folder' ? `Delete folder "${item.title}" and everything inside?` : `Remove bookmark "${item.title}"?`;
    store.openModal({
      open: true,
      title: item.type === 'folder' ? 'Delete Folder' : 'Remove Bookmark',
      type: 'confirm',
      message: label,
      onConfirm: () => {
        store.deleteNode(item.id);
        store.closeModal();
      },
    });
  }

  // Opens the appropriate edit modal for a folder or bookmark.
  function handleEdit(item: TreeNode) {
    const isFolder = item.type === 'folder';
    store.openModal({
      open: true,
      title: isFolder ? 'Edit Folder' : 'Edit Bookmark',
      type: isFolder ? 'editFolder' : 'editBookmark',
      nodeId: item.id,
    });
  }

  // Navigates into a subfolder when clicked.
  function handleNavigate(item: TreeNode) {
    if (item.type === 'folder') {
      store.selectNode(item.id);
    }
  }
</script>

{#if !folder || folder.children.length === 0}
  <p class="py-4 text-center text-[11px] text-text-tertiary anim-fade-in">
    {#if !folder}
      no folder selected
    {:else}
      empty -- add bookmarks above
    {/if}
  </p>
{:else}
  <div
    class="border border-border"
    use:dndzone={{ items: dndItems, flipDurationMs: 0, type: 'folder-contents', dropTargetStyle: {} }}
    onconsider={handleDnd}
    onfinalize={handleDnd}
  >
    {#each dndItems as item, idx (item.id)}
      <div class="group flex items-center gap-2 px-3 py-1.5 transition-colors hover:bg-surface-2 {idx < dndItems.length - 1 ? 'border-b border-border' : ''}">
        <span class="cursor-grab text-text-tertiary/20 transition-colors group-hover:text-text-tertiary/50" title="Drag to reorder">
          <svg class="h-3 w-3" fill="currentColor" viewBox="0 0 20 20">
            <path d="M7 2a2 2 0 10.001 4.001A2 2 0 007 2zm0 6a2 2 0 10.001 4.001A2 2 0 007 8zm0 6a2 2 0 10.001 4.001A2 2 0 007 14zm6-8a2 2 0 10-.001-4.001A2 2 0 0013 6zm0 2a2 2 0 10.001 4.001A2 2 0 0013 8zm0 6a2 2 0 10.001 4.001A2 2 0 0013 14z" />
          </svg>
        </span>

        <span class="flex w-4 flex-shrink-0 items-center justify-center {item.type === 'folder' ? 'text-accent' : 'text-text-tertiary'}">
          {#if item.type === 'folder'}
            <svg class="h-3.5 w-3.5" fill="none" stroke="currentColor" stroke-width="1.5" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" d="M2.25 12.75V12A2.25 2.25 0 014.5 9.75h15A2.25 2.25 0 0121.75 12v.75m-8.69-6.44l-2.12-2.12a1.5 1.5 0 00-1.061-.44H4.5A2.25 2.25 0 002.25 6v12a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9a2.25 2.25 0 00-2.25-2.25h-5.379a1.5 1.5 0 01-1.06-.44z" />
            </svg>
          {:else if (item as Bookmark).iconData}
            <img src={(item as Bookmark).iconData} alt="" class="h-3.5 w-3.5 rounded-sm" />
          {:else}
            <svg class="h-3.5 w-3.5" fill="none" stroke="currentColor" stroke-width="1.5" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" d="M13.19 8.688a4.5 4.5 0 011.242 7.244l-4.5 4.5a4.5 4.5 0 01-6.364-6.364l1.757-1.757m9.07-9.07a4.5 4.5 0 00-6.364 0l-4.5 4.5a4.5 4.5 0 006.364 6.364l1.757-1.757" />
            </svg>
          {/if}
        </span>

        <div
          class="min-w-0 flex-1 {item.type === 'folder' ? 'cursor-pointer' : ''}"
          role={item.type === 'folder' ? 'button' : undefined}
          tabindex={item.type === 'folder' ? 0 : undefined}
          onclick={() => handleNavigate(item)}
          onkeydown={(e) => e.key === 'Enter' && handleNavigate(item)}
        >
          <div class="truncate text-[12px] text-text">{item.title || (item.type === 'bookmark' ? (item as Bookmark).href : '')}</div>
          {#if item.type === 'bookmark'}
            <div class="truncate text-[10px] text-text-tertiary">{(item as Bookmark).href}</div>
          {:else}
            <div class="text-[10px] text-text-tertiary">
              {(item as Folder).children.filter((c: TreeNode) => c.type === 'bookmark').length} links, {(item as Folder).children.filter((c: TreeNode) => c.type === 'folder').length} dirs
            </div>
          {/if}
        </div>

        <div class="flex items-center gap-0.5 opacity-0 transition-opacity group-hover:opacity-100">
          {#if hasParent}
            <button
              class="rounded p-1 text-text-tertiary transition-colors hover:bg-surface-3 hover:text-text"
              onclick={() => store.moveToParent(item.id)}
              title="Move to parent folder"
            >
              <svg class="h-3 w-3" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" d="M9 9l6-6m0 0l6 6m-6-6v12a6 6 0 01-12 0v-3" />
              </svg>
            </button>
          {/if}
          <button
            class="rounded p-1 text-text-tertiary transition-colors hover:bg-surface-3 hover:text-text"
            onclick={() => handleEdit(item)}
            title="Edit"
          >
            <svg class="h-3 w-3" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931z" />
            </svg>
          </button>
          <button
            class="rounded p-1 text-text-tertiary transition-colors hover:bg-surface-3 hover:text-danger"
            onclick={() => handleDelete(item)}
            title="Delete"
          >
            <svg class="h-3 w-3" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
            </svg>
          </button>
        </div>
      </div>
    {/each}
  </div>

  <p class="mt-2 text-[10px] text-text-tertiary tabular-nums">
    {folder.children.length} item{folder.children.length !== 1 ? 's' : ''}
  </p>
{/if}
