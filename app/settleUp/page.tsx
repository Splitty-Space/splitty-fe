"use client"

import {useTranslation} from "react-i18next";
import {Caption, Cell, Divider, Title} from "@telegram-apps/telegram-ui";
import {Friend} from "@/entities";
import Header from "@/app/components/header/header";
import {useRouter} from "next/navigation";
import {settleUpPayment} from "@/const/urls";
import useSelectedFriend from "@/hooks/useSelectedFriend";
import {SEARCH_PARAMS} from "@/const/searchParams";
import {withSearchParams} from "@/utils/withSearchParams";
import Avatar from "@/app/components/avatar/Avatar";
import Main from "@/app/components/main/main";
import Username from "@/app/components/username/username";
import {AutoSizer, List} from "react-virtualized";
import SkeletonCell from "@/app/components/skeletons/skeletonCell";
import useMe from "@/services/useMe";
import compactNumber from "@/utils/compactNumber";
import classNames from "classnames";
import useContentHeight from "@/hooks/useContentHeight";
import {listAccessibilityProps} from "@/app/components/listAccessibilityProps";
import {Suspense} from "react";

function SettleUp() {
    const {t} = useTranslation();

    const {data: me} = useMe();

    const {friend: selectedFriend} = useSelectedFriend();

    const router = useRouter();

    const onSettleUpPayment = (friend: Friend, currency: string) => () => {
        router.push(withSearchParams(settleUpPayment, {
            [SEARCH_PARAMS.FRIEND_ID]: friend.id,
            [SEARCH_PARAMS.CURRENCY]: currency,
        }));
    };

    const [refContainer, height] = useContentHeight();

    const rowRenderer = ({index, key, style}: { index: number, key: string, style: object }) => {
        const {currency, amount} = selectedFriend?.total[index] || {currency: ""};
        if (!selectedFriend) {
            return (<SkeletonCell key={key} style={style} me={me}/>);
        }

        const {id, name, username} = selectedFriend;

        return (
            <div key={id + currency} style={style} role="listitem">
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

            <Main ref={refContainer}>
                {/* @ts-ignore */}
                <AutoSizer>
                    {({width}) => (
                        // @ts-ignore
                        <List
                            {...listAccessibilityProps}
                            width={width}
                            height={height}
                            rowHeight={68}
                            rowCount={selectedFriend?.total.length || 0}
                            rowRenderer={rowRenderer}
                            overscanRowCount={20}
                        />
                    )}
                </AutoSizer>
            </Main>
        </>);
}

export default function SettleUpRoute() {
    return (
        <Suspense>
            <SettleUp/>
        </Suspense>
    );
}
