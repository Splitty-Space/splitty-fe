"use client"

import classNames from "classnames";
import {useTranslation} from "react-i18next";
import {Avatar, Cell, List, Placeholder, Spinner, Divider, Caption} from "@telegram-apps/telegram-ui";
import FriendsHeader from "@/app/main/friends/friendsList/friendsHeader/friendsHeader";
import {subPageConst} from "@/const/subPageConst";
import {Friend} from "@/entities";
import {Arrow} from "@/Icons";
import "./friendsList.css";

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

    return (
        <>
            <FriendsHeader searchValue={searchValue} setSearchValue={setSearchValue} setSubpage={setSubpage}/>
            <main className={classNames({
                "flex items-center justify-center": loadingFriends
            })}>
                {
                    loadingFriends ?
                        (<Spinner size="l"/>) :
                        searchValue === "" && friends?.length === 0 ?
                            (<Placeholder header={t("friendsList.AddFirstFriend")}>
                                <Arrow/>
                            </Placeholder>) :
                            friends?.length > 0 ?
                                (
                                    <List className="mb-8">
                                        {friends?.map(({id, amount, name, photo_url, total}) =>
                                            <div key={id}>
                                                <Cell
                                                    className="friends-list_shrink-0"
                                                    subtitle={amount}
                                                    before={<Avatar size={48} src={photo_url}/>}
                                                    after={<div className="flex flex-col">
                                                        {total.slice(0, 2).map(({amount, currency}, index) =>
                                                            <Caption
                                                                key={index}
                                                                weight="3"
                                                                className={Number(amount) > 0 ? "red" : "blue"}>
                                                                {`${Number(amount) > 0 ? "owes you" : "you owe"} ${amount} ${currency}`}
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
                                                <Divider className="ml-20"/>
                                            </div>
                                        )
                                        }
                                    </List>)
                                : (<Placeholder header={t("friendsList.FriendNotFound")}/>)
                }
            </main>
        </>
    );
}