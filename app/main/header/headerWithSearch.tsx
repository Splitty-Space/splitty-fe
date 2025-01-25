"use client"

import React, {FC, useCallback, useEffect, useState} from "react";
import {useTranslation} from "react-i18next";
import Header from "@/app/main/header/header";
import {Icon24Search, Icon24Close, Icon28Search} from "@/Icons";
import {IconButton, Input, Tappable} from "@telegram-apps/telegram-ui";
import Logo from "@/app/main/header/logo";

export default function HeaderWithSearch({
                                             forceSearchOpen,
                                             searchValue,
                                             setSearchValue,
                                             onSearchChange,
                                             LeftComponent,
                                             CentralComponent,
                                             RightComponent,
                                         }: {
                                             forceSearchOpen?: boolean,
                                             searchValue?: string,
                                             setSearchValue?: Function,
                                             onSearchChange?: Function,
                                             LeftComponent?: FC,
                                             CentralComponent?: FC,
                                             RightComponent?: FC,
                                         }
) {
    const {t} = useTranslation();
    const [isSearchOpen, setIsSearchOpen] = useState(false);

    useEffect(() => {
            if (onSearchChange) onSearchChange(isSearchOpen)
        }, [isSearchOpen, onSearchChange]
    );

    const HEADER_SEARCH_ID = "HEADER_SEARCH_ID";

    useEffect(() => {
        if (isSearchOpen) {
            document.getElementById(HEADER_SEARCH_ID)?.focus()
        }
    }, [isSearchOpen]);

    const clearSearch = useCallback(() => {
        setSearchValue && setSearchValue("");
    }, [setSearchValue]);

    const isOpen = isSearchOpen || forceSearchOpen;

    const _LeftComponent = () => LeftComponent ?
        <LeftComponent/> :
        (<IconButton
            mode="bezeled"
            size="l"
            onClick={() => setIsSearchOpen(isSearchOpen => !isSearchOpen)}
        >
            <Icon28Search/>
        </IconButton>);

    const onChange = useCallback(
        (e: React.ChangeEvent<HTMLInputElement>) => {
            if (setSearchValue) {
                setSearchValue(e.target.value);
            }
        },
        [setSearchValue]);

    return (
        <Header
            className={isOpen ? "h-32" : "h-20"}
            LeftComponent={_LeftComponent}
            CentralComponent={CentralComponent ? CentralComponent : Logo}
            RightComponent={RightComponent}
            AfterComponent={<Input
                id={HEADER_SEARCH_ID}
                placeholder={t("header.Search")}
                className={isOpen ? "header_input" : "header_input__hide"}
                value={searchValue}
                onChange={onChange}
                before={<Icon24Search/>}
                after={
                    <Tappable
                        Component="div"
                        onClick={clearSearch}
                    >
                        <Icon24Close/>
                    </Tappable>}
            />}
        />
    );
}