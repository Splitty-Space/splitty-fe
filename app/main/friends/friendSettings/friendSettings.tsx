"use client"

import {useTranslation} from "react-i18next";
import {Friend} from "@/entities";
import Header from "@/app/main/header/header";
import Logo from "@/app/main/header/logo";
import {Avatar, Cell, Divider, List, Text, Title} from "@telegram-apps/telegram-ui";
import "./friendSettings.css";
import {addFriend} from "@/services/addFriend";
import {deleteFriend} from "@/services/deleteFriend";

export default function FriendSettings({friend, friends}: { friend?: Friend, friends: Friend[] }) {
    const {t} = useTranslation();

    const isFriend = !!friends.find(x => x.id === friend?.id);

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
                            onClick={() => {
                                deleteFriend(friend?.id);
                            }}
                        >
                            Delete from friends
                        </Cell>
                        <Divider/>
                    </>)
                    :
                    (<>
                        <Cell
                            onClick={() => {
                                addFriend(friend?.id);
                            }}
                        >
                            Add friend
                        </Cell>
                        <Divider/>
                    </>)
                }

                <Cell onClick={() => {

                }}
                >
                    Block user
                </Cell>
                <Divider/>

                <Cell onClick={() => {

                }}
                >
                    Report
                </Cell>
                <Divider/>
            </List>
        </>
    );
}