<script>
    import {onMount, setContext} from "svelte"
    import {writable} from "svelte/store"


    const isLoading = writable(true)
    const isAuthenticated = writable(false)
    const authToken = writable("")
    const userInfo = writable({})
    const authError = writable(null)

    const refreshRate = 10 * 60 * 60 * 1000

    const authService = writable(null)

    onMount(async () => {

    })

</script>