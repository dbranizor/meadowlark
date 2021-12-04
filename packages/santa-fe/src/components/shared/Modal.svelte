<script>
  import { createEventDispatcher, onDestroy, onMount } from "svelte";
  import Scrim from "./Scrim.svelte"

  
  export let val;
  const unsubscribes = [];


  let showModal = false;


  onDestroy(() => {
    unsubscribes.forEach((f) => f());
  });

</script>

{#if val}
    <Scrim />
  <div
    class="overflow-x-hidden overflow-y-auto fixed inset-0 z-50 outline-none focus:outline-none justify-center items-center flex"
  >
    <div class="relative w-auto my-6 mx-auto  max-w-sm">
      <!--content-->
      <div
        class="bg-gray-200 border-0 rounded-lg shadow-lg relative flex flex-col w-full bg-background-secondary outline-none focus:outline-none"
      >
        <!--header-->
        <div
          class="flex items-start justify-between p-5 border-b border-solid border-blueGray-200 rounded-t"
        >
          <h3 class="text-3xl text-tprimary font-semibold">
            <slot name="header" />
          </h3>
          <button
            class="p-1 ml-auto bg-transparent border-0 text-tprimary opacity-5 float-right text-3xl leading-none font-semibold outline-none focus:outline-none"
            on:click={() => val = false}
          >
            <span
              class="bg-transparent text-tprimary opacity-5 h-6 w-6 text-2xl block outline-none focus:outline-none"
            >
              ×
            </span>
          </button>
        </div>
        <!--body-->
        <div class="relative p-6 flex-auto">
          <p class="my-4 text-tprimary text-lg leading-relaxed">
            <slot name="body" />
          </p>
        </div>
        <!--footer-->
        <div
          class="flex items-center justify-end p-6 border-t border-solid border-blueGray-200 rounded-b"
        >
            <slot name="actions"></slot>
        </div>
      </div>
    </div>
  </div>
  <div class="opacity-25 fixed inset-0 z-40 bg-black" />
{/if}
