<script lang="ts">
  import { onMount } from 'svelte';
  import { fade, fly } from 'svelte/transition';
  let mounted = false;
  onMount(() => { mounted = true; });
</script>

<svelte:head>
  <title>hivemind</title>
  <meta name="og:title" content="hivemind" />
  <meta name="description" content="thanks for boosting my mood <3" />
  <meta name="og:description" content="thanks for boosting my mood <3" />
  <meta name="theme-color" media="(prefers-color-scheme: light)" content="#f9f0f5" />
  <meta name="theme-color" media="(prefers-color-scheme: dark)" content="#281c21" />
</svelte:head>

{#if mounted}
<section 
  class="p-8 sm:p-12 lg:p-24 lg:py-16 font-cascadia"
  in:fade={{ duration: 200 }}
>
  <div class="flex flex-col items-center gap-8">
    <div>
      <h1 
        class="text-ocean-900 dark:text-ocean-100 text-2xl mb-2 text-center"
        in:fly={{ y: -20, duration: 300 }}
      >hivemind</h1>
      <p 
        class="text-ocean-700 dark:text-ocean-400 mb-10 text-center"
        in:fly={{ y: -20, duration: 300, delay: 50 }}
      >thanks for boosting my mood &lt;3</p>
    </div>
    <div class="flex flex-row gap-8 justify-center" in:fly={{ y: 20, duration: 300, delay: 100 }}>
      <!-- Add your images below -->
      <img src="/static/hivemind1.png" alt="Image 1" class="max-w-xs rounded shadow" />
      <img src="/static/hivemind2.png" alt="Image 2" class="max-w-xs rounded shadow" />
    </div>
  </div>
</section>
{/if}
