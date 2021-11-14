<script>
import { makeClientId } from "@meadowlark-labs/central/src/central";

export let displayedEvents
import { createEventDispatcher } from "svelte";
import { v4 } from "uuid";

export let type = "info";
export let display = false;
export let id = makeClientId();
const dispatch = createEventDispatcher();

const styles = {
    warning: {
        light: "#fff9c2",
        base: "#ffed4a", 
        text: "#fff",
    },
    success: {
        light: "#a2f5bf",
        base: "#38c172",
        text: "#fff",
    },
    info: {
        light: "rgba(167, 243, 208, 1)",
        base: "rgba(52, 211, 153, 1)",
        text: "#596a73",
    },
    error: {
        light: "#f9acaa",
        base: "#e3342f",
        text: "#fff",
    },
};
</script>

<div
  class="relative flex flex-col z-50 transition-opacity duration-500 ease-in-out mr-8 {display
    ? 'opacity-100 h-full'
    : 'opacity-0 h-0'}"
  {id}
>
  <div
    class="flex max-w-sm mb-4"
    style="background: {styles[type].light} !important; color: {styles[type]
      .text} !important;"
  >
    <div
      class="w-16"
      style="background: {styles[type].base} !important; color: {styles[type]
        .text} !important;"
    >
      <div class="p-4">
        <svg
          class="h-8 w-8 text-white fill-current"
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 512 512"
          ><path
            d="M437.019 74.981C388.667 26.629 324.38 0 256 0S123.333 26.63 74.981 74.981 0 187.62 0 256s26.629 132.667 74.981 181.019C123.332 485.371 187.62 512 256 512s132.667-26.629 181.019-74.981C485.371 388.667 512 324.38 512 256s-26.629-132.668-74.981-181.019zM256 470.636C137.65 470.636 41.364 374.35 41.364 256S137.65 41.364 256 41.364 470.636 137.65 470.636 256 374.35 470.636 256 470.636z"
          />
          <path
            d="M256 235.318c-11.422 0-20.682 9.26-20.682 20.682v94.127c0 11.423 9.26 20.682 20.682 20.682 11.423 0 20.682-9.259 20.682-20.682V256c0-11.422-9.259-20.682-20.682-20.682zM270.625 147.248A20.826 20.826 0 0 0 256 141.19a20.826 20.826 0 0 0-14.625 6.058 20.824 20.824 0 0 0-6.058 14.625 20.826 20.826 0 0 0 6.058 14.625A20.83 20.83 0 0 0 256 182.556a20.826 20.826 0 0 0 14.625-6.058 20.826 20.826 0 0 0 6.058-14.625 20.839 20.839 0 0 0-6.058-14.625z"
          /></svg
        >
      </div>
    </div>
    <div class="w-auto text-grey-darker items-center p-4">
      <span class="text-lg font-bold pb-4">
        <slot name="header">Header</slot>
      </span>
      <p class="leading-tight">
        <slot name="body">Body</slot>
      </p>
    </div>
  </div>
  <div
    style="color: #596a73 !important;"
    class="absolute top-0 right-0 m-2 cursor-pointer"
    on:click={() => dispatch("CLEAR_TOASTER", id)}
  >
    <svg
      xmlns="http://www.w3.org/2000/svg"
      class="h-5 w-5"
      viewBox="0 0 20 20"
      fill="currentColor"
    >
      <path
        fill-rule="evenodd"
        d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
        clip-rule="evenodd"
      />
    </svg>
  </div>
</div>
