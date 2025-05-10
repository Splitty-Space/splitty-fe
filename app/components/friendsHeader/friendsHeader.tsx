"use client"

import {useCallback} from "react";
import useMe from "@/services/useMe";
import {useTranslation} from "react-i18next";
import HeaderWithSearch from "@/app/components/header/headerWithSearch";
import {Icon28PersonAdd} from "@/Icons";
import {IconButton} from "@telegram-apps/telegram-ui";
import {shareURL} from "@telegram-apps/sdk";
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

    const shareSplitty = useCallback(() => {
        if (shareURL.isAvailable()) {
            shareURL(
                `https://t.me/splitty_fe_bot?start=${me.referral_code}`,
                t("friend.AddFriendMessage"));

            setTimeout(() =>
                    setIsFriendRequestSentSnackbarShown(true),
                3000);
        }
    }, [me, setIsFriendRequestSentSnackbarShown, t]);

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