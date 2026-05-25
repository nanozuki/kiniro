// JSON round-trip strips $state proxies; structuredClone does not.
export function clone<T>(value: T): T {
	return JSON.parse(JSON.stringify(value)) as T;
}
