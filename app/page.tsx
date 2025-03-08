"use client"

import Friends from "@/app/friends/friends";
import Account from "@/app/main/account/account";
import {TabIds} from "@/const/tabIds";
import AddExpenseParticipants from "@/app/main/expenses/addExpenseParticipants";
import useFriends from "@/services/useFriends";
import AddExpense from "@/app/main/expenses/addExpense";
import "dayjs/locale/ru";
import "dayjs/locale/uk";
import Activity from "@/app/main/activity/activity";
import useMe from "@/services/useMe";
import {useStore} from "@/app/store";
import {init} from "@telegram-apps/sdk";
// import "@/utils/mockTelegramEnv"; // TODO DO NOT UNCOMMENT

init();

export default function Page() {
    const currentTab = useStore((state) => state.currentTab);
    const setCurrentTab = useStore((state) => state.setCurrentTab);

    const subpage = useStore((state) => state.subpage);
    const setSubpage = useStore((state) => state.setSubpage);

    const searchValue = useStore((state) => state.searchValue);
    const setSearchValue = useStore((state) => state.setSearchValue);

    const selectedUserId = useStore((state) => state.selectedUserId);
    const setSelectedUserId = useStore((state) => state.setSelectedUserId);

    const selectedFriends = useStore((state) => state.selectedFriends);
    const setSelectedFriends = useStore((state) => state.setSelectedFriends);

    const selectedExpense = useStore((state) => state.selectedExpense);
    const setSelectedExpense = useStore((state) => state.setSelectedExpense);

    const pageData = useStore((state) => state.pageData);
    const setPageData = useStore((state) => state.setPageData);

    const {data, loadingFriends, refetchFriends} = useFriends(searchValue)

    const selectedFriend = data?.data?.find(friend => friend.id === selectedUserId);
    const friends = data?.data;

    const {data: me} = useMe();

    return (
        <>
            {currentTab === TabIds.Friends &&
                <Friends
                    subpage={subpage}
                    setSubpage={setSubpage}
                    setCurrentTab={setCurrentTab}
                    searchValue={searchValue}
                    pageData={pageData}
                    setSearchValue={setSearchValue}
                    setSelectedUserId={setSelectedUserId}
                    friends={friends}
                    loadingFriends={loadingFriends}
                    refetchFriends={refetchFriends}
                    // @ts-ignore
                    selectedFriend={selectedFriend}
                    setSelectedFriends={setSelectedFriends}
                    // @ts-ignore
                    selectedExpense={selectedExpense}
                    setSelectedExpense={setSelectedExpense}
                />
            }
            {currentTab === TabIds.Activity &&
                <Activity
                    subpage={subpage}
                    setCurrentTab={setCurrentTab}
                    setSubpage={setSubpage}
                    setPageData={setPageData}
                    setSelectedExpense={setSelectedExpense}
                />}
            {currentTab === TabIds.Account &&
                <Account/>}
            {currentTab === TabIds.AddExpenseParticipants &&
                <AddExpenseParticipants
                    selectedFriends={selectedFriends}
                    friends={friends}
                    loadingFriends={loadingFriends}
                    setCurrentTab={setCurrentTab}
                    setSelectedFriends={setSelectedFriends}
                />}
            {currentTab === TabIds.AddExpense &&
                <AddExpense
                    me={me}
                    selectedFriends={selectedFriends}
                    // @ts-ignore
                    selectedExpense={selectedExpense}
                    setSubpage={setSubpage}
                    setCurrentTab={setCurrentTab}
                    refetchFriends={refetchFriends}
                />}

        </>
    );
}
