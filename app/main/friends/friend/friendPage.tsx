"use client"

import {useState, useEffect, useRef} from "react";
import {useTranslation} from "react-i18next";
import {
    Avatar,
    AvatarStack,
    Button,
    Caption,
    Cell,
    Divider,
    IconButton,
    LargeTitle,
    Spinner,
    Skeleton,
    Title
} from "@telegram-apps/telegram-ui";
import {AutoSizer, InfiniteLoader, List} from "react-virtualized";
import {Icon28Edit} from "@telegram-apps/telegram-ui/dist/icons/28/edit";
import {subPageConst} from "@/const/subPageConst";
import getExpenses from "@/services/getExpenses";
import {Friend, Expense} from "@/entities";
import {Arrow} from "@/Icons";
import useMe from "@/services/useMe";
import {EN} from "@/const/languages";


export default function FriendPage({friend, setSubpage}: { friend: Friend, setSubpage: Function }) {
    const {t} = useTranslation();

    const {data: me} = useMe();

    const limit = 10;
    const [rowCount, setRowCount] = useState(limit);
    const [expenses, setExpenses] = useState<Expense[]>([]);
    const [loadingExpenses, setLoadingExpenses] = useState(true);

    const refContainer = useRef(null);
    const refHeader = useRef(null);
    const [height, setHeight] = useState(0)

    useEffect(() => {
        setHeight(refContainer.current.clientHeight - refHeader.current.clientHeight);
    }, []);

    useEffect(() => {
        const controller = new AbortController();

        getExpenses({
            page: 1,
            limit: limit,
            friend_id: friend.id,
            signal: controller.signal
        }).then(({data}) => {
            setLoadingExpenses(false);
            setExpenses(data.data);

            if (data.meta.has_more) {
                setRowCount(prevState => prevState + limit);
            } else {
                setRowCount(data.data.length);
            }
        }).catch((error) => {
            console.error({error})
        });

        return () => {
            controller.abort();
        }
    }, [friend]);

    const isRowLoaded = ({index}) => {
        return expenses && !!expenses[index];
    };

    const loadMoreRows = ({startIndex}: { startIndex: number }) => {
        if (!Number.isInteger(startIndex / limit)) {
            return;
        }

        getExpenses({
            page: startIndex / limit + 1,
            limit: limit,
            friend_id: friend.id,
        }).then(({data}) => {
            if (data.meta.has_more) {
                setRowCount(prevState => prevState + limit);
            } else {
                setRowCount(expenses.length + data.data.length);
            }

            setExpenses(prevState => [...prevState, ...data.data]);
        }).catch((error) => {
            console.error({error})
        });
    };

    const onSettleUp = () => {
        setSubpage(subPageConst.SettleUp);
    };

    const rowRenderer = ({index, key, style}: { index: number, key: string, style: object }) => {
        if (!expenses[index]) {
            return (
                <Skeleton visible withoutAnimation key={key} style={style} className="red">
                    <Cell> </Cell>
                </Skeleton>);
        }

        const {
            description,
            transactions,
            owe,
            owes,
            amount,
            currency,
            settled,
            date
        } = expenses[index];

        const _owe = Number(owe);
        const _owes = Number(owes);
        const _amount = Number(amount);

        const avatarSize = transactions.length === 1 ? 48 : 28;

        const borrowers = transactions.reduce((ids, {amount, borrower}) => {
            const amountNumber = Number(amount);
            if (ids[borrower.id]) {
                ids[borrower.id] = ids[borrower.id] + amountNumber;
            } else {
                ids[borrower.id] = amountNumber;
            }

            return ids;
        }, {});

        const borrowersAmount = Object.keys(borrowers).length;

        let whoPaid;
        if (borrowersAmount === 1) {
            if (borrowers[me.id]) {
                whoPaid = "You";
            } else {
                whoPaid = transactions[0].borrower.name;
            }
        } else {
            whoPaid = `${borrowersAmount} people`;
        }

        return (
            <div key={key} style={style}>
                <Cell
                    className="friends-list_shrink-0"
                    subtitle={new Intl.DateTimeFormat("en-US", {
                        year: "numeric",
                        month: "numeric",
                        day: "numeric",
                        hour: "numeric",
                        minute: "numeric",
                        hour12: me.language.toUpperCase() === EN,
                    }).format(new Date(date))}
                    before={
                        <AvatarStack>
                            {transactions
                                .reduce((trans, currentValue) => {
                                    if (trans.every(({id}) => id !== currentValue.id)) {
                                        trans.push(currentValue);
                                    }

                                    return trans;
                                }, [])
                                .slice(0, 2)
                                .map(transaction =>
                                    <Avatar
                                        size={avatarSize}
                                        key={transaction.id}
                                        src={transaction.borrower.photo_url}
                                    />)}
                        </AvatarStack>}
                    after={
                        <div className="flex flex-col items-end">
                            {settled ?
                                <Caption
                                    key="settled"
                                    weight="3"
                                >
                                    {`${_amount} ${currency}`}
                                </Caption> :
                                <>
                                    <Caption
                                        key="N people paid"
                                        weight="3"
                                    >
                                        {`${whoPaid} ${t("friendPage.Paid")} ${_amount} ${currency}`}
                                    </Caption>

                                    {_owe !== 0 &&
                                        <Caption
                                            key="borrowed"
                                            weight="3"
                                            className="red"
                                        >
                                            {`${t("friendPage.YouBorrowed")} ${_owe} ${currency}`}
                                        </Caption>
                                    }
                                    {_owes !== 0 &&
                                        <Caption
                                            key="lent"
                                            weight="3"
                                            className="blue"
                                        >
                                            {`${t("friendPage.YouLent")} ${_owes} ${currency}`}
                                        </Caption>
                                    }
                                </>
                            }
                        </div>}
                    onClick={() => {
                        /* TODO open expanse details */
                    }}
                >
                    {description}
                </Cell>
                <Divider className="ml-24"/>
            </div>
        );
    };

    return (
        <div ref={refContainer} style={{height: "calc(100% - 77px)"}}>
            <div
                ref={refHeader}
                className="flex flex-col items-center justify-center p-4 pt-8"
            >
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

                {friend.total.map(({amount, currency}) =>
                    <Caption
                        key={currency}
                        weight="3"
                        className={`mt-1 ${Number(amount) > 0 ? "blue" : "red"}`}
                    >
                        {`${amount} ${currency} ${Number(amount) > 0 ? t("friendPage.OwesYou") : t("friendPage.YouOwe")}`}
                    </Caption>
                )}

                <Button
                    size="s"
                    mode="filled"
                    className="mt-4"
                    onClick={onSettleUp}
                >
                    {t("friend.SettleUp")}
                </Button>
            </div>

            {loadingExpenses ? <Spinner size="l" className="flex flex-col items-center justify-center"/> :
                expenses?.length > 0 ?
                    <InfiniteLoader
                        isRowLoaded={isRowLoaded}
                        loadMoreRows={loadMoreRows}
                        rowCount={rowCount}
                    >
                        {({onRowsRendered, registerChild}) => (
                            <AutoSizer>
                                {({width}) => (
                                    <List
                                        ref={registerChild}
                                        width={width}
                                        height={height}
                                        rowHeight={68}
                                        rowCount={rowCount}
                                        rowRenderer={rowRenderer}
                                        onRowsRendered={onRowsRendered}
                                    />
                                )}
                            </AutoSizer>
                        )}
                    </InfiniteLoader>
                    :
                    <div className="flex flex-col items-center justify-center relative">
                        <LargeTitle weight="3">{t("friend.AddFirstExpense")}</LargeTitle>

                        <Arrow className="rotate-[160deg] absolute left-24 top-12"/>
                    </div>
            }
        </div>
    );
}