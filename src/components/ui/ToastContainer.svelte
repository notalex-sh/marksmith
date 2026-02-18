<!-- Fixed-position container that displays temporary toast notifications. -->
<script lang="ts">
  let { store }: { store: any } = $props();
</script>

{#if store.toasts.length > 0}
  <div class="fixed bottom-4 right-4 z-50 flex flex-col gap-1.5">
    {#each store.toasts as toast (toast.id)}
      <div
        class="animate-slide-up border px-3 py-1.5 text-[11px] shadow-lg
          {toast.type === 'success' ? 'border-success/30 bg-surface text-success' : ''}
          {toast.type === 'error' ? 'border-danger/30 bg-surface text-danger' : ''}
          {toast.type === 'info' ? 'border-info/30 bg-surface text-info' : ''}"
      >
        {toast.message}
      </div>
    {/each}
  </div>
{/if}

<style>
  @keyframes slide-up {
    from { opacity: 0; transform: translateY(8px); }
    to { opacity: 1; transform: translateY(0); }
  }
  .animate-slide-up {
    animation: slide-up 0.15s ease-out;
  }
</style>
