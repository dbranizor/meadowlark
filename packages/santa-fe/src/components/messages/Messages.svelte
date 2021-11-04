<script>
  import Message from "./Message.svelte";
  import { createEventDispatcher, onDestroy, onMount } from "svelte";
  import MessageViewModel from "./MessageViewModel.js";

  export let messages = [];
  const dispatch = createEventDispatcher();
  let applliedMessages = [];

  let displayedMessages = [];
  let isLocalized = true;
  let unsubscribes = [];

  let keys = {};
  let query = `SELECT * FROM events WHERE tombstone <> 1`;

  $: if (messages && messages.length) {
    applyMessages();
  }

  async function applyMessages() {
    console.log("dingo adding messages", messages);
    const n = messages.filter((e) => !applliedMessages.includes(e));
    try {
      await MessageViewModel.addBatch(n);
    } catch (e) {
      throw new Error(`Error: ${e}`);
    }
    applliedMessages = [...applliedMessages, ...n];
    dispatch("MESSAGES_APPLIED", applliedMessages);
  }
  onMount(async () => {
    unsubscribes.push(
      MessageViewModel.subscribe((ml) => (displayedMessages = ml))
    );
  });
  onDestroy(() => {
    unsubscribes.forEach((u) => u());
  });
  //   on:CLEAR_TOASTER={() =>
  //             (displayedEvents = displayedEvents.filter(
  //               (d) => d.id !== event.id
  //             ))}
</script>

<div class="flex justify-end h-full w-full mr-2 mt-2">
  <ul>
    {#each displayedMessages as event}
      <li>
        <Message type="info" display={true} id={event.type}>
          <span slot="header">
            {event.cat}
          </span>
          <span slot="body">{event.msg}</span>
        </Message>
      </li>
    {/each}
  </ul>
</div>

<style>
</style>
