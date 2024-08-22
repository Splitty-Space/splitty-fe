"use client"

import {useCallback, FC} from "react";
import {Avatar, Tabbar} from "@telegram-apps/telegram-ui";
import {Icon24Group, Icon24Person, Icon24Stats, AddIcon, PlusIcon} from "@/Icons";
import {useTranslation} from "react-i18next";
import {TabIds} from "@/const/tabIds";
import "./footer.css";
import useMe from "@/services/useMe";
import {subPageConst} from "@/const/subPageConst";

interface Tab {
    id: number;
    text?: string;
    Icon: FC<{ fill: string }>;
}

export default function Footer({currentTab, setCurrentTab, setSubpage}: {
    currentTab: number,
    setCurrentTab: Function,
    setSubpage: Function
}) {
    const {t} = useTranslation();

    const {data} = useMe();

    const tabs: Array<Tab> = [
        {
            id: TabIds.Friends,
            text: t("footer.Friends"),
            Icon: ({fill}: { fill: string }) => <Icon24Person fill={fill}/>
        },
        {
            id: TabIds.Groups,
            text: t("footer.Groups"),
            Icon: ({fill}: { fill: string }) => <Icon24Group fill={fill}/>
        },
        {
            id: TabIds.AddExpense,
            Icon: ({fill}: { fill: string }) =>
                <>
                    <AddIcon fill={fill} style={{
                        scale: "1.5",
                        position: "absolute",
                        top: "0"
                    }}/>
                    <PlusIcon fill={fill} style={{
                        scale: "1.5",
                        position: "absolute",
                        top: "1rem"
                    }}/>
                </>
        },
        {
            id: TabIds.Activity,
            text: t("footer.Activity"),
            Icon: ({fill}: { fill: string }) => <Icon24Stats fill={fill}/>
        },
        {
            id: TabIds.Account,
            text: t("footer.Account"),
            Icon: () =>
                <Avatar
                    size={24}
                    src={data?.photo_url}
                />
        },
    ];

    const onBarItemClick = useCallback((id: number) => () => {
        setCurrentTab(id);

        if (id === TabIds.Friends) {
            setSubpage(subPageConst.FriendsList);
        } else if (id === TabIds.Groups) {
            setSubpage(subPageConst.GroupsList);
        }
    }, [setCurrentTab, setSubpage]);

    return (
        <footer className="h-8">
            <Tabbar style={{backgroundColor: "var(--tgui--bg_color)", paddingBottom: "1rem", marginBottom: "-0.25rem"}}>
                {tabs.map(({
                               id,
                               text,
                               Icon
                           }) =>
                    <Tabbar.Item
                        key={id}
                        text={text}
                        selected={id === currentTab}
                        onClick={onBarItemClick(id)}
                    >
                        <Icon
                            fill={id === currentTab ? "var(--tgui--button_color)" : "var(--tgui--secondary_hint_color)"}/>
                    </Tabbar.Item>)}
            </Tabbar>
        </footer>
    );
}
