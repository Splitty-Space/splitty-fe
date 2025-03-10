import {useCallback, FC} from "react";
import {Avatar, Tabbar} from "@telegram-apps/telegram-ui";
import {Icon24Group, Icon24Person, Icon24Stats, PlusIcon} from "@/Icons";
import {useTranslation} from "react-i18next";
import {usePathname, useRouter} from "next/navigation";
import {TabIds} from "@/const/tabIds";
import useMe from "@/services/useMe";
import {Friend} from "@/entities";
import {hapticFeedback, ImpactHapticFeedbackStyle} from "@telegram-apps/sdk";
import {account, activity, addExpense, expenseParticipants, friend, friendsList, groups} from "@/const/urls";
import "./footer.css";

interface Tab {
    id: number;
    path: string;
    text?: string;
    Icon: FC<{ fill: string }>;
}

export default function Footer({
                                   friends,
                                   selectedUserId,
                                   setSelectedUserId,
                                   setSelectedFriends,
                                   setSearchValue,
                                   setSelectedExpense,
                               }: {
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
            path: friendsList,
            text: t("footer.Friends"),
            Icon: ({fill}: { fill: string }) => <Icon24Person fill={fill}/>
        },
        {
            id: TabIds.Groups,
            path: groups,
            text: t("footer.Groups"),
            Icon: ({fill}: { fill: string }) => <Icon24Group fill={fill}/>
        },
        {
            id: TabIds.AddExpenseParticipants,
            path: expenseParticipants,
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
            path: activity,
            text: t("footer.Activity"),
            Icon: ({fill}: { fill: string }) => <Icon24Stats fill={fill}/>
        },
        {
            id: TabIds.Account,
            path: account,
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

    const router = useRouter();
    const pathname = usePathname();

    const onBarItemClick = useCallback((id: number) => () => {
        if (id === TabIds.AddExpenseParticipants && pathname === friend) {
            const selectedFriend = friends.find(x => x.id === selectedUserId);
            setSelectedFriends([selectedFriend]);
        } else {
            setSelectedFriends([]);
            setSelectedUserId(null);
        }

        setSearchValue("");
        setSelectedExpense(null);

        if (id === TabIds.Friends) {
            router.push(friendsList);
        } else if (id === TabIds.Groups) {
            router.push(groups);
        } else if (id === TabIds.AddExpenseParticipants && pathname === friend) {
            router.push(addExpense);
        } else if (id === TabIds.AddExpenseParticipants) {
            router.push(expenseParticipants);
        } else if (id === TabIds.Activity) {
            router.push(activity);
        } else if (id === TabIds.Account) {
            router.push(account);
        }

        if (hapticFeedback.impactOccurred.isAvailable()) {
            const style = getHapticStyle(id);
            hapticFeedback.impactOccurred(style);
        }
    }, [setSearchValue, setSelectedExpense, friends, setSelectedFriends, selectedUserId, setSelectedUserId, router]);

    return (
        <footer className="footer fixed h-20 w-full">
            <Tabbar className="footer_tabbar pb-6">
                {tabs.map(({
                               id,
                               path,
                               text,
                               Icon
                           }) =>
                    <Tabbar.Item
                        key={id}
                        text={text}
                        selected={path === pathname}
                        onClick={onBarItemClick(id)}
                    >
                        <Icon
                            fill={path === pathname ? "var(--tgui--button_color)" : "var(--tgui--secondary_hint_color)"}/>
                    </Tabbar.Item>)}
            </Tabbar>
        </footer>
    );
}
