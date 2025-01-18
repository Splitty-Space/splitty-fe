"use client"

import {useState} from "react";
import {useTranslation} from "react-i18next";
import {subPageConst} from "@/const/subPageConst";
import FriendsList from "@/app/main/friends/friendsList/friendsList";
import FriendPage from "@/app/main/friends/friend/friendPage";
import FriendSettings from "@/app/main/friends/friendSettings/friendSettings";
import SettleUp from "@/app/main/settleUp/settleUp";
import SettleUpPayment from "@/app/main/settleUp/settleUpPayment";
import ExpenseDetails from "@/app/main/friends/expenseDetails/expenseDetails";
import {Snackbar} from "@telegram-apps/telegram-ui";
import {Expense, Friend} from "@/entities";
import {RefetchFunction} from "axios-hooks";
import {Icon28Bin} from "@/Icons";
import {PageData} from "@/app/main/page";
import ExpenseHistoryPage from "@/app/main/friends/expenseDetails/expenseHistoryPage";
import Activity from "@/entities/Activity";

export default function Friends({
                                    subpage,
                                    setSubpage,
                                    setCurrentTab,
                                    pageData,
                                    searchValue,
                                    setSearchValue,
                                    setSelectedUserId,
                                    friends,
                                    loadingFriends,
                                    refetchFriends,
                                    selectedFriend,
                                    selectedExpense,
                                    setSelectedExpense
                                }: {
    subpage: number,
    setSubpage: Function,
    setCurrentTab: Function,
    pageData: PageData,
    searchValue: string,
    setSearchValue: Function,
    setSelectedUserId: Function,
    friends: Friend[],
    loadingFriends: boolean,
    refetchFriends: RefetchFunction<any, any>,
    selectedFriend: Friend,
    selectedExpense: Expense,
    setSelectedExpense: Function,
}) {
    const {t} = useTranslation();

    const [isDeleteFriendSnackbarShown, setIsDeleteFriendSnackbarShown] = useState(false);
    const [isDeleteExpenseSnackbarShown, setIsDeleteExpenseSnackbarShown] = useState(false);
    const [settleUpPaymentInfo, setSettleUpPaymentInfo] = useState<{ friend: Friend, currency: string }>();
    const [activity, setActivity] = useState<Activity>()

    return (
        <>
            {subpage === subPageConst.FriendsList &&
                <FriendsList
                    setSubpage={setSubpage}
                    searchValue={searchValue}
                    setSearchValue={setSearchValue}
                    setSelectedUserId={setSelectedUserId}
                    friends={friends}
                    loadingFriends={loadingFriends}
                />}
            {/*{subpage === subPageConst.AddFriend && TODO remove
                <AddFriend
                    refetchFriends={refetchFriends}
                    setSubpage={setSubpage}
                />}*/}
            {subpage === subPageConst.Friend &&
                <FriendPage
                    friend={selectedFriend}
                    setSubpage={setSubpage}
                    setSelectedExpense={setSelectedExpense}
                />}
            {subpage === subPageConst.FriendSettings &&
                <FriendSettings
                    friend={selectedFriend}
                    friends={friends}
                    refetchFriends={refetchFriends}
                    setSubpage={setSubpage}
                    setIsDeleteFriendSnackbarShown={setIsDeleteFriendSnackbarShown}
                />}
            {subpage === subPageConst.ExpenseDetails &&
                <ExpenseDetails
                    setSubpage={setSubpage}
                    friends={friends}
                    pageData={pageData}
                    setCurrentTab={setCurrentTab}
                    selectedExpense={selectedExpense}
                    setSelectedExpense={setSelectedExpense}
                    setIsDeleteExpenseSnackbarShown={setIsDeleteExpenseSnackbarShown}
                    setSettleUpPaymentInfo={setSettleUpPaymentInfo}
                    setActivity={setActivity}
                />
            }
            {
                subpage === subPageConst.ExpenseHistory &&
                <ExpenseHistoryPage
                    activity={activity}
                    selectedExpense={selectedExpense}
                />
            }
            {subpage === subPageConst.SettleUp &&
                <SettleUp
                    friends={[selectedFriend]}
                    setSubpage={setSubpage}
                    setSettleUpPaymentInfo={setSettleUpPaymentInfo}

                />}
            {subpage === subPageConst.SettleUpPayment &&
                <SettleUpPayment
                    friend={settleUpPaymentInfo.friend}
                    defaultCurrency={settleUpPaymentInfo.currency}
                    selectedExpense={selectedExpense}
                    setSubpage={setSubpage}
                    refetchFriends={refetchFriends}
                />}

            {isDeleteFriendSnackbarShown && (
                <Snackbar
                    className="mb-20"
                    before={<Icon28Bin/>}
                    onClose={() => setIsDeleteFriendSnackbarShown(false)}
                >
                    {t("friendSettings.FriendDeleted")}
                </Snackbar>
            )}

            {isDeleteExpenseSnackbarShown && (
                <Snackbar
                    className="mb-20"
                    before={<Icon28Bin/>}
                    onClose={() => setIsDeleteExpenseSnackbarShown(false)}
                >
                    {t("expenseDetails.ExpenseDeleted")}
                </Snackbar>
            )}
        </>
    );
}