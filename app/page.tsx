"use client"

import React, {useEffect, useRef, useState} from "react";
import classNames from "classnames";
import {useTranslation} from "react-i18next";
import {init} from "@telegram-apps/sdk";
import {useRouter} from "next/navigation";
import {Cell, Placeholder, Spinner, Divider, Caption, Skeleton} from "@telegram-apps/telegram-ui";
import Main from "@/app/components/main/main";
import FriendsHeader from "@/app/components/friendsHeader/friendsHeader";
import {Arrow} from "@/Icons";
import {friend} from "@/const/urls";
import {useStore} from "@/app/store";
import useFriends from "@/services/useFriends";
import Avatar from "@/app/components/avatar/Avatar";
import Username from "@/app/components/username/username";
import {AutoSizer, InfiniteLoader, List} from "react-virtualized";
import "dayjs/locale/ru";
import "dayjs/locale/uk";

// import "@/utils/mockTelegramEnv"; // TODO DO NOT UNCOMMENT

export default function FriendsList() {
    const {t} = useTranslation();
    const router = useRouter();

    const searchValue = useStore((state) => state.searchValue);
    const setSearchValue = useStore((state) => state.setSearchValue);
    const setSelectedUserId = useStore((state) => state.setSelectedUserId);

    const {data, loadingFriends} = useFriends(searchValue);
    const friends = data?.data;

    const [isSearchOpen, setIsSearchOpen] = useState(false);

    useEffect(() => init(), []);

    const pageSize = 25;
    const [rowCount, setRowCount] = useState(pageSize);

    useEffect(() => {
        if (friends) {
            setRowCount(friends?.length);
        }
    }, [friends]);

    const refContainer = useRef(null);
    const [height, setHeight] = useState(0);

    useEffect(() => {
        // @ts-ignore
        setHeight(refContainer.current?.clientHeight);
    }, []);

    const isRowLoaded = ({index}: { index: number }) => {
        return friends && !!friends[index];
    };

    const loadMoreRows = () => {
        return;
    };

    const rowRenderer = ({index, key, style}: { index: number, key: string, style: object }) => {
        const _friend = friends[index];
        if (!_friend) {
            return (
                <Skeleton visible withoutAnimation key={key} style={style} className="red">
                    <Cell> </Cell>
                </Skeleton>);
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
                    after={<div className="flex flex-col items-end">
                        {total.slice(0, 2).map(({amount, currency}, index) =>
                            <Caption
                                key={index}
                                weight="3"
                                className={Number(amount) > 0 ? "blue" : "red"}
                            >
                                {`${Number(amount) > 0 ? "owes you" : "you owe"} ${Math.abs(Number(amount))} ${currency}`}
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

    return (
        <>
            <FriendsHeader
                searchValue={searchValue}
                setSearchValue={setSearchValue}
                onSearchChange={setIsSearchOpen}
                isSearchDisabled={friends?.length === 0}
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
                    <Spinner size="l" className="flex flex-col items-center justify-center"/> :
                    searchValue === "" && friends?.length === 0 ?
                        (<Placeholder header={t("friendsList.AddFirstFriend")}>
                            <Arrow className="ml-16"/>
                        </Placeholder>) :
                        // @ts-ignore
                        (<InfiniteLoader
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
                                                className="pb-20"
                                            />
                                        )}
                                    </AutoSizer>
                                )}
                        </InfiniteLoader>)
                }
            </Main>
        </>
    );
}