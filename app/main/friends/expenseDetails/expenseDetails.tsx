"use client"

import {useState} from "react";
import {useTranslation} from "react-i18next";
import {Expense} from "@/entities";
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

export default function ExpenseDetails({
                                           selectedExpense,
                                           setSelectedExpense,
                                           setSubpage,
                                           setCurrentTab,
                                           setIsDeleteExpenseSnackbarShown
                                       }: {
    selectedExpense: Expense
    setSelectedExpense: Function
    setSubpage: Function,
    setCurrentTab: Function,
    setSelectedFriends: Function,
    setIsDeleteExpenseSnackbarShown: Function,
}) {
    const {t} = useTranslation();

    const {data: me, loading: loadingMe} = useMe();

    const [deleteExpenseLoading, setDeleteExpenseLoading] = useState(false);

    console.log("selectedExpense = ", selectedExpense);

    const onDelete = () => {
        Telegram?.WebApp?.showPopup({
                title: t("friendSettings.ConfirmDelete"),
                message: t("expenseDetails.ConfirmMessage"),
                buttons: [
                    {type: "cancel", text: t("friendSettings.CancelButton")},
                    {id: "confirm", type: "destructive", text: t("friendSettings.DeleteButton")},
                ]
            },
            function (buttonId: string) {
                if (buttonId === "confirm") {
                    setDeleteExpenseLoading(true);
                    deleteExpense(selectedExpense.id)
                        .then(() => {
                            setIsDeleteExpenseSnackbarShown(true);
                            setSelectedExpense(null);
                            setSubpage(subPageConst.Friend);
                        });
                }
            });
    };

    const onEdit = () => {
        // setSubpage();

        setCurrentTab(TabIds.AddExpense);
    };

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
                    <div className="flex">
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
                                .map((photoURL, index) =>
                                    <Avatar
                                        size={48}
                                        key={photoURL}
                                        src={photoURL}
                                    />
                                )}
                        </AvatarStack>

                        <div className="flex flex-col ml-4">
                            <Text weight="3">{selectedExpense.description}</Text>
                            <Caption
                                weight="3"
                                className="hint_color"
                            >{formatDate(selectedExpense.date, me.language)}</Caption>
                        </div>
                    </div>
                    <Divider className="mt-4 mb-8"/>

                    <div>
                        {selectedExpense.expense_users.map(({lent_amount, debt_amount, user, id}) =>
                            (<div key={id} className="flex">
                                <Avatar
                                    key={id + "avatar"}
                                    size={48}
                                    src={user.photo_url}
                                    className="mb-4"
                                />
                                {/* TODO Ask how to show this properly */}
                                <div className="flex flex-col">
                                    {Number(lent_amount) !== 0 &&
                                        <Text
                                            key={id + "paid"}
                                            className={user.id === me.id ? "blue" : "red"}
                                        >{user.name} paid {Number(lent_amount)}</Text>}
                                    {Number(debt_amount) !== 0 &&
                                        <Text
                                            key={id + "borrowed"}
                                            className={user.id === me.id ? "blue" : "red"}
                                        >{user.name} borrowed {Number(debt_amount)}</Text>}
                                </div>
                            </div>)
                        )}
                    </div>
                </main>
            </>
        );
}