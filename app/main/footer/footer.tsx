"use client"

import {useCallback, FC} from "react";
import {Avatar, Tabbar} from "@telegram-apps/telegram-ui";
import {Icon24Group, Icon24Person, Icon24Stats, PlusIcon} from "@/Icons";
import {useTranslation} from "react-i18next";
import {TabIds} from "@/const/tabIds";
import useMe from "@/services/useMe";
import {subPageConst} from "@/const/subPageConst";
import {Friend} from "@/entities";
import {hapticFeedback, ImpactHapticFeedbackStyle} from "@telegram-apps/sdk";
import "./footer.css";

interface Tab {
    id: number;
    text?: string;
    Icon: FC<{ fill: string }>;
}

export default function Footer({
                                   currentTab,
                                   setCurrentTab,
                                   subpage,
                                   setSubpage,
                                   friends,
                                   selectedUserId,
                                   setSelectedUserId,
                                   setSelectedFriends,
                                   setSearchValue,
                                   setSelectedExpense,
                               }: {
    currentTab: number,
    setCurrentTab: Function,
    subpage: subPageConst,
    setSubpage: Function,
    friends: Friend[],
    selectedUserId: any,
    setSelectedUserId: Function,
    setSelectedFriends: Function,
    setSearchValue: Function,
    setSelectedExpense: Function,
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
            id: TabIds.AddExpenseParticipants,
            Icon: () =>
                <>
                    <PlusIcon style={{
                        position: "absolute",
                        scale: "0.7",
                        top: "-2rem",
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

    const getHapticStyle = (id: number): ImpactHapticFeedbackStyle => {
        switch (id) {
            case TabIds.Friends:
                return "light";
            case TabIds.Groups:
                return "medium";
            case TabIds.AddExpenseParticipants:
                return "heavy";
            case TabIds.Activity:
                return "rigid";
            case TabIds.Account:
                return "soft";
            default:
                return "light";
        }
    };

    const onBarItemClick = useCallback((id: number) => () => {
        if (id === TabIds.AddExpenseParticipants && currentTab === TabIds.Friends && subpage) {
            setCurrentTab(TabIds.AddExpense);

            const selectedFriend = friends.find(x => x.id === selectedUserId);

            setSelectedFriends([selectedFriend]);
        } else {
            setCurrentTab(id);

            setSelectedFriends([]);
            setSelectedUserId(null);
        }

        setSearchValue("");
        setSelectedExpense(null);


        if (id === TabIds.Friends) {
            setSubpage(subPageConst.FriendsList);
        } else if (id === TabIds.Groups) {
            setSubpage(subPageConst.GroupsList);
        } else if (id === TabIds.Activity) {
            setSubpage(subPageConst.ActivityList);
        }

        if (hapticFeedback.impactOccurred.isAvailable()) {
            const style = getHapticStyle(id);
            hapticFeedback.impactOccurred(style);
        }

    }, [currentTab, subpage, setSearchValue, setSelectedExpense, setCurrentTab, friends, setSelectedFriends, selectedUserId, setSelectedUserId, setSubpage]);

    return (
        <footer className="footer fixed h-20 w-full">
            <Tabbar className="footer_tabbar pb-6">
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
