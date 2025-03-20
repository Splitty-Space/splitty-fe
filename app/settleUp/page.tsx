"use client"

import {useTranslation} from "react-i18next";
import {Caption, Cell, Divider, List, Title} from "@telegram-apps/telegram-ui";
import {Friend} from "@/entities";
import Header from "@/app/components/header/header";
import Logo from "@/app/components/header/logo";
import {useRouter} from "next/navigation";
import {settleUpPayment} from "@/const/urls";
import {useStore} from "@/app/store";
import useFriends from "@/services/useFriends";
import Avatar from "@/app/components/avatar/Avatar";
import Main from "@/app/components/main/main";

export default function SettleUp() {
    const {t} = useTranslation();

    const setSettleUpPaymentInfo = useStore((state) => state.setSettleUpPaymentInfo);
    const searchValue = useStore((state) => state.searchValue);

    const selectedUserId = useStore((state) => state.selectedUserId);
    const {data} = useFriends(searchValue);
    const selectedFriend = data?.data?.find(friend => friend.id === selectedUserId);
    const friends = [selectedFriend];

    const router = useRouter();

    const onSettleUpPayment = (friend: Friend, currency: string) => () => {
        setSettleUpPaymentInfo({friend, currency});
        router.push(settleUpPayment);
    };

    return (
        <>
            <Header
                className="h-32"
                subHeaderClassName="justify-content-center"
                CentralComponent={Logo}
                AfterComponent={<Title className="flex justify-content-center">{t("settleUp.SettleUp")}</Title>}
            />

            <Main className="pt-32">
                <List className="mb-8 px-0">
                    {friends?.map((friend) =>
                        friend?.total.map(({amount, currency}) =>
                            <div key={friend.id + currency}>
                                <Cell
                                    className="friends-list_shrink-0"
                                    before={<Avatar
                                        size={48}
                                        user_id={friend.id}
                                    />}
                                    after={
                                        <div className="flex flex-col">
                                            <Caption
                                                weight="3"
                                                className={Number(amount) > 0 ? "blue" : "red"}>
                                                {`${Number(amount) > 0 ? "owes you" : "you owe"} ${Math.abs(Number(amount))} ${currency}`}
                                            </Caption>
                                        </div>}
                                    onClick={onSettleUpPayment(friend, currency)}
                                >
                                    {friend.name}
                                </Cell>
                                <Divider className="ml-20 border-2"/>
                            </div>))}
                </List>
            </Main>
        </>);
}