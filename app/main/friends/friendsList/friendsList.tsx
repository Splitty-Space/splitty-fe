"use client"

import classNames from "classnames";
import {Avatar, Cell, List, Placeholder, Spinner, Divider} from "@telegram-apps/telegram-ui";
import FriendsHeader from "@/app/main/friends/friendsList/friendsHeader/friendsHeader";
import {Arrow} from "@/Icons";
import {UseFriends} from "@/services/useFriends";
import {subPageConst} from "@/const/subPageConst";
import {useTranslation} from "react-i18next";

export default function FriendsList({
                                        setSubpage,
                                        searchValue,
                                        setSearchValue,
                                        setSelectedUserId,
                                        data,
                                        loading
                                    }: {
    setSubpage: Function,
    searchValue: string,
    setSearchValue: Function,
    setSelectedUserId: Function,
    data: UseFriends["data"],
    loading: boolean
}) {
    const {t} = useTranslation();

    return (
        <>
            <FriendsHeader searchValue={searchValue} setSearchValue={setSearchValue} setSubpage={setSubpage}/>
            <main className={classNames({
                "flex items-center justify-center": loading
            })}>
                {
                    loading ?
                        (<Spinner size="l"/>) :
                        searchValue === "" && data?.data.length === 0 ?
                            (<Placeholder header={t("friendsList.AddFirstFriend")}>
                                <Arrow/>
                            </Placeholder>) :
                            data?.data?.length > 0 ?
                                (
                                    <List className="mb-8">
                                        {data?.data?.map(({id, amount, name, photo_url}) =>
                                            <div key={id}>
                                                <Cell
                                                    subtitle={amount}
                                                    before={<Avatar size={48} src={photo_url}/>}
                                                    // titleBadge={<Badge type="dot"/>}
                                                    // subhead={`Subhead`}
                                                    // description={`Description`}
                                                    // after={<Badge type="number">{x}</Badge>}
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