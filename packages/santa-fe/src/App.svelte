<script>
	import {Sync} from "@meadowlark-labs/central"
	import Toasters from "./Toasters.svelte"
	import {onMount} from "svelte"

	let events = [{
		type: "test",
		payload: "This is just a test"
	}, {
		type: "email",
		payload: "Check your emails"
	}]
	let displayedEvents = [];
	let newType = false;;
	let newMessage = false;
	export let name;
	$: if(newMessage){
		if(newType){
			
		}
	}
	onMount(() => {

		/**Test dingo code*/
		displayedEvents = [...events]

		Sync.init({syncHost: "https://192.168.1.11/central-park", logging: "debug"})
		Sync.addSchema({
			event: [],
			coe: []
		})
		Sync.addGroup("home")
		Sync.selectGroup("home")
		Sync.start()
	
	})
</script>

<main>

	 <div class="flex">
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
						{event.type}
					</span>
					<span slot="body">{event.payload}</span>
				</Toasters>
			</li>

		{/each}
		</ul>


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