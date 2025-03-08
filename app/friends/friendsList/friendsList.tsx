"use client"

import {useTranslation} from "react-i18next";
import {Avatar, Cell, List, Placeholder, Spinner, Divider, Caption} from "@telegram-apps/telegram-ui";
import Main from "@/app/main/main/main";
import FriendsHeader from "@/app/friends/friendsList/friendsHeader/friendsHeader";
import {subPageConst} from "@/const/subPageConst";
import {Friend} from "@/entities";
import {Arrow} from "@/Icons";
import "./friendsList.css";
import {useState} from "react";
import classNames from "classnames";

export default function FriendsList({
                                        setSubpage,
                                        searchValue,
                                        setSearchValue,
                                        setSelectedUserId,
                                        friends,
                                        loadingFriends
                                    }: {
    setSubpage: Function,
    searchValue: string,
    setSearchValue: Function,
    setSelectedUserId: Function,
    friends: Friend[],
    loadingFriends: boolean
}) {
    const {t} = useTranslation();

    const [isSearchOpen, setIsSearchOpen] = useState(false);

    return (
        <>
            <FriendsHeader searchValue={searchValue} setSearchValue={setSearchValue} onSearchChange={setIsSearchOpen}/>

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
                                        {friends?.map(({id, name, username, photo_url, total}) =>
                                            <div key={id} className="margin-bottom-0">
                                                <Cell
                                                    className="friends-list_shrink-0"
                                                    before={<Avatar size={48} src={photo_url}/>}
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
                                                        setSubpage(subPageConst.Friend);
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