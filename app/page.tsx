"use client"

import {useEffect, useState} from "react";
import classNames from "classnames";
import {useTranslation} from "react-i18next";
import {useRouter} from "next/navigation";
import {AutoSizer, List, type ListRowProps} from "react-virtualized";
import {Button, Placeholder} from "@telegram-apps/telegram-ui";
import TelegramAnalytics from "@telegram-apps/analytics";
import Main from "@/app/components/main/main";
import FriendsHeader from "@/app/components/friendsHeader/friendsHeader";
import FriendRow from "@/app/components/friendRow/friendRow";
import {Arrow} from "@/Icons";
import {friend} from "@/const/urls";
import {useStore} from "@/app/store";
import useFriends from "@/services/useFriends";
import useContentHeight from "@/hooks/useContentHeight";
import Loader from "@/app/components/loader/loader";
import PullToRefresh from "@/app/components/pullToRefresh/pullToRefresh";

export default function FriendsList() {
    const {t} = useTranslation();
    const router = useRouter();
    const searchValue = useStore((state) => state.searchValue);
    const setSearchValue = useStore((state) => state.setSearchValue);
    const setSelectedUserId = useStore((state) => state.setSelectedUserId);
    const {data, loadingFriends, error, refetchFriends} = useFriends(searchValue);
    const friends = data?.data ?? [];
    const [isSearchOpen, setIsSearchOpen] = useState(false);
    const [refContainer, height] = useContentHeight();

    useEffect(() => {
        // Analytics uses SDK v1 and cannot read the SDK v3 development mock.
        if (process.env.NODE_ENV !== "production") {
            return;
        }

        TelegramAnalytics.init({
            token: "eyJhcHBfbmFtZSI6Im5mdTQzNXlodTlpMjAzeTQ4OWYydXlyIiwiYXBwX3VybCI6Imh0dHBzOi8vdC5tZS9zcGxpdHR5X2ZlX2JvdCIsImFwcF9kb21haW4iOiJodHRwczovL2FwcC1zdGFnZS5zcGxpdHR5LmRpZ2l0YWwvIn0=!qpGcOmLOSPp34iL1orYJutbxSlCIvmFy12aulhG6lFM=",
            appName: "nfu435yhu9i203y489f2uyr",
        }).catch((error: unknown) => {
            console.warn("Telegram analytics initialization failed:", error);
        });
    }, []);

    const rowRenderer = ({index, key, style}: ListRowProps) => (
        <FriendRow
            key={key}
            friend={friends[index]}
            style={style}
            onSelect={(id) => {
                setSelectedUserId(id);
                router.push(friend);
            }}
        />
    );

    const onRefresh = async () => {
        await refetchFriends();
    };

    const onRetry = () => {
        void refetchFriends().catch(() => {
            // The hook exposes the failure through `error`.
        });
    };

    let content;
    if (loadingFriends) {
        content = <Loader/>;
    } else if (error) {
        content = (
            <Placeholder header={t("common.RequestFailed")}>
                <Button onClick={onRetry}>{t("friendsList.Retry")}</Button>
            </Placeholder>
        );
    } else if (friends.length === 0) {
        content = (
            <PullToRefresh onRefresh={onRefresh}>
                <div className="flex h-full items-center justify-center">
                    {searchValue === ""
                        ? <Placeholder header={t("friendsList.AddFirstFriend")}><Arrow className="ml-16"/></Placeholder>
                        : <Placeholder header={t("friendsList.FriendNotFound")}/>}
                </div>
            </PullToRefresh>
        );
    } else {
        content = (
            <PullToRefresh onRefresh={onRefresh}>
                <AutoSizer disableHeight>
                    {({width}) => (
                        <List
                            key={searchValue}
                            width={width}
                            height={height}
                            rowHeight={68}
                            rowCount={friends.length}
                            rowRenderer={rowRenderer}
                            overscanRowCount={20}
                        />
                    )}
                </AutoSizer>
            </PullToRefresh>
        );
    }

    return (
        <>
            <FriendsHeader
                searchValue={searchValue}
                setSearchValue={setSearchValue}
                onSearchChange={setIsSearchOpen}
                isSearchDisabled={friends.length === 0 && searchValue === ""}
            />
            <Main
                ref={refContainer}
                center={loadingFriends || !!error || friends.length === 0}
                style={isSearchOpen ? {height: "calc(100% - 4rem)"} : undefined}
                className={classNames({"margin-top-16": isSearchOpen})}
            >
                {content}
            </Main>
        </>
    );
}
