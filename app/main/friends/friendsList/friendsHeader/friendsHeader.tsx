"use client"

import HeaderWithSearch from "@/app/main/header/headerWithSearch";
import {Icon28PersonAdd} from "@/Icons";
import {IconButton} from "@telegram-apps/telegram-ui";
import {initUtils} from "@telegram-apps/sdk-react";

export default function FriendsHeader({searchValue, setSearchValue, onSearchChange}: {
    searchValue: string,
    setSearchValue: Function,
    onSearchChange: Function,
}) {
    return (
        <HeaderWithSearch
            searchValue={searchValue}
            setSearchValue={setSearchValue}
            onSearchChange={onSearchChange}
            RightComponent={() => (
                <IconButton
                    size="l"
                    mode="bezeled"
                    onClick={() => {
                        const utils = initUtils();
                        utils.shareURL(
                            "https://t.me/splitty_fe_bot/app?start", // TODO change to prod bot
                            // TODO app?startapp=ref_AfNBc8hfdY ???
                            "Join me on Splitty and let's split together! Use my invite link to join. 🌟"); // TODO localize text
                    }}
                >
                    <Icon28PersonAdd/>
                </IconButton>)
            }
        />
    );
}