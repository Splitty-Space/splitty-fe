export function splitNumberIntoParts(amount: number, partsCount: number) {
    // Calculate the basic equal part
    const part = parseFloat((amount / partsCount).toFixed(2));

    // Initialize an array to hold the parts
    const parts = new Array(partsCount).fill(part);

    // Calculate the total of the parts after rounding
    const total = part * partsCount;

    // Calculate the difference due to rounding
    const difference = parseFloat((amount - total).toFixed(2));

    parts[0] = Math.round((parts[0] + difference) * 100) / 100;

    return parts;
}