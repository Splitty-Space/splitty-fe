// Ids from the URL are strings and may be missing or malformed.
export const parseId = (value: string | null): number | null => {
    if (value === null || value.trim() === "") return null;
    const id = Number(value);
    return Number.isInteger(id) ? id : null;
};
