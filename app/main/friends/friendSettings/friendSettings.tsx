"use client"

import {useTranslation} from "react-i18next";
import {RefetchFunction} from "axios-hooks";
import {Friend} from "@/entities";
import Header from "@/app/main/header/header";
import Logo from "@/app/main/header/logo";
import {Avatar, Cell, Divider, List, Text, Title} from "@telegram-apps/telegram-ui";
import {addFriend} from "@/services/addFriend";
import {deleteFriend} from "@/services/deleteFriend";
import {subPageConst} from "@/const/subPageConst";
import "./friendSettings.css";

export default function FriendSettings({friend, friends, refetchFriends, setSubpage, setIsDeleteSnackbarShown}: {
    friend?: Friend,
    friends: Friend[],
    refetchFriends: RefetchFunction<any, any>,
    setSubpage: Function,
    setIsDeleteSnackbarShown: Function,
}) {
    const {t} = useTranslation();

    const isFriend = !!friends.find(x => x.id === friend?.id);

    const openDeleteConfirmPopup = () => {
        Telegram?.WebApp?.showPopup({
                title: t("friendSettings.ConfirmDelete"),
                message: t("friendSettings.ConfirmMessage"),
                buttons: [
                    {type: "cancel", text: t("friendSettings.CancelButton")},
                    {id: "confirm", type: "destructive", text: t("friendSettings.DeleteButton")},
                ]
            },
            function (buttonId: string) {
                if (buttonId === "confirm") {
                    deleteFriend(friend?.id)
                        .then(() => setIsDeleteSnackbarShown(true))
                        .then(() => refetchFriends())
                        .then(() => setSubpage(subPageConst.FriendsList));
                }
            });
    };

    const onAddFriend = () => {
        addFriend(friend?.id)
            .then(() => refetchFriends())
            .then(() => setSubpage(subPageConst.FriendsList));
    };

    return (
        <>
            <Header
                subHeaderClassName="friendSettings_header"
                CentralComponent={Logo}
            />

            <div className="flex flex-col items-center justify-center p-4">
                <Avatar
                    size={96}
                    src={friend?.photo_url}
                />

                <Title
                    level="1"
                    weight="1"
                    className="mt-2"
                >
                    {friend?.name}
                </Title>

                <Text weight="3" className="opacity-50">
                    {friend?.username}
                </Text>
            </div>

            <List>
                {isFriend ?
                    (<>
                        <Cell
                            className="friendSettings_delete"
                            onClick={openDeleteConfirmPopup}
                        >
                            Delete from friends
                        </Cell>
                        <Divider/>
                    </>)
                    :
                    (<>
                        <Cell
                            onClick={onAddFriend}
                        >
                            Add friend
                        </Cell>
                        <Divider/>
                    </>)
                }

                {/* TODO */}
                {/*<Cell onClick={() => {*/}

                {/*}}*/}
                {/*>*/}
                {/*    Block user*/}
                {/*</Cell>*/}
                {/*<Divider/>*/}

                {/*<Cell onClick={() => {*/}

                {/*}}*/}
                {/*>*/}
                {/*    Report*/}
                {/*</Cell>*/}
                {/*<Divider/>*/}
            </List>
        </>
    );
}