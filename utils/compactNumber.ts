export default function compactNumber(num: number): string {
    return new Intl.NumberFormat("en-US", {
        notation: "compact",
        compactDisplay: "short"
    }).format(num);
}