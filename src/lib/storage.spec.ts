import { afterEach, describe, expect, it, vi } from 'vitest';
import { loadGroups, parseGroupsJson, saveGroups, type GroupData } from './storage';

afterEach(() => {
	vi.unstubAllGlobals();
});

describe('loadGroups', () => {
	it('does not read browser storage during server-side rendering', () => {
		expect(loadGroups()).toEqual([]);
	});
});

describe('saveGroups', () => {
	it('stores the palette model as JSON', () => {
		const setItem = vi.fn();
		vi.stubGlobal('localStorage', { setItem });
		const groups: GroupData[] = [
			{
				id: 1,
				name: 'brand',
				lightnessMax: 0.95,
				lightnessMin: 0.16,
				controlledLightness: {},
				reversed: false,
				stepsCount: 3,
				halfStepBefore: false,
				halfStepAfter: false,
				colors: [{ id: 1, name: 'primary', hex: '#907aa9' }]
			}
		];

		saveGroups(groups);

		expect(setItem).toHaveBeenCalledWith('kiniro-palettes', JSON.stringify(groups));
	});
});

describe('parseGroupsJson', () => {
	it('applies schema defaults for older palette files', () => {
		const parsed = parseGroupsJson(
			JSON.stringify([
				{
					id: 1,
					name: 'legacy',
					lightnessMax: 0.9,
					lightnessMin: 0.1,
					colors: [{ id: 1, name: 'primary', hex: '#907aa9' }]
				}
			])
		);

		expect(parsed).toEqual([
			{
				id: 1,
				name: 'legacy',
				lightnessMax: 0.9,
				lightnessMin: 0.1,
				controlledLightness: {},
				reversed: false,
				stepsCount: 9,
				halfStepBefore: false,
				halfStepAfter: false,
				colors: [{ id: 1, name: 'primary', hex: '#907aa9' }]
			}
		]);
	});

	it('rejects invalid JSON and invalid palette shape', () => {
		expect(parseGroupsJson('not-json')).toBeNull();
		expect(parseGroupsJson(JSON.stringify([{ id: 'bad' }]))).toBeNull();
	});
});
