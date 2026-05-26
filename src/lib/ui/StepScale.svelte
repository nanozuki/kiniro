<!--
@component
- Inline editor for one family's step scale.
- Structure edits are shared by all variants in the theme.
- Lightness values and overrides belong only to the current variant.
-->

<script lang="ts">
	import InlineInput from './InlineInput.svelte';
	import { createInlineEditSession, type InlineEditSubmitResult } from './InlineInput.svelte';
	import { formatLightness, normalizeChannelValue } from '../color';
	import { buildSteps } from '../lightness';
	import type { StepIndexStyle, StepScaleStructure, StepScaleValues } from '../model';

	type StepScaleProps = {
		structure: StepScaleStructure;
		values: StepScaleValues;
		onstepcount?: (count: number) => void;
		onindexstyle?: (style: StepIndexStyle) => void;
		onhalfsteps?: (start: boolean, end: boolean) => void;
		onrange?: (start: number, end: number) => void;
		onoverride?: (index: string, lightness: number) => void;
		onreset?: (index: string) => void;
		onreverse?: () => void;
	};

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
	}: StepScaleProps = $props();

	let editing = $state(false);
	let steps = $derived(buildSteps(structure, values));

	function finiteNumber(draft: string): number | null {
		if (draft.trim().length === 0) return null;
		const value = Number(draft);
		return Number.isFinite(value) ? value : null;
	}

	function resolveStepCount(draft: string, previous: string): InlineEditSubmitResult {
		const parsed = finiteNumber(draft);
		const value = parsed ?? Number(previous);
		const resolved = String(Math.min(9, Math.max(5, Math.trunc(value))));

		if (parsed == null) {
			return {
				value: resolved,
				error: 'Step count must be a number from 5 to 9; restored the previous value.'
			};
		}
		if (String(parsed) !== resolved) {
			return {
				value: resolved,
				error: `Step count must be a whole number from 5 to 9; adjusted to ${resolved}.`
			};
		}
		return { value: resolved };
	}

	function resolveLightness(draft: string, previous: string): InlineEditSubmitResult {
		const parsed = finiteNumber(draft);
		const value = parsed ?? Number(previous);
		const resolved = String(normalizeChannelValue('lightness', value));

		if (parsed == null) {
			return {
				value: resolved,
				error: 'Lightness must be a number from 0 to 1; restored the previous value.'
			};
		}
		if (parsed < 0 || parsed > 1) {
			return {
				value: resolved,
				error: `Lightness must be between 0 and 1; adjusted to ${resolved}.`
			};
		}
		return { value: resolved };
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
				>Step count <InlineInput
					aria-label="Step count"
					inputmode="numeric"
					value={String(structure.stepCount)}
					session={createInlineEditSession({
						preview: (draft) => {
							const value = finiteNumber(draft);
							if (value != null) onstepcount(value);
						},
						submit: (draft) => {
							const result = resolveStepCount(draft, String(structure.stepCount));
							onstepcount(Number(result.value));
							return result;
						}
					})}
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
				>Start lightness <InlineInput
					aria-label="Start lightness"
					inputmode="decimal"
					value={String(values.lightnessStart)}
					session={createInlineEditSession({
						preview: (draft) => {
							const value = finiteNumber(draft);
							if (value != null) onrange(value, values.lightnessEnd);
						},
						submit: (draft) => {
							const result = resolveLightness(draft, String(values.lightnessStart));
							onrange(Number(result.value), values.lightnessEnd);
							return result;
						}
					})}
				/></label
			>
			<label
				>End lightness <InlineInput
					aria-label="End lightness"
					inputmode="decimal"
					value={String(values.lightnessEnd)}
					session={createInlineEditSession({
						preview: (draft) => {
							const value = finiteNumber(draft);
							if (value != null) onrange(values.lightnessStart, value);
						},
						submit: (draft) => {
							const result = resolveLightness(draft, String(values.lightnessEnd));
							onrange(values.lightnessStart, Number(result.value));
							return result;
						}
					})}
				/></label
			>
			<button type="button" onclick={onreverse}>Reverse lightness</button>

			<div class="overrides">
				{#each steps as step}
					<div>
						<label
							>{step.index} lightness
							<InlineInput
								aria-label={`${step.index} lightness`}
								inputmode="decimal"
								value={String(step.lightness)}
								disabled={!steps.slice(1, -1).includes(step)}
								session={createInlineEditSession({
									preview: (draft) => {
										const value = finiteNumber(draft);
										if (value != null) onoverride(step.index, value);
									},
									submit: (draft) => {
										const result = resolveLightness(draft, String(step.lightness));
										onoverride(step.index, Number(result.value));
										return result;
									}
								})}
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
