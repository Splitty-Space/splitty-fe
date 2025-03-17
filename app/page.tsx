"use client"

import React, {useEffect, useState} from "react";
import classNames from "classnames";
import {useTranslation} from "react-i18next";
import {init} from "@telegram-apps/sdk";
import {useRouter} from "next/navigation";
import {Cell, List, Placeholder, Spinner, Divider, Caption} from "@telegram-apps/telegram-ui";
import Main from "@/app/components/main/main";
import FriendsHeader from "@/app/components/friendsHeader/friendsHeader";
import {Arrow} from "@/Icons";
import {friend} from "@/const/urls";
import {useStore} from "@/app/store";
import useFriends from "@/services/useFriends";
import Avatar from "@/app/components/avatar/Avatar";
import "dayjs/locale/ru";
import "dayjs/locale/uk";
import "./friendsList.css";

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

    return (
        <>
            <FriendsHeader
                searchValue={searchValue}
                setSearchValue={setSearchValue}
                onSearchChange={setIsSearchOpen}
                isSearchDisabled={friends?.length === 0}
            />

            <Main
                center={loadingFriends}
                style={isSearchOpen ? {height: "calc(100% - 8rem)"} : undefined}
                className={classNames({
                    "margin-top-32": isSearchOpen
                })}
            >
                {
                    loadingFriends ?
                        (<Spinner size="l"/>) :
                        searchValue === "" && friends?.length === 0 ?
                            (<Placeholder header={t("friendsList.AddFirstFriend")}>
                                <Arrow className="ml-16"/>
                            </Placeholder>) :
                            friends?.length > 0 ?
                                (
                                    <List className="p-0">
                                        {friends?.map(({id, name, username, total}) =>
                                            <div key={id} className="margin-bottom-0">
                                                <Cell
                                                    className="friends-list_shrink-0"
                                                    before={<Avatar
                                                        size={48}
                                                        user_id={id}
                                                    />}
                                                    subtitle={<span
                                                        className={classNames("text-ellipsis overflow-hidden", {
                                                            "invisible": !username
                                                        })}>
                                                         {"@" + username}
                                                    </span>}
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
                                        )
                                        }
                                    </List>)
                                : (<Placeholder header={t("friendsList.FriendNotFound")}/>)
                }
            </Main>
        </>
    );
}