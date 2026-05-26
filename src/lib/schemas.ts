import { z } from 'zod';

export const STORAGE_STATE_VERSION = 1;
export const EXPORT_FILE_VERSION = 1;

export const idSchema = z.string().min(1);
export const workspaceTabSchema = z.enum(['palette', 'cssVariables', 'contrastChecker']);
export const gamutSchema = z.enum(['srgb', 'p3']);
export const gamutPreviewSchema = gamutSchema;
export const stepIndexStyleSchema = z.enum(['scale', 'ordinal']);
export const sourceColorFormatSchema = z.enum(['oklch', 'hex', 'rgb', 'hsl']);
export const oklchChannelSchema = z.enum(['lightness', 'chroma', 'hue']);

const numberRecordSchema = z.record(z.string(), z.number());

export const oklchColorSchema = z.strictObject({
	lightness: z.number(),
	chroma: z.number(),
	hue: z.number()
});

export const sourceColorSchema = z.strictObject({
	format: sourceColorFormatSchema,
	oklch: oklchColorSchema,
	serialized: z.string()
});

export const swatchChannelOverridesSchema = z
	.object({
		lightness: z.number().optional(),
		chroma: z.number().optional(),
		hue: z.number().optional()
	})
	.strict()
	.refine((value) => Object.keys(value).every((key) => oklchChannelSchema.safeParse(key).success));

export const stepScaleStructureSchema = z.strictObject({
	stepCount: z.number().int().positive(),
	indexStyle: stepIndexStyleSchema,
	halfStepStart: z.boolean(),
	halfStepEnd: z.boolean()
});

export const stepScaleValuesSchema = z.strictObject({
	lightnessStart: z.number(),
	lightnessEnd: z.number(),
	lightnessOverrides: numberRecordSchema,
	reversed: z.boolean()
});

export const colorRampValuesSchema = z.strictObject({
	sourceColor: sourceColorSchema,
	swatchOverrides: z.record(z.string(), swatchChannelOverridesSchema)
});

export const colorRampStructureSchema = z.strictObject({
	id: idSchema,
	name: z.string()
});

export const colorFamilyStructureSchema = z.strictObject({
	id: idSchema,
	name: z.string(),
	stepScale: stepScaleStructureSchema,
	ramps: z.array(colorRampStructureSchema)
});

export const colorFamilyValuesSchema = z.strictObject({
	stepScale: stepScaleValuesSchema,
	ramps: z.record(z.string(), colorRampValuesSchema)
});

export const themeStructureSchema = z.strictObject({
	families: z.array(colorFamilyStructureSchema)
});

export const variantValuesSchema = z.strictObject({
	families: z.record(z.string(), colorFamilyValuesSchema)
});

export const themeVariantSchema = z.strictObject({
	id: idSchema,
	name: z.string(),
	values: variantValuesSchema
});

export const themeSchema = z.strictObject({
	id: idSchema,
	name: z.string(),
	cssPrefix: z.string(),
	targetGamut: gamutSchema,
	structure: themeStructureSchema,
	variants: z.array(themeVariantSchema)
});

export const appStateSchema = z.strictObject({
	themes: z.array(themeSchema)
});

export const uiStateSchema = z.strictObject({
	selectedThemeId: idSchema.nullable(),
	selectedVariantId: idSchema.nullable(),
	workspaceTab: workspaceTabSchema
});

export const undoEntrySchema = z.strictObject({
	label: z.string(),
	data: appStateSchema,
	ui: uiStateSchema
});

export const undoStackSchema = z.strictObject({
	past: z.array(undoEntrySchema),
	future: z.array(undoEntrySchema)
});

export const savedStateSchema = z.strictObject({
	version: z.literal(STORAGE_STATE_VERSION),
	data: appStateSchema,
	ui: uiStateSchema,
	history: undoStackSchema
});

export const exportRampSchema = colorRampStructureSchema.omit({ id: true });
export const exportFamilySchema = colorFamilyStructureSchema
	.omit({ id: true, ramps: true })
	.extend({ ramps: z.array(exportRampSchema) });
export const exportStructureSchema = z.strictObject({
	families: z.array(exportFamilySchema)
});
export const exportFamilyValuesSchema = colorFamilyValuesSchema
	.omit({ ramps: true })
	.extend({ ramps: z.array(colorRampValuesSchema) });
export const exportVariantValuesSchema = z.strictObject({
	families: z.array(exportFamilyValuesSchema)
});
export const exportVariantSchema = themeVariantSchema
	.omit({ id: true, values: true })
	.extend({ values: exportVariantValuesSchema });
export const exportThemeSchema = themeSchema
	.omit({ id: true, structure: true, variants: true })
	.extend({
		structure: exportStructureSchema,
		variants: z.array(exportVariantSchema)
	});
export const exportFileSchema = z.strictObject({
	version: z.literal(EXPORT_FILE_VERSION),
	themes: z.array(exportThemeSchema)
});

export type ExportFile = z.infer<typeof exportFileSchema>;
export type ExportTheme = z.infer<typeof exportThemeSchema>;
