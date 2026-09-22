export function splitNumberIntoParts(amount: number, partsCount: number, precision = 2) {
    if (!Number.isInteger(partsCount) || partsCount <= 0) return [];
    if (!Number.isInteger(precision) || precision < 0 || precision > 18) return [];
    if (!Number.isFinite(amount) || amount < 0) return new Array<number>(partsCount).fill(0);

    // Parse the decimal representation before scaling: ETH units can exceed
    // Number.MAX_SAFE_INTEGER even when the entered amount is small.
    const [coefficient, exponent = "0"] = amount.toString().split("e");
    const [whole, fraction = ""] = coefficient.split(".");
    const shift = precision + Number(exponent) - fraction.length;
    const digits = BigInt(whole + fraction);
    const power = BigInt(10) ** BigInt(Math.abs(shift));
    const units = shift >= 0 ? digits * power : (digits + power / BigInt(2)) / power;
    const count = BigInt(partsCount);
    const base = units / count;
    const remainder = units % count;
    return Array.from({length: partsCount}, (_, index) => {
        const share = base + (BigInt(index) < remainder ? BigInt(1) : BigInt(0));
        return Number(`${share}e-${precision}`);
    });
}
