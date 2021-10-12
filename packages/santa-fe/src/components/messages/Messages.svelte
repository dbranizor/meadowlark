<script>

  import Message from "./Message.svelte";
  import { onDestroy, onMount } from "svelte";
  import MessageViewModel from "./MessageViewModel.js";

  export let messages = [];

  let displayedMessages = [];
  let isLocalized = true;
  let unsubscribes = [];
  let messageViewModel = new MessageViewModel();

  let query = `SELECT * FROM events WHERE tombstone <> 1`;

  $: if (messages && messages.length) {
    console.log("dingo adding messages");
    messageViewModel.addBatch(messages);
  }
  onMount(async () => {
    unsubscribes.push(
      messageViewModel.messages.subscribe((ml) => (displayedMessages = ml))
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
