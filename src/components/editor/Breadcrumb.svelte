<!-- Displays the folder path breadcrumb with clickable segments for navigation. -->
<script lang="ts">
  let { store }: { store: any } = $props();

  // Navigates to the folder at the clicked breadcrumb segment.
  function handleClick(id: string) {
    store.selectNode(id);
  }
</script>

<nav class="flex flex-wrap items-center gap-0.5 text-[12px]">
  {#each store.breadcrumb as segment, i}
    {#if i > 0}
      <span class="text-text-tertiary/50">/</span>
    {/if}
    {#if i === store.breadcrumb.length - 1}
      <span class="text-text">{segment.title}</span>
    {:else}
      <button
        class="text-text-tertiary transition-colors hover:text-text"
        onclick={() => handleClick(segment.id)}
      >{segment.title}</button>
    {/if}
  {/each}
</nav>
