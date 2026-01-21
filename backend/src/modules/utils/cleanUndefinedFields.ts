export default function cleanUndefinedFields(data: any) {
	return Object.fromEntries(
		Object.entries(data).filter(([_, value]) => value !== undefined)
	);
}