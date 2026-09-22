interface Allocation {
    amount?: number;
    isSelected: boolean;
}

export function isAllocationBalanced(amount: number, allocations: Allocation[]): boolean {
    if (!Number.isFinite(amount) || amount <= 0) return false;

    const selected = allocations.filter((allocation) => allocation.isSelected);
    if (!selected.length || selected.some(({amount}) =>
        amount === undefined || !Number.isFinite(amount) || amount < 0)) return false;

    const total = selected.reduce((sum, allocation) => sum + allocation.amount!, 0);
    // Tolerate floating-point addition noise without rounding cryptocurrency values to cents.
    const tolerance = Number.EPSILON * amount * selected.length * 2;
    return Math.abs(total - amount) <= tolerance;
}
