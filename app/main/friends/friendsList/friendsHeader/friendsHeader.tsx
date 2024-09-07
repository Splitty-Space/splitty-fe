"use client"

import {subPageConst} from "@/const/subPageConst";
import HeaderWithSearch from "@/app/main/header/headerWithSearch";
import {Icon28PersonAdd} from "@/Icons";
import {IconButton} from "@telegram-apps/telegram-ui";

export default function FriendsHeader({searchValue, setSearchValue, setSubpage}: {
    searchValue: string,
    setSearchValue: Function,
    setSubpage: Function
}) {
    return (
        <HeaderWithSearch
            searchValue={searchValue}
            setSearchValue={setSearchValue}
            RightComponent={() => (
                <IconButton
                    size="l"
                    mode="bezeled"
                    onClick={() => setSubpage(subPageConst.AddFriend)}
                >
                    <Icon28PersonAdd/>
                </IconButton>)
            }
        />
    );
}