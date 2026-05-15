import { formatChroma, formatHue, formatLightness } from './color';
import { sanitizeCssName } from './naming';
import { generateVariantPalette, type GeneratedColorFamily, type GeneratedVariantPalette } from './palette';
import type { Theme, ThemeVariant } from './model';

export type CssVariable = {
	name: string;
	value: string;
	familyId: string;
	rampId: string;
	stepIndex: string;
};

export type CssVariableGroup = {
	familyId: string;
	familyName: string;
	variables: CssVariable[];
};

export type CssExport = {
	prefix: string;
	groups: CssVariableGroup[];
	css: string;
	usageExample: string | null;
};

// CSS export renders only the selected variant and keeps names/value text derived
// from generated palette data. It never writes sanitized names or CSS text back
// into persisted theme data.
export function exportCssVariables(theme: Theme, variant: ThemeVariant): CssExport {
	return exportGeneratedCssVariables(generateVariantPalette(theme, variant), {
		prefix: theme.cssPrefix,
		variantName: variant.name
	});
}

export function exportGeneratedCssVariables(
	palette: GeneratedVariantPalette,
	options: { prefix: string; variantName: string }
): CssExport {
	const prefix = normalizeCssPrefix(options.prefix);
	const variantName = sanitizeCssName(options.variantName) || 'variant';
	const groups = palette.families.map((family) => buildGroup(family, prefix, variantName));
	const css = renderCss(groups);
	const firstVariable = groups.flatMap((group) => group.variables)[0];

	return {
		prefix,
		groups,
		css,
		usageExample: firstVariable ? `color: oklch(var(${firstVariable.name}) / 1);` : null
	};
}

export function normalizeCssPrefix(prefix: string): string {
	return sanitizeCssName(prefix) || 'color';
}

function buildGroup(family: GeneratedColorFamily, prefix: string, variantName: string): CssVariableGroup {
	return {
		familyId: family.id,
		familyName: family.name,
		variables: family.ramps.flatMap((ramp) => {
			const rampName = sanitizeCssName(ramp.name) || 'ramp';
			return ramp.swatches.map((swatch) => {
				const name = `--${prefix}-${variantName}-${rampName}-${swatch.stepIndex}`;
				return {
					name,
					value: `${formatLightness(swatch.oklch.lightness)} ${formatChroma(swatch.oklch.chroma)} ${formatHue(swatch.oklch.hue)}`,
					familyId: family.id,
					rampId: ramp.id,
					stepIndex: swatch.stepIndex
				};
			});
		})
	};
}

function renderCss(groups: readonly CssVariableGroup[]): string {
	const lines = [':root {'];

	groups.forEach((group, index) => {
		if (index > 0) lines.push('');
		lines.push(`  /* ${group.familyName} */`);
		for (const variable of group.variables) lines.push(`  ${variable.name}: ${variable.value};`);
	});

	lines.push('}');
	return lines.join('\n');
}
