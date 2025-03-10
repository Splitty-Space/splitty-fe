"use client"

import useMe from "@/services/useMe";
import HeaderWithSearch from "@/app/components/header/headerWithSearch";
import {Icon28PersonAdd} from "@/Icons";
import {IconButton, Spinner} from "@telegram-apps/telegram-ui";
import {shareURL} from "@telegram-apps/sdk";

export default function FriendsHeader({searchValue, setSearchValue, onSearchChange}: {
    searchValue: string,
    setSearchValue: Function,
    onSearchChange: Function,
}) {
    const {data: me, loading} = useMe();

    return loading ?
        (<Spinner size="l"/>) :
        (
            <HeaderWithSearch
                searchValue={searchValue}
                setSearchValue={setSearchValue}
                onSearchChange={onSearchChange}
                RightComponent={() => (
                    <IconButton
                        size="l"
                        mode="bezeled"
                        onClick={() => {
                            if (shareURL.isAvailable()) {
                                shareURL(
                                    `https://t.me/splitty_fe_bot?start=${me.referral_code}`,
                                    "Join me on Splitty and let's split together! Use my invite link to join. 🌟"); // TODO localize text
                            }
                        }}
                    >
                        <Icon28PersonAdd/>
                    </IconButton>)
                }
            />
        );
}