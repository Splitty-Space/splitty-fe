"use client"

import {useEffect, useState} from "react";
import {useTranslation} from "react-i18next";
import classNames from "classnames";
import Header from "@/app/components/header/header";
import Main from "@/app/components/main/main";
import {AvatarStack, Caption, Divider, IconButton, Spinner, Text} from "@telegram-apps/telegram-ui";
import {Icon28Edit} from "@telegram-apps/telegram-ui/dist/icons/28/edit";
import {Icon28Bin} from "@/Icons";
import Logo from "@/app/components/header/logo";
import useMe from "@/services/useMe";
import {deleteExpense} from "@/services/deleteExpense";
import getExpense from "@/services/getExpense";
import {useStore} from "@/app/store";
import ExpenseHistoryList from "@/app/expense/details/ExpenseHistoryList";
import useFriends from "@/services/useFriends";
import {useRouter} from "next/navigation";
import {addExpense, settleUpPayment} from "@/const/urls";
import {popup} from "@telegram-apps/sdk";
import Avatar from "@/app/components/avatar/Avatar";
import {formatDateTime} from "@/utils/formatDateTime";
import "./expenseDetails.css";

export default function ExpenseDetails() {
    const {t} = useTranslation();

    const selectedExpense = useStore((state) => state.selectedExpense);
    const setSelectedExpense = useStore((state) => state.setSelectedExpense);
    const setIsDeleteExpenseSnackbarShown = useStore((state) => state.setIsDeleteExpenseSnackbarShown);
    const setSettleUpPaymentInfo = useStore((state) => state.setSettleUpPaymentInfo);

    const {data: me, loading: loadingMe} = useMe();

    const searchValue = useStore((state) => state.searchValue);
    const {data, refetchFriends} = useFriends(searchValue);
    const friends = data?.data;

    const [deleteExpenseLoading, setDeleteExpenseLoading] = useState(false);

    useEffect(() => {
        getExpense({expense_id: selectedExpense?.id})
            .then(({data}) => setSelectedExpense(data));
    }, [selectedExpense?.id, setSelectedExpense]);

    const router = useRouter();

    const expenseDelete = () => {
        if (selectedExpense?.id) {
            setDeleteExpenseLoading(true);
            deleteExpense(selectedExpense.id)
                .then(() => refetchFriends())
                .then(() => {
                    setIsDeleteExpenseSnackbarShown(true);
                    setSelectedExpense(null);
                    router.back();
                });
        }
    };

    const onDelete = async () => {
        if (popup.open.isAvailable()) {
            const promise = popup.open({
                title: t("friendSettings.ConfirmDelete"),
                message: t("expenseDetails.ConfirmMessage"),
                buttons: [
                    // @ts-ignore
                    {type: "cancel", text: t("friendSettings.CancelButton")},
                    {id: "confirm", type: "destructive", text: t("friendSettings.DeleteButton")},
                ]
            });

            const buttonId = await promise;
            if (buttonId === "confirm") {
                expenseDelete();
            }
        }
    };

    const onEdit = () => {
        if (selectedExpense?.payment) {
            const friend = friends.find(({id}) => id === selectedExpense.expense_users.find(({user}) => user.id !== me.id)?.user.id);
            if (friend) {
                setSettleUpPaymentInfo(
                    {
                        friend: friend,
                        currency: selectedExpense.currency,
                    }
                );

                router.push(settleUpPayment);
            }
        } else {
            router.push(addExpense);
        }
    };

    const _owe = Number(selectedExpense?.owe);
    const _amount = Number(selectedExpense?.amount);

    const lents = selectedExpense?.expense_users
        .filter(({lent_amount}) => lent_amount > 0) ?? [];

    return loadingMe ?
        (<Spinner className="flex justify-center " size="l"/>)
        : (
            <>
                <Header
                    layoutClassName="p-0 py-4"
                    LeftComponent={() => deleteExpenseLoading ? (
                        <Spinner className="flex justify-center " size="m"/>) : (
                        <IconButton
                            size="l"
                            mode="bezeled"
                            onClick={onDelete}
                        >
                            <Icon28Bin color={"var(--tgui--destructive_text_color)"}/>
                        </IconButton>
                    )}
                    CentralComponent={Logo}
                    RightComponent={() => (
                        <IconButton
                            size="l"
                            mode="bezeled"
                            onClick={onEdit}
                        >
                            <Icon28Edit/>
                        </IconButton>
                    )}
                />

                <Main className="px-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center w-full">
                            {selectedExpense?.payment &&
                                (<AvatarStack>
                                    {selectedExpense.transactions
                                        .reduce((userIds, currentValue) => {
                                            if (userIds.every((id) => id !== currentValue.borrower.id)) {
                                                // @ts-ignore
                                                userIds.push(currentValue.borrower.id);
                                            }
                                            if (userIds.every((id) => id !== currentValue.debtor.id)) {
                                                // @ts-ignore
                                                userIds.push(currentValue.debtor.id);
                                            }

                                            return userIds;
                                        }, [])
                                        .map((id, index, array) =>
                                            <Avatar
                                                size={48}
                                                key={index}
                                                user_id={id}
                                                style={{
                                                    marginLeft: index > 0 ? Math.max(-0.25 * array.length, -2.5) + "rem" : 0
                                                }}
                                            />
                                        )}
                                </AvatarStack>)
                            }

                            {selectedExpense &&
                                <div className="flex flex-col ml-4 overflow-hidden">
                                    <Text weight="3"
                                          className="text-ellipsis overflow-hidden">{selectedExpense?.description}</Text>
                                    <Caption
                                        weight="3"
                                        className="hint_color"
                                    >{formatDateTime(selectedExpense.date, me.language)}</Caption>
                                </div>
                            }
                        </div>

                        {selectedExpense?.payment && (
                            <div className="flex ml-4">
                                <Text
                                    key="payment"
                                    weight="3"
                                    className={_owe === 0 ? "green" : "red"}
                                >
                                    {`${_owe === 0 ? "+" : "-"}${_amount} ${selectedExpense.currency}`}
                                </Text>
                            </div>
                        )}
                    </div>
                    <Divider className="mt-4 mb-8 border-2"/>

                    {!selectedExpense?.payment &&
                        <div>
                            <div className="mb-8">
                                <div className="flex items-center mb-4">
                                    <AvatarStack>
                                        {
                                            lents.map(({user}, index, array) => (
                                                <Avatar
                                                    size={48}
                                                    key={user.id}
                                                    user_id={user.id}
                                                    style={{
                                                        marginLeft: index > 0 ? Math.max(-0.25 * array.length, -2.5) + "rem" : 0
                                                    }}
                                                />
                                            ))
                                        }
                                    </AvatarStack>
                                    {
                                        <div className="flex flex-col ml-4 max-w-65p">
                                            <Text weight="3">
                                                {
                                                    `${lents?.length === 1 ?
                                                        lents[0].user.name :
                                                        lents?.length + ` ${t("expenseDetails.people")}`} ${t("friendPage.Paid")} 
                                                 ${
                                                        Number(
                                                            lents?.reduce((previousValue, user) =>
                                                                Number(user.lent_amount) + previousValue, 0)
                                                        )
                                                    } ${selectedExpense?.currency}`
                                                }
                                            </Text>
                                        </div>
                                    }
                                </div>
                                {selectedExpense?.expense_users
                                    .map(x => ({
                                        ...x,
                                        lent_amount: Number(x.lent_amount),
                                        debt_amount: Number(x.debt_amount)
                                    }))
                                    .sort((a, b) => b.lent_amount - a.lent_amount)
                                    .map(({lent_amount, debt_amount, user, id}, index) =>
                                        (<div key={id} className="flex items-center mb-4">
                                            {
                                                <div
                                                    style={{
                                                        width: "48px",
                                                        height: "48px",
                                                    }}
                                                    className="relative"
                                                >
                                                    <div className={classNames("vertical-line",
                                                        {
                                                            "vertical-line_first": index === 0 && index !== selectedExpense.expense_users.length - 1,
                                                            "vertical-line_last": index !== 0 && index === selectedExpense.expense_users.length - 1,
                                                            "vertical-line_last_long": index !== 0 && index === selectedExpense.expense_users.length - 1 &&
                                                                Number(lent_amount) !== 0 && Number(debt_amount) !== 0,
                                                            "vertical-line_first_is_last": index === 0 && index === selectedExpense.expense_users.length - 1,
                                                            "vertical-line_long": Number(lent_amount) !== 0 && Number(debt_amount) !== 0,
                                                            "vertical-line_first_long": index === 0 && index !== selectedExpense.expense_users.length - 1 &&
                                                                Number(lent_amount) !== 0 && Number(debt_amount) !== 0,
                                                        })}
                                                    />
                                                    <div className="horizontal-line"/>
                                                </div>
                                            }
                                            <Avatar
                                                key={id + "avatar"}
                                                size={48}
                                                user_id={user.id}
                                            />
                                            <div className="flex flex-col ml-4 max-w-65p">
                                                {Number(lent_amount) !== 0 &&
                                                    <Text
                                                        key={id + "paid"}
                                                        className={classNames("text-ellipsis overflow-hidden hint_color")}
                                                    >{`${user.name} ${t("friendPage.Paid")} ${Number(lent_amount)} ${selectedExpense.currency}`}</Text>}
                                                {Number(debt_amount) !== 0 &&
                                                    <Text
                                                        key={id + "borrowed"}
                                                        className={classNames("text-ellipsis overflow-hidden hint_color")}
                                                    >{`${user.name} ${
                                                        Number(lent_amount) !== 0 ?
                                                            t("expenseDetails.paidForYourself") :
                                                            t("expenseDetails.borrowed")
                                                    } ${Number(debt_amount)} ${selectedExpense.currency}`}</Text>}
                                            </div>
                                        </div>)
                                    )}
                            </div>

                            {selectedExpense &&
                                <ExpenseHistoryList
                                    expanseId={selectedExpense.id}
                                    selectedExpense={selectedExpense}
                                />
                            }
                        </div>
                    }
                </Main>
            </>
        );
}