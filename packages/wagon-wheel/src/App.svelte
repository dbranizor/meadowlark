<script>
  import TableExamples from "./TableExamples.svelte";
  import { onMount } from "svelte";

  let selectedCOnstraint;
  let testUser = "John";
  let selection = "default";
  onMount(() => console.log("dingo tables pure es6"));
</script>

<div class="h-screen flex bg-gray-200">
  <div class="flex-1 flex flex-col w-full h-full">
    <header class="flex justify-between p-2 bg-gray-800 text-white">
      <div class="text-center">
        <h6 class="text-xl font-thin tracking-widest">Santa-Fe</h6>
      </div>
      <div class="flex">
        <div class="p-1">Profile</div>
        <div class="p-1">Settings</div>
      </div>
    </header>
    <div class="flex h-full">
      <nav class="w-72 border-r border-gray-800 text-gray-800 h-full">
        <h6 class="mt-8 mb-4">Components</h6>
        <ul class="cursor-pointer">
          <li>
            <div
              class="flex justify-center items-center w-full h-full"
              on:click={() => (selection = "table")}
            >
              Table
              <TableExamples />
            </div>
          </li>
          <li>
            <div
              class="flex justify-center items-center"
              on:click={() => (selection = "messages")}
            >
              Messages
            </div>
          </li>
        </ul>
      </nav>
      <main class="h-full w-full flex">
        {#if selection === "default"}
          <h2>Default</h2>
        {:else if selection === "table"}
          <h2>Table</h2>
        {:else}
          <h2>Error: No Selection</h2>
        {/if}
      </main>
    </div>
  </div>
</div>

<style>
</style>
