<script>
	import { greet } from './greet';

	// Welcome demonstrates component tests with independent host and guest greetings.
	let { host = 'SvelteKit', guest = 'Vitest' } = $props();
</script>

<h1>{greet(host)}</h1>
<p>{greet(guest)}</p>
