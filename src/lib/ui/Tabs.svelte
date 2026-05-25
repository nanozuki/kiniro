<!--
@component
- Project wrapper around Melt UI tabs for controlled navigation lists.
- Callers provide stable item IDs and own the selected value.
-->

<script lang="ts">
	import { Tabs as MeltTabs } from 'melt/builders';
	import type { AriaAttributes } from 'svelte/elements';

	type TabItem = {
		id: string;
		label: string;
		disabled?: boolean;
		title?: string;
	};

	type TabsProps = AriaAttributes & {
		items: TabItem[];
		value: string;
		onchange?: (id: string) => void;
	};

	let { items, value, onchange = (_id: string) => {}, ...tabListProps }: TabsProps = $props();

	const tabs = new MeltTabs<string>({
		value: () => value,
		onValueChange: (id) => {
			if (items.some((item: TabItem) => item.id === id && !item.disabled)) onchange(id);
		}
	});
</script>

<div {...tabs.triggerList} {...tabListProps}>
	{#each items as item}
		{@const trigger = tabs.getTrigger(item.id)}
		<button
			type="button"
			{...trigger}
			disabled={item.disabled}
			title={item.title}
			onclick={() => {
				if (!item.disabled) trigger.onclick();
			}}>{item.label}</button
		>
	{/each}
</div>
