import {CURRENCIES_SYMBOLS} from "@/const/currenciesSymbols";
import {CURRENCIES} from "@/const/currencies";

export const currencyToCurrencySymbol = (currency: typeof CURRENCIES[number]): string => {
    return CURRENCIES_SYMBOLS[currency];
};