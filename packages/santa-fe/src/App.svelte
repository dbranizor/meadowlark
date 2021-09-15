<script>
	import Toasters from "./Toasters.svelte"
	import {onMount} from "svelte"
	import { initBackend } from "absurd-sql/dist/indexeddb-main-thread.js";
	import {insert, start, setWorker, setEnvironment,runInterval } from "@meadowlark-labs/central"
import Navbar from "./Navbar.svelte";
import EnvironmentState from "@meadowlark-labs/central/src/environment-state";



	start()
	let events = [{
		cat: "test",
		msg: "This is just a test"
	}, {
		cat: "email",
		msg: "Check your emails"
	}]
	let displayedEvents = [];
	let newType = "";;
	let newMessage = "";
	let worker;
	let interval;

	const unsubscribes = [];


	let testUsers = [
		{id: "John", display: "John"},
		{id: "George", display: "George"},
		{id: "Paul", display: "Paul"},
		{id: "Ringo", display: "Ringo"},
	]

	let selectedUser = testUsers[1].display;
	let centralConfig = {user_id: selectedUser, syncEnabled: true, syncUrl: "https://localhost/central-park", group_id: "meadowlark", debug: true, isOffline: false}
	EnvironmentState.subscribe(e => centralConfig = Object.assign(centralConfig, e));
	setEnvironment(centralConfig)
	
	export let name;

	$: if(newMessage){
		if(newType){
			
		}
	}
	const handleNewMessage =  (e) => {
		if(e.code === "Enter"){
			console.log('dingo adding new message');
			const event = {cat: newType, msg: newMessage}
			insert('events', event);
			worker.postMessage({type: "db-get-messages"})
			displayedEvents = [...displayedEvents, {cat: newType, msg: newMessage}]
		} 
	}
	onMount(() => {
		interval = runInterval();
		/**Test dingo code*/
		displayedEvents = [...events]
		console.log('dingo getting worker');
		worker = new Worker(new URL('../lib/sync.js', import.meta.url));
		console.log('dingo starting worker', worker)

		initBackend(worker);
		// TODO: Figure out how to get this into initBackend wrapper script
		setWorker(worker)
		
		console.log('dingo running function to invoke UI A', worker)
		worker.postMessage({ type: 'ui-invoke', name: 'init' });
		
		console.log('dingo running function to init db B')

		worker.onmessage = function(e){		
			console.log('dingo worker event', e, e.data.type === "initialized_database");
			if( e.data.type === "initialized_database"){
				console.log('dingo initializing database')
				worker.postMessage({type: "db-run", sql: "select * from messages"})
				worker.postMessage({ type: 'db-init', schema: {
					"events" : {
						id: "TEXT",
						cat: "TEXT",
						msg: "TEXT",
						coi: "TEXT"
					},
					"coi": {
						id: "TEXT",
						name: "text",
						details: "text"
					},
					"user_coi": {
						id: "TEXT",
						coi: "TEXT",
						user: "text"
					}
				}});

			}


			if(e.data.type === "applied-messages"){
			 console.log('dingo results', e.data)
		 	}


		 }



		// Sync.init({syncHost: "https://192.168.1.11/central-park", logging: "debug"})
		// Sync.addSchema({
		// 	event: [],
		// 	coe: []
		// })
		// Sync.addGroup("home")
		// Sync.selectGroup("home")
		// Sync.start()
	
	})
</script>
<svelte:options accessors={true} />
<svelte:window on:keydown={handleNewMessage} />
<main>
	<div class="Dark">
		<Navbar>
			<span slot="name">
				Santa-Fe 
			</span>
			<span slot="links">
				<span class="h-5 {centralConfig.isOffline ? 'bg-red-500 hover:bg-red-800 text-gray-100 hover:text-gray-200 ' : ' bg-background-ternary hover:bg-gray-600 text-gray-100 hover:text-gray-200 '}px-2 py-2 flex items-center font-bold">
					{centralConfig.isOffline ? 'Offline' : 'Online'}
				</span>
			</span>
	
		</Navbar>
		 <div class="flex">
			<select bind:value={selectedUser} on:change={() => setEnvironment(centralConfig)}>
				{#each testUsers as user}
					 <option value={user}>{user.display}</option>
				{/each}
			</select>
			<h1 class="text-blue-500 leading-tight">Santa-Fe</h1>
			<div class="ml-auto">
				<input class="border-b border-blue-500" bind:value={newType} placeholder="Type" />
				<input class="border-b border-blue-500"  bind:value={newMessage} placeholder="Message" />
			</div>
		 </div>
		 <div class="flex justify-end h-full w-full mr-2 mt-2">
			<ul>
				{#each displayedEvents as event}
				<li>
					<Toasters type="info" display={true} id={event.type} 
					on:CLEAR_TOASTER={() => displayedEvents = displayedEvents.filter(d => d.type !== event.type)} >
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