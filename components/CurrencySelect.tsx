import React, {ChangeEventHandler} from "react";
import {CURRENCIES} from "@/const/currencies";
import {Select, Spinner} from "@telegram-apps/telegram-ui";

export function CurrencySelect({defaultCurrency, isLoading, className, spinnerClassName, onChange}: {
    defaultCurrency?: string,
    isLoading?: boolean,
    className?: string,
    spinnerClassName?: string,
    onChange: ChangeEventHandler
}) {

    return (
        defaultCurrency && !isLoading ?
            <Select
                defaultValue={defaultCurrency}
                className={className}
                onChange={onChange}
            >
                {
                    CURRENCIES.map((currency) => (
                        <option key={currency}> {currency} </option>
                    ))
                }
            </Select>
            :
            <Spinner size="s" className={spinnerClassName}/>
    );
}