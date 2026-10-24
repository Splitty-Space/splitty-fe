// Ids from the URL are strings and may be missing or malformed.
// Only plain digits count, so "0x2", "1e0" or " 2 " do not pass for id 2.
export const parseId = (value: string | null): number | null =>
    value !== null && /^-?\d+$/.test(value) ? Number(value) : null;
