import React, {ChangeEventHandler} from "react";
import {CURRENCIES} from "@/const/currencies";
import {Select} from "@telegram-apps/telegram-ui";
import Loader from "@/app/components/loader/loader";
import "./currencySelect.css";

export function CurrencySelect({defaultCurrency, isLoading, className, spinnerClassName, onChange, disabled = false}: {
    defaultCurrency?: string,
    isLoading?: boolean,
    className?: string,
    spinnerClassName?: string,
    onChange: ChangeEventHandler
    disabled?: boolean,
}) {

    return (
        defaultCurrency && !isLoading ?
            <Select
                defaultValue={defaultCurrency}
                className={className}
                onChange={onChange}
                disabled={disabled}
            >
                {
                    CURRENCIES.map((currency) => (
                        <option key={currency}> {currency} </option>
                    ))
                }
            </Select>
            :
            <Loader className="mr-4 mt-4"/>
    );
}