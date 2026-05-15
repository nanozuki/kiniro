<script lang="ts">
	let { label, selected = false, disabled = false, onclick = () => {} } = $props<{
		label: string;
		selected?: boolean;
		disabled?: boolean;
		onclick?: () => void;
	}>();
</script>

<button type="button" aria-current={selected} {disabled} {onclick}>{label}</button>
