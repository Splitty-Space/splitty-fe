"use client"

import {useTranslation} from "react-i18next";
import Header from "@/app/components/header/header";
import Logo from "@/app/components/header/logo";
import {Avatar, Cell, Divider, List, Text, Title} from "@telegram-apps/telegram-ui";
import {addFriend} from "@/services/addFriend";
import {deleteFriend} from "@/services/deleteFriend";
import {useStore} from "@/app/store";
import useFriends from "@/services/useFriends";
import {friendsList} from "@/const/urls";
import {useRouter} from "next/navigation";
import "./friendSettings.css";

export default function FriendSettings() {
    const {t} = useTranslation();

    const searchValue = useStore((state) => state.searchValue);
    const setIsDeleteFriendSnackbarShown = useStore((state) => state.setIsDeleteFriendSnackbarShown);
    const selectedUserId = useStore((state) => state.selectedUserId);
    const {data, loadingFriends, refetchFriends} = useFriends(searchValue);
    const friend = data?.data?.find(friend => friend.id === selectedUserId);
    const friends = data?.data;

    const isFriend = !!friends?.find(x => x.id === friend?.id);

    const router = useRouter();

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
                        .then(() => setIsDeleteFriendSnackbarShown(true))
                        .then(() => refetchFriends())
                        .then(() => router.push(friendsList));
                }
            });
    };

    const onAddFriend = () => {
        addFriend(friend?.id)
            .then(() => refetchFriends())
            .then(() => router.push(friendsList));
    };

    return (
        <>
            <Header
                CentralComponent={Logo}
                subHeaderClassName="justify-content-center mt-6"
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
                    {"@" + friend?.username}
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
            </List>
        </>
    );
}