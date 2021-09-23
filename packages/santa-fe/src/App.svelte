<svelte:options accessors={true} />

<script>
  import Toasters from "./Toasters.svelte";
  import { onMount } from "svelte";

  import {
    insert,
    start,
    setEnvironment,
    startSync,
    getWorker,
    stopSync,
    sync,
  } from "@meadowlark-labs/central";
  import Navbar from "./Navbar.svelte";
  import EnvironmentState from "@meadowlark-labs/central/src/environment-state";
  import { bootstrap } from "@meadowlark-labs/central/src/datastores";

  start();
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
  let events = [
    {
      cat: "test",
      msg: "This is just a test",
    },
    {
      cat: "email",
      msg: "Check your emails",
    },
  ];
  let displayedEvents = [];
  let newType = "";
  let newMessage = "";
  let worker;
  let interval;

  const unsubscribes = [];

  let testUsers = [
    { id: "John", display: "John" },
    { id: "George", display: "George" },
    { id: "Paul", display: "Paul" },
    { id: "Ringo", display: "Ringo" },
  ];

  let selectedUser = testUsers[1].display;
  let centralConfig = {
    user_id: selectedUser,
    syncDisabled: false,
    syncUrl: "https://localhost/central-park",
    group_id: "meadowlark",
    debug: true,
    isOffline: true,
  };
  EnvironmentState.subscribe((e) => {
    console.log("dingo got environment sub update", e);
    centralConfig = Object.assign(centralConfig, e);
  });
  setEnvironment(centralConfig);

  export let name;

  $: if (newMessage) {
    if (newType) {
    }
  }
  const handleNewMessage = (e) => {
    if (e.code === "Enter") {
      console.log("dingo adding new message");
      const event = { cat: newType, msg: newMessage };
      insert("events", event);
      displayedEvents = [...displayedEvents, { cat: newType, msg: newMessage }];
    }
  };

  function handleEnableSync(event) {
    console.log("Got Call to Enable Sync", event);
    sync();
    // const isOffline = !centralConfig.isOffline;
    // const syncDisabled = !centralConfig.syncDisabled;
    // console.log(
    //   "DINGO RUNNIJNG INTERVAL FUNCTION",
    //   syncDisabled,
    //   centralConfig.syncDisabled,
    //   isOffline,
    //   centralConfig.isOffline,

    // );

    // EnvironmentState.update((env) => {
    //   const newConfig = Object.assign(env, { isOffline, syncDisabled });
    //   console.log("dingo updating config", newConfig);
    //   return newConfig;
    // });
    // if (syncDisabled) {
    //   console.log("stopping sync");
    //   stopSync();
    // } else {
    //   console.log("starting sync", isOffline);
    //   startSync();
    // }
  }
  onMount(async () => {
    /**Test dingo code*/
    displayedEvents = [...events];

    await bootstrap(schema);
    
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
        on:change={() => setEnvironment(centralConfig)}
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
    <div class="flex justify-end h-full w-full mr-2 mt-2">
      <ul>
        {#each displayedEvents as event}
          <li>
            <Toasters
              type="info"
              display={true}
              id={event.type}
              on:CLEAR_TOASTER={() =>
                (displayedEvents = displayedEvents.filter(
                  (d) => d.type !== event.type
                ))}
            >
              <span slot="header">
                {event.cat}
              </span>
              <span slot="body">{event.msg}</span>
            </Toasters>
          </li>
        {/each}
      </ul>
    </div>
  </div>
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
