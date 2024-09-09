"use client"

import React, {useState} from "react";
import classNames from "classnames";
import {useTranslation} from "react-i18next";
import {Avatar, Cell, Input, List, Placeholder, Spinner, Tappable} from "@telegram-apps/telegram-ui";
import {Icon24Close, Icon24Search} from "@/Icons";
import {useSearchFriends} from "@/services/useSearchFriends";
import {addFriend} from "@/services/addFriend";
import {subPageConst} from "@/const/subPageConst";
import {RefetchFunction} from "axios-hooks";

export default function AddFriend({refetchFriends, setSubpage}: {
    refetchFriends: RefetchFunction<any, any>,
    setSubpage: Function
}) {
    const {t} = useTranslation();
    const [searchValue, setSearchValue] = useState("");

    const {data, loading, error} = useSearchFriends(searchValue);

    const onSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
        setSearchValue(e.target.value);
    }

    const clearSearch = () => {
        setSearchValue("");
    }

    const onAddFriend = (userId: number) => () =>
        addFriend(userId)
            .then(() => refetchFriends())
            .then(() => setSubpage(subPageConst.FriendsList));

    return (
        <div>
            <div className="p-4">
                <Input
                    value={searchValue}
                    placeholder={t("addFriends.Search")}
                    status="focused"
                    onChange={onSearch}
                    before={<Icon24Search/>}
                    after={
                        <Tappable
                            Component="div"
                            onClick={clearSearch}
                        >
                            <Icon24Close/>
                        </Tappable>}
                />
            </div>

            {searchValue !== "" && data && data?.data?.length > 0 && !error ?
                (<List className="mb-8">
                    {data?.data?.map(({id, name, username, photo_url}: {
                        id: number, name: string, username: string, photo_url: string
                    }) =>
                        <Cell
                            key={id}
                            subtitle={username}
                            onClick={onAddFriend(id)}
                            before={<Avatar size={48} src={photo_url}/>}
                        >
                            {name}
                        </Cell>)
                    }
                </List>)
                : loading ? (
                        <div className={classNames({
                            " flex items-center justify-center": loading
                        })}>
                            <Spinner size="l"/>
                        </div>
                    ) :
                    (<Placeholder
                        header={t("addFriends.NoResults")}
                    >
                        {/*<Image*/}
                        {/*    src="https://xelene.me/telegram.gif" // TODO make another img*/}
                        {/*    alt="Picture of no results"*/}
                        {/*    width={100}*/}
                        {/*/>*/}
                    </Placeholder>)}
        </div>
    );
}