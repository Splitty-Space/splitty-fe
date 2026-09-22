export const CURRENCIES = ["USD", "UAH", "RUB", "EUR", "PLN", "IDR", "THB", "VND", "USDT", "BTC", "TON", "ETH", "USDC"];

// Precision used by the expense editor; fiat retains its existing two-decimal rule.
export const EXPENSE_CURRENCY_PRECISION: Readonly<Record<string, number>> = {
    BTC: 8,
    TON: 9,
    ETH: 18,
    USDT: 6,
    USDC: 6,
};
