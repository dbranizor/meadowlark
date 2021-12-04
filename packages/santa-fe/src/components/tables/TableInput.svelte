<script>
  import { debounce } from "@meadowlark-labs/central/src/central";

  import { createEventDispatcher, onDestroy, onMount } from "svelte";
  import TableStore from "./TableStore";

  export let val;
  export let row;
  export let ID;
  const dispatch = createEventDispatcher();
  let selectedID;

  const unsubscribes = [];
  unsubscribes.push(
    TableStore.selected$.subscribe(
      (s) => (selectedID = JSON.parse(JSON.stringify(s)))
    )
  );

  const keyPressFunc = debounce(() => dispatch('CELL_UPDATE', val), 900);

  $: isSelected = selectedID[ID] !== undefined;

  onDestroy(() => unsubscribes.forEach((u) => u()));
</script>

{#if isSelected}
  <input
    bind:value={val}
    on:keypress={() => keyPressFunc()}
    class="border border-red-500 focus:outline-none focus:ring-2 focus:ring-2 focus:ring-red-500"
  />
{:else}
  <span on:click={() => TableStore.setSelected(ID, null)}>
    {@html val}
  </span>
{/if}

<style>
</style>
