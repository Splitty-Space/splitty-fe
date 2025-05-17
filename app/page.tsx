"use client"

import React, {useEffect, useState} from "react";
import classNames from "classnames";
import {useTranslation} from "react-i18next";
import {init} from "@telegram-apps/sdk";
import {useRouter} from "next/navigation";
import {Cell, Placeholder, Divider, Caption} from "@telegram-apps/telegram-ui";
import Main from "@/app/components/main/main";
import FriendsHeader from "@/app/components/friendsHeader/friendsHeader";
import {Arrow} from "@/Icons";
import {friend} from "@/const/urls";
import {useStore} from "@/app/store";
import useFriends from "@/services/useFriends";
import Avatar from "@/app/components/avatar/Avatar";
import Username from "@/app/components/username/username";
import compactNumber from "@/utils/compactNumber";
import SkeletonCell from "@/app/components/skeletons/skeletonCell";
import useMe from "@/services/useMe";
import {defaultPageSize} from "@/const/defaultPageSize";
import {AutoSizer, InfiniteLoader, List} from "react-virtualized";
import useContentHeight from "@/hooks/useContentHeight";
import Loader from "@/app/components/loader/loader";
import PullToRefresh from "@/app/components/pullToRefresh/pullToRefresh";
import useAuth from "@/hooks/useAuth";
import "dayjs/locale/ru";
import "dayjs/locale/uk";

// import "@/utils/mockTelegramEnv"; // TODO DO NOT UNCOMMENT

export default function FriendsList() {
    const {t} = useTranslation();
    const router = useRouter();

    const {data: me} = useMe();

    const searchValue = useStore((state) => state.searchValue);
    const setSearchValue = useStore((state) => state.setSearchValue);
    const setSelectedUserId = useStore((state) => state.setSelectedUserId);

    const {data, loadingFriends, refetchFriends} = useFriends(searchValue);
    const friends = data?.data;

    const [isSearchOpen, setIsSearchOpen] = useState(false);

    useEffect(() => init(), []);

    useAuth();

    const [rowCount, setRowCount] = useState(defaultPageSize);

    useEffect(() => {
        if (friends) {
            setRowCount(friends?.length);
        }
    }, [friends]);

    const [refContainer, height] = useContentHeight();

    const isRowLoaded = ({index}: { index: number }) => {
        return friends && !!friends[index];
    };

    const loadMoreRows = () => {
        return;
    };

    const rowRenderer = ({index, key, style}: { index: number, key: string, style: object }) => {
        const _friend = friends[index];
        if (!_friend) {
            return (<SkeletonCell key={key} style={style} me={me}/>);
        }

        const {id, name, username, total} = _friend;

        return (
            <div key={id} style={style}>
                <Cell
                    className="friends-list_shrink-0"
                    before={<Avatar
                        size={48}
                        user_id={id}
                    />}
                    subtitle={<Username username={username}/>}
                    after={<div className="flex flex-col items-end max-w-full">
                        {total.slice(0, 2).map(({amount, currency}, index) =>
                            <Caption
                                key={index}
                                weight="3"
                                className={classNames("max-w-full text-ellipsis overflow-hidden", {
                                    "blue": Number(amount) > 0,
                                    "red": Number(amount) < 0,
                                })}
                            >
                                {`${Number(amount) > 0 ? "owes you" : "you owe"} ${compactNumber(Math.abs(Number(amount)))} ${currency}`}
                            </Caption>)
                        }
                    </div>}
                    onClick={() => {
                        setSelectedUserId(id);
                        router.push(friend);
                    }}
                >
                    {name}
                </Cell>
                <Divider className="ml-20 border-2"/>
            </div>
        );
    };

    const onRefresh = () => {
        return refetchFriends();
    };

    return (
        <>
            <FriendsHeader
                searchValue={searchValue}
                setSearchValue={setSearchValue}
                onSearchChange={setIsSearchOpen}
                isSearchDisabled={friends?.length === 0 && searchValue === ""}
            />

            <Main
                ref={refContainer}
                center={loadingFriends}
                style={isSearchOpen ? {height: "calc(100% - 4rem)"} : undefined}
                className={classNames({
                    "margin-top-16": isSearchOpen
                })}
            >
                {loadingFriends ?
                    <Loader/> :
                    searchValue === "" && friends?.length === 0 ?
                        (<Placeholder header={t("friendsList.AddFirstFriend")}>
                            <Arrow className="ml-16"/>
                        </Placeholder>) :
                        (<PullToRefresh onRefresh={onRefresh}>
                                {/* @ts-ignore */}
                                <InfiniteLoader
                                    isRowLoaded={isRowLoaded}
                                    // @ts-ignore
                                    loadMoreRows={loadMoreRows}
                                    rowCount={rowCount}
                                >
                                    { // @ts-ignore
                                        ({onRowsRendered, registerChild}) => (
                                            // @ts-ignore
                                            <AutoSizer>
                                                {({width}) => (
                                                    // @ts-ignore
                                                    <List
                                                        ref={registerChild}
                                                        width={width}
                                                        height={height}
                                                        rowHeight={68}
                                                        rowCount={friends?.length}
                                                        rowRenderer={rowRenderer}
                                                        onRowsRendered={onRowsRendered}
                                                        overscanRowCount={20}
                                                    />
                                                )}
                                            </AutoSizer>
                                        )}
                                </InfiniteLoader>
                            </PullToRefresh>
                        )
                }
            </Main>
        </>
    );
}