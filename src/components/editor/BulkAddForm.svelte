<!-- Textarea form for adding multiple bookmarks at once, one URL per line. -->
<script lang="ts">
  let { store }: { store: any } = $props();
  let text = $state('');
  let fetchIcons = $state(true);
  let resultMsg = $state('');

  // Parses the textarea content and adds all valid URLs as bookmarks.
  function handleBulkAdd() {
    if (!text.trim()) return;
    if (!store.selectedId) return;
    const { added, skipped } = store.bulkAdd(store.selectedId, text.trim(), fetchIcons);
    resultMsg = `added ${added}${skipped > 0 ? `, skipped ${skipped}` : ''}`;
    text = '';
    setTimeout(() => resultMsg = '', 4000);
  }
</script>

<div class="space-y-3">
  <p class="text-[11px] text-text-tertiary">
    one url per line: <code class="text-text-secondary">url, optional title</code>
  </p>
  <textarea
    bind:value={text}
    placeholder={"https://example.com\nhttps://test.com, Test Site"}
    rows="4"
    class="w-full resize-y border border-border bg-transparent px-3 py-2 text-[12px] text-text outline-none transition-colors placeholder:text-text-tertiary/30 focus:border-accent"
  ></textarea>

  <div class="flex items-center gap-3">
    <label class="inline-flex cursor-pointer items-center gap-1.5 text-[11px] text-text-tertiary">
      <input
        type="checkbox"
        bind:checked={fetchIcons}
        class="h-3 w-3 accent-accent"
      />
      fetch favicons
    </label>
    <button
      class="text-[11px] text-accent transition-colors hover:text-accent-hover"
      onclick={handleBulkAdd}
    >
      add all
    </button>
    {#if resultMsg}
      <span class="text-[11px] text-success">{resultMsg}</span>
    {/if}
  </div>
</div>
