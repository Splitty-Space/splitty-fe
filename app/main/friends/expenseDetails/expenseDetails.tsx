"use client"

import {useEffect, useState} from "react";
import {useTranslation} from "react-i18next";
import classNames from "classnames";
import {Expense, Friend} from "@/entities";
import Header from "@/app/main/header/header";
import {Avatar, AvatarStack, Caption, Divider, IconButton, Spinner, Text} from "@telegram-apps/telegram-ui";
import {Icon28Edit} from "@telegram-apps/telegram-ui/dist/icons/28/edit";
import {Icon28Bin} from "@/Icons";
import Logo from "@/app/main/header/logo";
import useMe from "@/services/useMe";
import {formatDate} from "@/utils/formatDate";
import {deleteExpense} from "@/services/deleteExpense";
import {subPageConst} from "@/const/subPageConst";
import {TabIds} from "@/const/tabIds";
import getExpense from "@/services/getExpense";
import {PageData} from "@/app/main/page";
import ExpenseHistoryList from "@/app/main/friends/expenseDetails/ExpenseHistoryList";
import "./expenseDetails.css";

export default function ExpenseDetails({
                                           selectedExpense,
                                           friends,
                                           setSelectedExpense,
                                           setSubpage,
                                           setCurrentTab,
                                           pageData,
                                           setIsDeleteExpenseSnackbarShown,
                                           setSettleUpPaymentInfo,
                                       }: {
    selectedExpense: Expense,
    friends: Friend[],
    setSelectedExpense: Function,
    setSubpage: Function,
    setCurrentTab: Function,
    pageData: PageData,
    setIsDeleteExpenseSnackbarShown: Function,
    setSettleUpPaymentInfo: Function,
}) {
    const {t} = useTranslation();

    const {data: me, loading: loadingMe} = useMe();

    const [deleteExpenseLoading, setDeleteExpenseLoading] = useState(false);

    useEffect(() => {
        getExpense({expense_id: selectedExpense.id})
            .then(({data}) => setSelectedExpense(data));
    }, [selectedExpense.id, setSelectedExpense]);

    const expenseDelete = () => {
        setDeleteExpenseLoading(true);
        deleteExpense(selectedExpense.id)
            .then(() => {
                setIsDeleteExpenseSnackbarShown(true);
                setSelectedExpense(null);
                setCurrentTab(pageData.isFromActivity ? TabIds.Activity : TabIds.Friends);
                setSubpage(pageData.isFromActivity ? subPageConst.ActivityList : subPageConst.Friend);
            });
    };

    const onDelete = () => {
        window.Telegram?.WebApp?.showPopup({
                title: t("friendSettings.ConfirmDelete"),
                message: t("expenseDetails.ConfirmMessage"),
                buttons: [
                    {type: "cancel", text: t("friendSettings.CancelButton")},
                    {id: "confirm", type: "destructive", text: t("friendSettings.DeleteButton")},
                ]
            },
            function (buttonId: string) {
                if (buttonId === "confirm") {
                    expenseDelete();
                }
            });
    };

    const onEdit = () => {
        if (selectedExpense.payment) {
            setSubpage(subPageConst.SettleUpPayment);
            setSettleUpPaymentInfo(
                {
                    friend: friends.find(({id}) => id === selectedExpense.expense_users.find(({user}) => user.id !== me.id)?.user.id),
                    currency: selectedExpense.currency,
                }
            );
        } else {
            setCurrentTab(TabIds.AddExpense);
        }
    };

    const _owe = Number(selectedExpense.owe);
    const _amount = Number(selectedExpense.amount);

    const lents = selectedExpense.expense_users
        .filter(({lent_amount}) => lent_amount > 0);

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
                            mode="plain"
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

                <main className="m-4 mb-12">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center w-full">
                            <AvatarStack>
                                {selectedExpense.transactions
                                    .reduce((photoURLs, currentValue) => {
                                        if (photoURLs.every((photoURL) => photoURL !== currentValue.borrower.photo_url)) {
                                            photoURLs.push(currentValue.borrower.photo_url);
                                        }
                                        if (photoURLs.every((photoURL) => photoURL !== currentValue.debtor.photo_url)) {
                                            photoURLs.push(currentValue.debtor.photo_url);
                                        }

                                        return photoURLs;
                                    }, [])
                                    .map((photoURL, index, array) =>
                                        <Avatar
                                            size={48}
                                            key={photoURL}
                                            src={photoURL}
                                            style={{
                                                marginLeft: index > 0 ? Math.max(-0.25 * array.length, -2.5) + "rem" : 0
                                            }}
                                        />
                                    )}
                            </AvatarStack>

                            <div className="flex flex-col ml-4 overflow-hidden">
                                <Text weight="3"
                                      className="text-ellipsis overflow-hidden">{selectedExpense.description}</Text>
                                <Caption
                                    weight="3"
                                    className="hint_color"
                                >{formatDate(selectedExpense.date, me.language)}</Caption>
                            </div>
                        </div>

                        {selectedExpense.payment && (
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
                    <Divider className="mt-4 mb-8"/>

                    {!selectedExpense?.payment &&
                        <div>
                            <div className="flex items-center mb-4">
                                <AvatarStack>
                                    {
                                        lents.map(({user}, index, array) => (
                                            <Avatar
                                                size={48}
                                                key={user.photo_url}
                                                src={user.photo_url}
                                                style={{
                                                    marginLeft: index > 0 ? Math.max(-0.25 * array.length, -2.5) + "rem" : 0
                                                }}
                                            />
                                        ))
                                    }
                                </AvatarStack>
                                {
                                    <div className="flex flex-col ml-4 max-w-70p">
                                        <Text weight="3">
                                            {
                                                `${lents.length === 1 ?
                                                    lents[0].user.name :
                                                    lents.length + ` ${t("expenseDetails.people")}`} ${t("friendPage.Paid")} 
                                                 ${
                                                    Number(
                                                        lents.reduce((previousValue, user) =>
                                                            Number(user.lent_amount) + previousValue, 0)
                                                    )
                                                } ${selectedExpense.currency}`
                                            }
                                        </Text>
                                    </div>
                                }
                            </div>
                            {selectedExpense.expense_users.map(({lent_amount, debt_amount, user, id}, index) =>
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
                                                    "vertical-line_first_is_last": index === 0 && index === selectedExpense.expense_users.length - 1,
                                                })}
                                            />
                                            <div className="horizontal-line"/>
                                        </div>
                                    }
                                    <Avatar
                                        key={id + "avatar"}
                                        size={48}
                                        src={user.photo_url}
                                    />
                                    <div className="flex flex-col ml-4 max-w-70p">
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

                            <ExpenseHistoryList
                                expanseId={selectedExpense.id}
                                selectedExpense={selectedExpense}
                            />
                        </div>
                    }
                </main>
            </>
        );
}