"use client"

import {useEffect, useState} from "react";
import Friends from "@/app/main/friends/friends";
import Groups from "@/app/main/groups/groups";
import Account from "@/app/main/account/account";
import Footer from "@/app/main/footer/footer";
import {TabIds} from "@/const/tabIds";
import {subPageConst} from "@/const/subPageConst";
import {Friend} from "@/entities";
import AddExpenseParticipants from "@/app/main/expenses/addExpenseParticipants";
import useFriends from "@/services/useFriends";
import AddExpense from "@/app/main/expenses/addExpense";
import {AdapterDayjs} from "@mui/x-date-pickers/AdapterDayjs";
import i18next from "i18next";
import {LocalizationProvider} from "@mui/x-date-pickers";
import "dayjs/locale/ru";
import "dayjs/locale/uk";
import {ThemeProvider, createTheme} from "@mui/material/styles";
import Activity from "@/app/main/activity/activity";
import useMe from "@/services/useMe";
import {initClosingBehavior, initSwipeBehavior} from "@telegram-apps/sdk-react";
import "@/utils/mockTelegramEnv";
import {DEFAULT_THEME} from "@/const/theme";

const darkTheme = createTheme({
    palette: {
        mode: DEFAULT_THEME,
    },
});

export default function Page() {
    useEffect(() => {
        if (window?.Telegram?.WebApp) {
            const [swipeBehavior] = initSwipeBehavior();
            const [closingBehavior] = initClosingBehavior();

            swipeBehavior.disableVerticalSwipe();
            closingBehavior.enableConfirmation();
        }
    }, []);

    const [currentTab, setCurrentTab] = useState(TabIds.Friends);
    const [subpage, setSubpage] = useState(subPageConst.FriendsList);

    const {data: me} = useMe();

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
        <LocalizationProvider dateAdapter={AdapterDayjs}
                              adapterLocale={i18next?.language === "ua" ? "uk" : i18next?.language}>
            <ThemeProvider theme={darkTheme}>
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
                {currentTab === TabIds.Activity &&
                    <Activity/>}
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
                        refetchFriends={refetchFriends}
                        setCurrentTab={setCurrentTab}
                        me={me}
                    />}

                <Footer currentTab={currentTab} setCurrentTab={setCurrentTab} setSubpage={setSubpage}/>
            </ThemeProvider>
        </LocalizationProvider>
    );
}
