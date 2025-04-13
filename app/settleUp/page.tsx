"use client"

import React from "react";
import {useTranslation} from "react-i18next";
import {Caption, Cell, Divider, Title} from "@telegram-apps/telegram-ui";
import {Friend} from "@/entities";
import Header from "@/app/components/header/header";
import {useRouter} from "next/navigation";
import {settleUpPayment} from "@/const/urls";
import {useStore} from "@/app/store";
import useFriends from "@/services/useFriends";
import Avatar from "@/app/components/avatar/Avatar";
import Main from "@/app/components/main/main";
import Username from "@/app/components/username/username";
import {AutoSizer, List} from "react-virtualized";
import SkeletonCell from "@/app/components/skeletons/skeletonCell";
import useMe from "@/services/useMe";
import compactNumber from "@/utils/compactNumber";
import classNames from "classnames";
import useContentHeight from "@/hooks/useContentHeight";

export default function SettleUp() {
    const {t} = useTranslation();

    const {data: me} = useMe();

    const setSettleUpPaymentInfo = useStore((state) => state.setSettleUpPaymentInfo);
    const searchValue = useStore((state) => state.searchValue);

    const selectedUserId = useStore((state) => state.selectedUserId);
    const {data} = useFriends(searchValue);
    const selectedFriend = data?.data?.find(friend => friend.id === selectedUserId);

    const router = useRouter();

    const onSettleUpPayment = (friend: Friend, currency: string) => () => {
        setSettleUpPaymentInfo({friend, currency});
        router.push(settleUpPayment);
    };

    const [ref, height] = useContentHeight();

    const rowRenderer = ({index, key, style}: { index: number, key: string, style: object }) => {
        const {currency, amount} = selectedFriend?.total[index] || {currency: ""};
        if (!selectedFriend) {
            return (<SkeletonCell key={key} style={style} me={me}/>);
        }

        const {id, name, username} = selectedFriend;

        return (
            <div key={id + currency} style={style}>
                <Cell
                    className="friends-list_shrink-0"
                    before={<Avatar
                        size={48}
                        user_id={id}
                    />}
                    subtitle={<Username username={username}/>}
                    after={
                        <div className="flex flex-col">
                            <Caption
                                weight="3"
                                className={Number(amount) > 0 ? "blue" : "red"}>
                                {`${Number(amount) > 0 ? "owes you" : "you owe"} ${compactNumber(Math.abs(Number(amount)))} ${currency}`}
                            </Caption>
                        </div>}
                    onClick={onSettleUpPayment(selectedFriend, currency)}
                >
                    {name}
                </Cell>
                <Divider className="ml-20 border-2"/>
            </div>
        );
    };

    return (
        <>
            <Header
                subHeaderClassName="justify-content-center"
                CentralComponent={({className}) =>
                    <Title
                        className={classNames(className, "flex justify-content-center")}>
                        {t("settleUp.SettleUp")}
                    </Title>
                }
            />

            <Main ref={ref}>
                {/* @ts-ignore */}
                <AutoSizer>
                    {({width}) => (
                        // @ts-ignore
                        <List
                            width={width}
                            height={height}
                            rowHeight={68}
                            rowCount={selectedFriend?.total.length || 0}
                            rowRenderer={rowRenderer}
                            overscanRowCount={20}
                            className="pb-20"
                        />
                    )}
                </AutoSizer>
            </Main>
        </>);
}