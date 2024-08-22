"use client"

import {useTranslation} from "react-i18next";
import {Avatar, Button, IconButton, LargeTitle, Title} from "@telegram-apps/telegram-ui";
import {Icon28Edit} from "@telegram-apps/telegram-ui/dist/icons/28/edit";
import {subPageConst} from "@/const/subPageConst";
import {Friend} from "@/entities";
import {Arrow} from "@/Icons";

export default function FriendPage({friend, setSubpage}: { friend?: Friend, setSubpage: Function }) {
    const {t} = useTranslation();

    return (
        <div className="flex flex-col items-center justify-center p-4 pt-8">
            <IconButton
                size="l"
                mode="bezeled"
                className="absolute top-4 right-4"
                onClick={() => {
                    setSubpage(subPageConst.FriendSettings)
                }}
            >
                <Icon28Edit/>
            </IconButton>

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

            <Button
                size="s"
                mode="filled"
                className="mt-4"
            >
                {t("friend.SettleUp")}
            </Button>

            <div className="flex flex-col mt-80 relative">
                <LargeTitle weight="3">{t("friend.AddFirstExpense")}</LargeTitle>

                <Arrow className="rotate-[160deg] absolute left-24 top-12"/>
            </div>

            {/* TODO add expanse list */}

        </div>
    );
}