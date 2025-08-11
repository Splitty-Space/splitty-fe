"use client"

import {useCallback} from "react";
import useMe from "@/services/useMe";
import {useTranslation} from "react-i18next";
import HeaderWithSearch from "@/app/components/header/headerWithSearch";
import {Icon28PersonAdd} from "@/Icons";
import {IconButton} from "@telegram-apps/telegram-ui";
import {shareMessage} from "@telegram-apps/sdk";
import {useStore} from "@/app/store";

export default function FriendsHeader({searchValue, setSearchValue, onSearchChange, isSearchDisabled}: {
    searchValue: string,
    setSearchValue: Function,
    onSearchChange: Function,
    isSearchDisabled: boolean,
}) {
    const {t} = useTranslation();
    const {data: me} = useMe();

    const setIsFriendRequestSentSnackbarShown = useStore((state) => state.setIsFriendRequestSentSnackbarShown);

    const shareSplitty = useCallback(async () => {
        if (shareMessage.isAvailable()) {
            await shareMessage(`https://t.me/splitty_fe_bot?start=${me.referral_code}\n${t("friend.AddFriendMessage")}`);
        }
    }, [me, t]);

    global.window && window.addEventListener("message", (...data) => {
        console.log("message");
        console.log(data);
    });

    global.window && window.addEventListener("shareMessageSent", (...data) => {
        console.log("shareMessageSent");
        console.log(data);
        setIsFriendRequestSentSnackbarShown(true);
    });

    const RightComponent = useCallback(() => (
        <IconButton
            size="l"
            mode="bezeled"
            onClick={shareSplitty}
            id="share-button"
        >
            <Icon28PersonAdd/>
        </IconButton>), [shareSplitty]);

    return (
        <HeaderWithSearch
            layoutClassName="pt-0"
            isSearchDisabled={isSearchDisabled}
            searchValue={searchValue}
            setSearchValue={setSearchValue}
            onSearchChange={onSearchChange}
            RightComponent={RightComponent}
        />
    );
}
