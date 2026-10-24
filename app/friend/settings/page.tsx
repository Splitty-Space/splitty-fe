"use client"

import {useTranslation} from "react-i18next";
import Header from "@/app/components/header/header";
import Logo from "@/app/components/header/logo";
import {Cell, Divider, List, Text, Title} from "@telegram-apps/telegram-ui";
import {deleteFriend} from "@/services/deleteFriend";
import {useStore} from "@/app/store";
import useSelectedFriend from "@/hooks/useSelectedFriend";
import {friendsList} from "@/const/urls";
import {useRouter} from "next/navigation";
import {popup} from "@telegram-apps/sdk";
import Avatar from "@/app/components/avatar/Avatar";
import Main from "@/app/components/main/main";
import "./friendSettings.css";
import {Suspense, useRef} from "react";

function FriendSettings() {
    const {t} = useTranslation();
    const showError = useStore((state) => state.setIsRequestErrorSnackbarShown);
    const mutationInFlight = useRef(false);

    const setIsDeleteFriendSnackbarShown = useStore((state) => state.setIsDeleteFriendSnackbarShown);
    const {refetchFriends, friend} = useSelectedFriend();

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
                        // Back must not return to the deleted friend. The hook replaces to the same URL too.
                        router.replace(friendsList);
                    }).catch(() => {
                        mutationInFlight.current = false;
                        showError(true);
                    });
            }
        }
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

                {friend &&
                    <List>
                        <Cell
                            className="friendSettings_delete"
                            onClick={openDeleteConfirmPopup}
                        >
                            Delete from friends
                        </Cell>
                        <Divider/>
                    </List>
                }
            </Main>
        </>
    );
}

export default function FriendSettingsRoute() {
    return (
        <Suspense>
            <FriendSettings/>
        </Suspense>
    );
}
