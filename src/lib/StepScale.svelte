<script lang="ts">
	import { formatLightness } from './color';
	import { buildSteps } from './lightness';
	import type { StepIndexStyle, StepScaleStructure, StepScaleValues } from './model';

	let {
		structure,
		values,
		onstepcount = (_count: number) => {},
		onindexstyle = (_style: StepIndexStyle) => {},
		onhalfsteps = (_start: boolean, _end: boolean) => {},
		onrange = (_start: number, _end: number) => {},
		onoverride = (_index: string, _lightness: number) => {},
		onreset = (_index: string) => {},
		onreverse = () => {}
	} = $props<{
		structure: StepScaleStructure;
		values: StepScaleValues;
		onstepcount?: (count: number) => void;
		onindexstyle?: (style: StepIndexStyle) => void;
		onhalfsteps?: (start: boolean, end: boolean) => void;
		onrange?: (start: number, end: number) => void;
		onoverride?: (index: string, lightness: number) => void;
		onreset?: (index: string) => void;
		onreverse?: () => void;
	}>();

	let editing = $state(false);
	let steps = $derived(buildSteps(structure, values));

	function numberValue(event: Event) {
		return Number((event.currentTarget as HTMLInputElement).value);
	}
</script>

<section
	aria-label="Step scale"
	class="step-scale"
	onfocusout={(event) => {
		if (!event.currentTarget.contains(event.relatedTarget as Node | null)) editing = false;
	}}
>
	<div aria-label="Step scale summary" class="summary">
		{#each steps as step}
			<span>{step.index}: {formatLightness(step.lightness)}</span>
		{/each}
	</div>
	<button type="button" onclick={() => (editing = true)}>Edit step scale</button>

	{#if editing}
		<div class="editor">
			<label
				>Step count <input
					aria-label="Step count"
					type="number"
					min="5"
					max="9"
					value={structure.stepCount}
					oninput={(event) => onstepcount(numberValue(event))}
				/></label
			>
			<label
				>Index style
				<select
					aria-label="Index style"
					value={structure.indexStyle}
					onchange={(event) =>
						onindexstyle((event.currentTarget as HTMLSelectElement).value as StepIndexStyle)}
				>
					<option value="scale">Scale</option>
					<option value="ordinal">Ordinal</option>
				</select>
			</label>
			{#if structure.indexStyle === 'scale'}
				<label
					><input
						aria-label="Half step start"
						type="checkbox"
						checked={structure.halfStepStart}
						onchange={(event) =>
							onhalfsteps((event.currentTarget as HTMLInputElement).checked, structure.halfStepEnd)}
					/> Half step start</label
				>
				<label
					><input
						aria-label="Half step end"
						type="checkbox"
						checked={structure.halfStepEnd}
						onchange={(event) =>
							onhalfsteps(
								structure.halfStepStart,
								(event.currentTarget as HTMLInputElement).checked
							)}
					/> Half step end</label
				>
			{/if}
			<label
				>Start lightness <input
					aria-label="Start lightness"
					type="number"
					min="0"
					max="1"
					step="0.01"
					value={values.lightnessStart}
					oninput={(event) => onrange(numberValue(event), values.lightnessEnd)}
				/></label
			>
			<label
				>End lightness <input
					aria-label="End lightness"
					type="number"
					min="0"
					max="1"
					step="0.01"
					value={values.lightnessEnd}
					oninput={(event) => onrange(values.lightnessStart, numberValue(event))}
				/></label
			>
			<button type="button" onclick={onreverse}>Reverse lightness</button>

			<div class="overrides">
				{#each steps as step}
					<div>
						<label
							>{step.index} lightness
							<input
								aria-label={`${step.index} lightness`}
								type="number"
								min="0"
								max="1"
								step="0.01"
								value={step.lightness}
								disabled={!steps.slice(1, -1).includes(step)}
								oninput={(event) => onoverride(step.index, numberValue(event))}
							/></label
						>
						<button
							type="button"
							disabled={!step.controlled || step === steps[0] || step === steps[steps.length - 1]}
							onclick={() => onreset(step.index)}>Reset {step.index}</button
						>
					</div>
				{/each}
			</div>
		</div>
	{/if}
</section>

<style>
	.step-scale,
	.editor,
	.overrides {
		display: grid;
		gap: 0.5rem;
	}
	.summary {
		display: flex;
		gap: 0.5rem;
		flex-wrap: wrap;
	}
	.editor {
		border: 1px dashed currentColor;
		border-radius: 0.5rem;
		padding: 0.75rem;
	}
</style>
