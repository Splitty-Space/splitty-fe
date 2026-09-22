"use client"

import {useTranslation} from "react-i18next";
import Header from "@/app/components/header/header";
import Logo from "@/app/components/header/logo";
import {Cell, Divider, List, Text, Title} from "@telegram-apps/telegram-ui";
import {addFriend} from "@/services/addFriend";
import {deleteFriend} from "@/services/deleteFriend";
import {useStore} from "@/app/store";
import useFriends from "@/services/useFriends";
import {friendsList} from "@/const/urls";
import {useRouter} from "next/navigation";
import {popup} from "@telegram-apps/sdk";
import Avatar from "@/app/components/avatar/Avatar";
import Main from "@/app/components/main/main";
import "./friendSettings.css";
import {useRef} from "react";

export default function FriendSettings() {
    const {t} = useTranslation();
    const showError = useStore((state) => state.setIsRequestErrorSnackbarShown);
    const mutationInFlight = useRef(false);

    const searchValue = useStore((state) => state.searchValue);
    const setIsDeleteFriendSnackbarShown = useStore((state) => state.setIsDeleteFriendSnackbarShown);
    const selectedUserId = useStore((state) => state.selectedUserId);
    const {data, refetchFriends} = useFriends(searchValue);
    const friend = data?.data?.find(friend => friend.id === selectedUserId);
    const friends = data?.data;

    const isFriend = !!friends?.find(x => x.id === friend?.id);

    const router = useRouter();

    const openDeleteConfirmPopup = async () => {
        if (popup.open.isAvailable()) {
            const promise = popup.open({
                title: t("friendSettings.ConfirmDelete"),
                message: t("friendSettings.ConfirmMessage"),
                buttons: [
                    // @ts-ignore
                    {type: "cancel", text: t("friendSettings.CancelButton")},
                    {id: "confirm", type: "destructive", text: t("friendSettings.DeleteButton")},
                ]
            });

            const buttonId = await promise;
            if (buttonId === "confirm" && friend && !mutationInFlight.current) {
                mutationInFlight.current = true;
                deleteFriend(friend.id)
                    .then(() => setIsDeleteFriendSnackbarShown(true))
                    .then(async () => {
                        await refetchFriends().catch(() => showError(true));
                        router.push(friendsList);
                    }).catch(() => {
                        mutationInFlight.current = false;
                        showError(true);
                    });
            }
        }
    };

    const onAddFriend = () => {
        if (!friend || mutationInFlight.current) return;
        mutationInFlight.current = true;
        addFriend(friend.id)
            .then(async () => {
                await refetchFriends().catch(() => showError(true));
                router.push(friendsList);
            }).catch(() => {
                mutationInFlight.current = false;
                showError(true);
            });
    };

    return (
        <>
            <Header
                CentralComponent={Logo}
                subHeaderClassName="justify-content-center"
            />

            <Main>
                <div className="flex flex-col items-center justify-center p-4">
                    <Avatar
                        size={96}
                        user_id={friend?.id}
                    />

                    {friend?.name &&
                        <Title
                            level="1"
                            weight="1"
                            className="mt-2"
                        >
                            {friend?.name}
                        </Title>
                    }

                    {friend?.username &&
                        <Text weight="3" className="opacity-50">
                            {"@" + friend?.username}
                        </Text>
                    }
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
            </Main>
        </>
    );
}
