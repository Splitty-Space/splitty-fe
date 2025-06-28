import {useCallback, FC} from "react";
import {Tabbar} from "@telegram-apps/telegram-ui";
import {Icon24Group, Icon24Person, Icon24Stats, PlusIcon} from "@/Icons";
import {useTranslation} from "react-i18next";
import {usePathname, useRouter} from "next/navigation";
import {TabIds} from "@/const/tabIds";
import useMe from "@/services/useMe";
import {Friend} from "@/entities";
import {vibration} from "@/utils/vibration";
import {account, activity, addExpense, expenseParticipants, friend, friendsList, groups} from "@/const/urls";
import {focusOnExpenseNameInput} from "@/app/expense/add/focusOnExpenseNameInput";
import Avatar from "@/app/components/avatar/Avatar";
import {useStore} from "@/app/store";
import "./footer.css";
import useDetectKeyboardOpen from "use-detect-keyboard-open";
import classNames from "classnames";

interface Tab {
    id: number;
    path: string;
    text?: string;
    Icon: FC<{ isSelected: boolean }>;
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

    const {data: me} = useMe();

    const getFillColor = (isSelected: boolean) => isSelected ? "var(--tgui--button_color)" : "var(--tgui--secondary_hint_color)";

    const setIsGroupComingSoonSnackbarShown = useStore((state) => state.setIsGroupComingSoonSnackbarShown);

    const tabs: Array<Tab> = [
        {
            id: TabIds.Friends,
            path: friendsList,
            text: t("footer.Friends"),
            Icon: ({isSelected}) => <Icon24Person fill={getFillColor(isSelected)}/>
        },
        {
            id: TabIds.Groups,
            path: groups,
            text: t("footer.Groups"),
            Icon: ({isSelected}) => <Icon24Group fill={getFillColor(isSelected)}/>
        },
        {
            id: TabIds.AddExpenseParticipants,
            path: expenseParticipants,
            Icon: ({isSelected}) =>
                <>
                    <PlusIcon
                        id="plus-icon"
                        stroke={isSelected ? "var(--tgui--button_color)" : "var(--tgui--text_color)"}
                        style={{
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
            Icon: ({isSelected}) => <Icon24Stats fill={getFillColor(isSelected)}/>
        },
        {
            id: TabIds.Account,
            path: account,
            text: t("footer.Account"),
            Icon: ({isSelected}) =>
                <Avatar
                    size={24}
                    user_id={me?.id}
                    isSelected={isSelected}
                />
        },
    ];

    const router = useRouter();
    const pathname = usePathname();

    const onBarItemClick = useCallback((id: number) => () => {
        if (id === TabIds.AddExpenseParticipants && pathname === friend) {
            const selectedFriend = friends.find(x => x.id === selectedUserId);
            setSelectedFriends([selectedFriend]);
        } else if (id !== TabIds.Groups) {
            setSelectedFriends([]);
            setSelectedUserId(null);
        }

        if (id !== TabIds.Groups) {
            setSearchValue("");
            setSelectedExpense(null);
        }

        if (id === TabIds.Friends) {
            router.push(friendsList);
        } else if (id === TabIds.Groups) {
            vibration("rigid");
            setIsGroupComingSoonSnackbarShown(true);
        } else if (id === TabIds.AddExpenseParticipants && pathname === friend) {
            router.push(addExpense);
            focusOnExpenseNameInput();
        } else if (id === TabIds.AddExpenseParticipants) {
            router.push(expenseParticipants);
        } else if (id === TabIds.Activity) {
            router.push(activity);
        } else if (id === TabIds.Account) {
            router.push(account);
        }

        if (id !== TabIds.Groups) {
            vibration();
        }
    }, [pathname, setSearchValue, setSelectedExpense, friends, setSelectedFriends, selectedUserId, setSelectedUserId, router]);

    const isKeyboardOpen = useDetectKeyboardOpen(400);

    return (
        <footer className={classNames("footer absolute h-20 w-full", { "hidden": isKeyboardOpen })}>
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
                        <Icon isSelected={path === pathname}/>
                    </Tabbar.Item>)}
            </Tabbar>
        </footer>
    );
}
