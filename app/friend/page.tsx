"use client"

import {useState, useEffect, useRef} from "react";
import {useTranslation} from "react-i18next";
import {
    AvatarStack,
    Button,
    Caption,
    Cell,
    Divider,
    IconButton,
    Spinner,
    Skeleton,
    Text,
    Placeholder,
    Headline
} from "@telegram-apps/telegram-ui";
import {AutoSizer, InfiniteLoader, List} from "react-virtualized";
import {Icon28Edit} from "@telegram-apps/telegram-ui/dist/icons/28/edit";
import getExpenses from "@/services/getExpenses";
import {Expense} from "@/entities";
import {Arrow} from "@/Icons";
import useMe from "@/services/useMe";
import {formatDate} from "@/utils/formatDate";
import Main from "@/app/components/main/main";
import {useRouter} from "next/navigation";
import {expenseDetails, friendSettings, settleUp} from "@/const/urls";
import useFriends from "@/services/useFriends";
import {useStore} from "@/app/store";
import Avatar from "@/app/components/avatar/Avatar";


export default function FriendPage() {
    const {t} = useTranslation();

    const {data: me} = useMe();

    const searchValue = useStore((state) => state.searchValue);
    const selectedUserId = useStore((state) => state.selectedUserId);
    const {data} = useFriends(searchValue);
    const friend = data?.data?.find(friend => friend.id === selectedUserId);
    const setSelectedExpense = useStore((state) => state.setSelectedExpense);

    const limit = 25;
    const [rowCount, setRowCount] = useState(limit);
    const [expenses, setExpenses] = useState<Expense[]>([]);
    const [loadingExpenses, setLoadingExpenses] = useState(true);

    const refContainer = useRef(null);
    const refHeader = useRef(null);
    const [height, setHeight] = useState(0)

    useEffect(() => {
        // @ts-ignore
        setHeight(refContainer.current?.clientHeight - refHeader.current.clientHeight);
    }, []);

    useEffect(() => {
        const controller = new AbortController();

        getExpenses({
            page: 1,
            limit: limit,
            friend_id: friend?.id,
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
            console.error({error});
        });

        return () => {
            controller.abort();
        }
    }, [friend]);

    const isRowLoaded = ({index}: { index: number }) => {
        return expenses && !!expenses[index];
    };

    const loadMoreRows = ({startIndex}: { startIndex: number }) => {
        if (!Number.isInteger(startIndex / limit)) {
            return;
        }

        getExpenses({
            page: startIndex / limit + 1,
            limit: limit,
            friend_id: friend?.id,
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

    const router = useRouter();

    const onSettleUp = () => {
        router.push(settleUp);
    };

    const rowRenderer = ({index, key, style}: { index: number, key: string, style: object }) => {
        const expense = expenses[index];
        if (!expense) {
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
            payment,
            date,
            expense_users,
        } = expense;

        const _owe = Number(owe);
        const _owes = Number(owes);
        const _amount = Number(amount);

        const borrowers = transactions.reduce((ids, {amount, borrower}) => {
            const amountNumber = Number(amount);
            // @ts-ignore
            if (ids[borrower.id]) {
                // @ts-ignore
                ids[borrower.id] = ids[borrower.id] + amountNumber;
            } else {
                // @ts-ignore
                ids[borrower.id] = amountNumber;
            }

            return ids;
        }, {});

        const borrowersAmount = Object.keys(borrowers).length;

        let whoPaid;
        if (borrowersAmount === 1) {
            // @ts-ignore
            if (borrowers[me.id]) {
                whoPaid = "You";
            } else {
                whoPaid = transactions[0].borrower.name;
            }
        } else {
            whoPaid = `${borrowersAmount} people`;
        }

        const payerName = expense_users.find(({user}) => user.id !== me.id)?.user.name;

        const participants = expense_users
            .filter(x => Number(x.lent_amount) > 0)
            .map(expense_user => expense_user.user)
            .slice(0, 3);
        const avatarSize = participants.length === 1 ? 48 : participants.length <= 2 ? 28 : 24;

        return (
            <div key={key} style={style}>
                <Cell
                    className="friends-list_shrink-0"
                    subtitle={formatDate(date)}
                    before={
                        <AvatarStack>
                            {participants.map((participant, index, array) =>
                                <Avatar
                                    size={avatarSize}
                                    key={participant.id}
                                    user_id={participant.id}
                                    style={{
                                        marginLeft: index > 0 ? Math.max(-0.25 * array.length, -2.5) + "rem" : 0
                                    }}
                                />)}
                        </AvatarStack>}
                    after={
                        <div className="flex flex-col items-end">
                            {payment ?
                                <Text
                                    key="payment"
                                    weight="3"
                                    className={_owe === 0 ? "green" : "red"}
                                >
                                    {`${_owe === 0 ? "+" : "-"}${_amount} ${currency}`}
                                </Text> :
                                <>
                                    <div className="flex">
                                        <Caption weight="3" className="max-w-16 pr-0.5 overflow-hidden text-ellipsis">
                                            {whoPaid}
                                        </Caption>
                                        <Caption
                                            key="N people paid"
                                            weight="3"
                                        >
                                            {` ${t("friendPage.Paid")} ${_amount} ${currency}`}
                                        </Caption>
                                    </div>

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
                        setSelectedExpense(expense);
                        router.push(expenseDetails);
                    }}
                >
                    {payment ? _owe !== 0 ?
                            `${t("friendPage.You")} ${t("friendPage.Paid")} ${payerName}` :
                            `${payerName} ${t("friendPage.Paid")} ${t("friendPage.you")}` :
                        description}
                </Cell>
                <Divider className="ml-16 border-2"/>
            </div>
        );
    };

    return (
        <>
            <div
                ref={refHeader}
                className="flex flex-col items-center justify-center p-4 pt-8"
            >
                <IconButton
                    size="l"
                    mode="bezeled"
                    className="absolute top-4 right-4"
                    onClick={() => {
                        router.push(friendSettings);
                    }}
                >
                    <Icon28Edit/>
                </IconButton>

                <Avatar
                    size={96}
                    user_id={friend?.id}
                />

                <Headline
                    weight="3"
                    className="mt-2 max-w-full overflow-hidden text-ellipsis"
                >
                    {friend?.name}
                </Headline>


                {friend?.total.map(({amount, currency}) =>
                    <Caption
                        key={currency}
                        weight="3"
                        className={`mt-1 ${Number(amount) > 0 ? "blue" : "red"}`}
                    >
                        {`${Number(amount) > 0 ? t("friendPage.OwesYou") : t("friendPage.YouOwe")} ${Math.abs(Number(amount))} ${currency}`}
                    </Caption>
                )}

                {friend && friend?.total?.length > 0 &&
                    <Button
                        size="s"
                        mode="filled"
                        className="mt-4"
                        onClick={onSettleUp}
                    >
                        {t("friend.SettleUp")}
                    </Button>
                }
            </div>

            <Main
                ref={refContainer}
                className="padding-top-0"
                style={{height: "calc(100% - 4rem)"}}
            >
                {loadingExpenses ? <Spinner size="l" className="flex flex-col items-center justify-center"/> :
                    expenses?.length > 0 ?
                        // @ts-ignore
                        <InfiniteLoader
                            isRowLoaded={isRowLoaded}
                            // @ts-ignore
                            loadMoreRows={loadMoreRows}
                            rowCount={rowCount}
                        >
                            {({onRowsRendered, registerChild}) => (
                                // @ts-ignore
                                <AutoSizer>
                                    {({width}) => (
                                        // @ts-ignore
                                        <List
                                            ref={registerChild}
                                            width={width}
                                            height={height}
                                            rowHeight={68}
                                            rowCount={rowCount}
                                            rowRenderer={rowRenderer}
                                            onRowsRendered={onRowsRendered}
                                            className="pb-20"
                                        />
                                    )}
                                </AutoSizer>
                            )}
                        </InfiniteLoader>
                        :
                        <div className="flex flex-col items-center justify-center relative">
                            <Placeholder header={t("friend.AddFirstExpense")}/>
                            <Arrow className="rotate-[160deg] "/>
                        </div>
                }
            </Main>
        </>
    );
}