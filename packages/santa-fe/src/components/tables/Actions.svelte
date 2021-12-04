<script>
  import { MessageBus } from "@meadowlark-labs/central";

  import { createEventDispatcher } from "svelte";
import TableViewModel from "./TableViewModel";

  export let row;
  export let col;

  export let _delete;
  const dispatch = createEventDispatcher();
</script>

<button
  on:click={() => TableViewModel.delete(row.id)}
  class="p-2 bg-transparent text-gray-800 border-2 border-red-500 hover:text-gray-700"
  >X</button
>

<style>
</style>
