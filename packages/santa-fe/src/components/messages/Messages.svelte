<script>
  import { select, DatastoreState } from "@meadowlark-labs/central";
  import Message from "./Message.svelte";
  import { MessageCatalog } from "../../bootup.js";
  import { onDestroy, onMount } from "svelte";
  import MessageState from "./message-state";

  export let standardMessages = [];

  let localizedMessages = [];
  let isLocalized = true;
  let unsubscribes = [];

  let syncReady = false;
  let query = `SELECT * FROM events WHERE tombstone <> 1`;
  let syncedRecords = [];
  $: displayedMessages = isLocalized ? localizedMessages : standardMessages;

  onMount(async () => {
    if (MessageCatalog.hasOwnProperty("Message")) {
      unsubscribes.push(
        MessageState.messages.subscribe(async (m) => {
          localizedMessages = m;
        }),
        /**TODO: Move this into message-state.*/
        MessageState.ready.subscribe(async (ms) => {
          console.log("dingo message state has event update", ms);
          if (ms) {
            isLocalized = true;
            console.log("dingo got records pre", localizedMessages);
            localizedMessages = await select(query);
            console.log("dingo got records post", localizedMessages);
            /**Subscribe to sync records*/
          } else {
            console.log("dingo ms not inited yet", ms);
          }
        }),
        DatastoreState.subscribe(async (schema) => {
          console.log("dingo currRecords added to store subscribe?", schema);
          if (schema["events"]) {
            localizedMessages = await select(query);
            console.log("dingo got subscribe for events?", schema["events"], localizedMessages);
          }
        })
      );
    } else {
      console.log("dingo Messages Are Not Localized");
    }
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
