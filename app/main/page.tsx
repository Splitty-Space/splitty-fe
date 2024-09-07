"use client"

import {useState} from "react";
import Friends from "@/app/main/friends/friends";
import Groups from "@/app/main/groups/groups";
import Account from "@/app/main/account/account";
import Footer from "@/app/main/footer/footer";
import {TabIds} from "@/const/tabIds";
import {subPageConst} from "@/const/subPageConst";
import {Friend} from "@/entities";
import AddExpenseParticipants from "@/app/main/expenses/AddExpenseParticipants";
import useFriends from "@/services/useFriends";
import AddExpense from "@/app/main/expenses/AddExpense";

export default function Page() {
    const [currentTab, setCurrentTab] = useState(TabIds.Friends);
    const [subpage, setSubpage] = useState(subPageConst.FriendsList);


    const [searchValue, setSearchValue] = useState("");
    const [selectedUserId, setSelectedUserId] = useState(null);
    const {data, loadingFriends, refetchFriends} = useFriends(searchValue);

    const selectedFriend = data?.data?.find(friend => friend.id === selectedUserId);
    const friends = data?.data;

    const [selectedFriends, setSelectedFriends] = useState<Friend[]>([]);

    const onAddExpense = (selectedFriends: Friend[]) => {
        setSelectedFriends(selectedFriends);
    };

    return (
        <>
            {currentTab === TabIds.Friends &&
                <Friends
                    subpage={subpage}
                    setSubpage={setSubpage}
                    searchValue={searchValue}
                    setSearchValue={setSearchValue}
                    setSelectedUserId={setSelectedUserId}
                    friends={friends}
                    loadingFriends={loadingFriends}
                    refetchFriends={refetchFriends}
                    selectedFriend={selectedFriend}
                />
            }
            {currentTab === TabIds.Groups &&
                <Groups subpage={subpage} setSubpage={setSubpage}/>}
            {currentTab === TabIds.Account &&
                <Account/>}
            {currentTab === TabIds.AddExpenseParticipants &&
                <AddExpenseParticipants
                    selectedFriends={selectedFriends}
                    friends={friends}
                    loadingFriends={loadingFriends}
                    setCurrentTab={setCurrentTab}
                    onAddExpense={onAddExpense}
                />}
            {currentTab === TabIds.AddExpense &&
                <AddExpense
                    selectedFriends={selectedFriends}
                    setCurrentTab={setCurrentTab}
                />}

            <Footer currentTab={currentTab} setCurrentTab={setCurrentTab} setSubpage={setSubpage}/>
        </>
    );
}
