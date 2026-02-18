<!-- Scrollable container for the root-level tree with drag-and-drop reordering. -->
<script lang="ts">
  import TreeNode from './TreeNode.svelte';
  import { dndzone } from 'svelte-dnd-action';
  import type { Folder } from '../../lib/types';

  let { store }: { store: any } = $props();

  let dndRoots = $derived(store.roots.map((r: Folder) => ({ ...r })));

  // Handles drag-and-drop reorder of root folders.
  function handleDndRoots(e: CustomEvent<{ items: Folder[] }>) {
    store.reorderRoots(e.detail.items);
  }
</script>

<div class="min-h-0 flex-1 overflow-auto">
  {#if store.roots.length === 0}
    <div class="px-3 py-8 text-center anim-fade-in">
      <div class="mb-3 text-text-tertiary/30 text-lg">~</div>
      <div class="text-[11px] text-text-tertiary">no folders yet</div>
      <div class="mt-1 text-[10px] text-text-tertiary/60">click <span class="text-text-secondary">+new</span> to create one</div>
    </div>
  {:else}
    <ul
      class="list-none space-y-px p-1"
      use:dndzone={{ items: dndRoots, flipDurationMs: 0, type: 'root', dropTargetStyle: {} }}
      onconsider={handleDndRoots}
      onfinalize={handleDndRoots}
    >
      {#each dndRoots as root (root.id)}
        <TreeNode node={root} {store} depth={0} />
      {/each}
    </ul>
  {/if}
</div>
