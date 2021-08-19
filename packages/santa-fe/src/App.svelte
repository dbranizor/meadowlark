<script>
	import {Sync} from "@meadowlark-labs/central"
	import {onMount} from "svelte"
	export let name;
	onMount(() => {
		Sync.init({syncHost: "https://192.168.1.11/central-park", logging: "debug"})
		Sync.addSchema({
			event: [],
			coe: []
		})
		Sync.addGroup("home")
		Sync.start()
	})
</script>

<main>
	<h1>Hello {name}!</h1>
	<p>Visit the <a href="https://svelte.dev/tutorial">Svelte tutorial</a> to learn how to build Svelte apps.</p>
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