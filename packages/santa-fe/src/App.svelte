<svelte:options accessors={true} />

<script>
  import { onMount } from "svelte";
  import { sync } from "@meadowlark-labs/central";
  import Navbar from "./Navbar.svelte";
  import Messages from "./components/messages/Messages.svelte";
  import { santaFe } from "./bootup.js";
  import Modal from "./components/shared/Modal.svelte";
import ExampleTables from "../../wagon-wheel/src/ExampleTables.svelte";

  //start();
  const schema = {
    events: {
      id: "TEXT",
      cat: "TEXT",
      msg: "TEXT",
      coi: "TEXT",
    },
    coi: {
      id: "TEXT",
      name: "text",
      details: "text",
    },
    user_coi: {
      id: "TEXT",
      coi: "TEXT",
      user: "text",
    },
  };
  let events = [];
  let displayedEvents = [];
  let newType = "";
  let newMessage = "";
  let worker;
  let showEncModal = false;
  let interval;
  let encryptionModalName = "EncryptionModal";

  const unsubscribes = [];

  let testUsers = [
    { id: "John", display: "John" },
    { id: "George", display: "George" },
    { id: "Paul", display: "Paul" },
    { id: "Ringo", display: "Rifngo" },
  ];

  let selectedUser = testUsers[1].display;
  let centralConfig = {
    user_id: selectedUser,
    sync_disabled: false,
    sync_url: "https://localhost/central-park",
    group_id: "meadowlark",
    debug: true,
    localized: ["Message"],
    isOffline: true,
  };

  // setEnvironment(centralConfig);

  export let name;

  $: if (newMessage) {
    if (newType) {
    }
  }
  const handleNewMessage = async (e) => {
    if (e.code === "Enter") {
      if (newMessage) {
        const event = { cat: newType, msg: newMessage };
        displayedEvents = [...displayedEvents, event];
      } else {
        sync();
      }
    }
  };

  function handleEnableSync(event) {
    console.log("Got Call to Enable Sync", event);
  }

  onMount(async () => {
    /**Test dingo code*/
    displayedEvents = [...events];
    // santaFe(centralConfig);

    // Sync.init({syncHost: "https://192.168.1.11/central-park", logging: "debug"})
    // Sync.addSchema({
    // 	event: [],
    // 	coe: []
    // })
    // Sync.addGroup("home")
    // Sync.selectGroup("home")
    // Sync.start()
  });
</script>

<svelte:window on:keydown={handleNewMessage} />
<main>
  <div class="Dark">
    <Navbar class="bg-gray-500 text-gray-200">
      <span slot="name"> Santa-Fe </span>
      <div slot="links" class="flex">
        <button
          class="bg-transparent border-gray-500 border-2 hover:bg-blue-100"
          on:click={() => (showEncModal = !showEncModal)}
        >
          Encrypt
        </button>
        <button
          on:click={handleEnableSync}
          class="h-5 {centralConfig.syncDisabled
            ? 'bg-red-500 hover:bg-red-800 text-gray-100 hover:text-gray-200 '
            : ' bg-background-ternary hover:bg-gray-600 text-gray-100 hover:text-gray-200 '}px-2 py-2 flex items-center font-bold"
        >
          <!-- {centralConfig.syncDisabled ? "Start " : " Stop"} Sync -->
          Sync
        </button>
        <span
          class="h-5 {centralConfig.isOffline
            ? 'bg-red-500 hover:bg-red-800 text-gray-100 hover:text-gray-200 '
            : ' bg-background-ternary hover:bg-gray-600 text-gray-100 hover:text-gray-200 '}px-2 py-2 flex items-center font-bold"
        >
          {centralConfig.isOffline ? "Offline" : "Online"}
        </span>
      </div>
    </Navbar>
    <div class="flex">
      <select
        bind:value={selectedUser}
        on:change={() => santaFe(centralConfig, false)}
      >
        {#each testUsers as user}
          <option value={user}>{user.display}</option>
        {/each}
      </select>
      <h1 class="text-blue-500 leading-tight">Santa-Fe</h1>
      <div class="ml-auto">
        <input
          class="border-b border-blue-500"
          bind:value={newType}
          placeholder="Type"
        />
        <input
          class="border-b border-blue-500"
          bind:value={newMessage}
          placeholder="Message"
        />
      </div>
    </div>
    <Messages
      on:MESSAGES_APPLIED={() => (newMessage = "")}
      messages={displayedEvents}
    />
    <h5>dingo Example Table</h5>
 `   <ExampleTables />`
  </div>
  <Modal bind:val={showEncModal}>
    <span slot="body">
      Invite Team-Members to an Encrypted Application Channel. 
    </span>
    <span slot="actions" class="flex items-center justify-end p-6 border-t border-solid border-blueGray-200 rounded-b">
      <button
        class="text-tprimary background-transparent font-bold uppercase px-6 py-2 text-sm outline-none focus:outline-none mr-1 mb-1 ease-linear transition-all duration-150"
        type="button"
        on:click={() => showEncModal = false}
      >
        Close
      </button>
      <button
        class="bg-background-primary text-tprimary active:bg-emerald-600 font-bold uppercase text-sm px-6 py-3 rounded shadow hover:shadow-lg outline-none focus:outline-none mr-1 mb-1 ease-linear transition-all duration-150"
        type="button"
        on:click={() => showEncModal = false}
      >
        Start Encrypted Channel
      </button>
    </span>
  </Modal>
</main>

<style>
  main {
    text-align: center;
    padding: 1em;
    max-width: 240px;
    margin: 0 auto;
  }

  h1 {
    color: #ff3e00;
    text-transform: uppercase;
    font-size: 4em;
    font-weight: 100;
  }

  @media (min-width: 640px) {
    main {
      max-width: none;
    }
  }
</style>
