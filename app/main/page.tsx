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
import {init, viewport, closingBehavior, swipeBehavior} from "@telegram-apps/sdk";
// import "@/utils/mockTelegramEnv"; // TODO DO NOT UNCOMMENT
import {DEFAULT_THEME} from "@/const/theme";


init();

const darkTheme = createTheme({
    palette: {
        mode: DEFAULT_THEME,
    },
});

export type PageData = {
    isFromActivity: boolean;
};

export default function Page() {
    useEffect(() => {
        if (closingBehavior.mount.isAvailable()) {
            closingBehavior.mount();

            if (closingBehavior.enableConfirmation.isAvailable()) {
                closingBehavior.enableConfirmation();
            }
        }

        if (swipeBehavior.mount.isAvailable()) {
            swipeBehavior.mount();

            if (swipeBehavior.disableVertical.isAvailable()) {
                swipeBehavior.disableVertical();
            }
        }

        return () => {
            closingBehavior.unmount();
            swipeBehavior.unmount();
        };
    }, []);

    useEffect(() => {
        const mountViewport = async () => {
            if (viewport.mount.isAvailable()) {
                try {
                    const promise = viewport.mount();
                    console.log("viewport.isMounting() = ", viewport.isMounting());
                    await promise;
                    console.log("viewport.isMounting() = ", viewport.isMounting());
                    console.log("viewport.isMounted() = ", viewport.isMounted());
                } catch (err) {
                    console.log("viewport.mountError() = ", viewport.mountError());
                    console.log("viewport.isMounting() = ", viewport.isMounting());
                    console.log("viewport.isMounted() = ", viewport.isMounted());
                }
            }
        };

        const enableFullscreen = async () => {
            if (viewport.requestFullscreen.isAvailable()) {
                await viewport.requestFullscreen();
                console.log("viewport.isFullscreen() = ", viewport.isFullscreen());
            }
        };

        mountViewport()
            //.then(() => enableFullscreen()); // TODO fullscreen

        return () => {
            viewport.unmount();
        };
    }, []);

    const [currentTab, setCurrentTab] = useState(TabIds.Friends);
    const [subpage, setSubpage] = useState(subPageConst.FriendsList);
    const [pageData, setPageData] = useState<PageData>({
        isFromActivity: false
    });

    const {data: me} = useMe();

    const [searchValue, setSearchValue] = useState("");
    const [selectedUserId, setSelectedUserId] = useState(null);
    const {data, loadingFriends, refetchFriends} = useFriends(searchValue);

    const selectedFriend = data?.data?.find(friend => friend.id === selectedUserId);
    const friends = data?.data;

    const [selectedFriends, setSelectedFriends] = useState<Friend[]>([]);

    const [selectedExpense, setSelectedExpense] = useState(null);

    return (
        <LocalizationProvider dateAdapter={AdapterDayjs}
                              adapterLocale={i18next?.language === "ua" ? "uk" : i18next?.language}>
            <ThemeProvider theme={darkTheme}>
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
                {currentTab === TabIds.Groups &&
                    <Groups subpage={subpage} setSubpage={setSubpage}/>}
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

                <Footer
                    currentTab={currentTab}
                    setCurrentTab={setCurrentTab}
                    subpage={subpage}
                    setSubpage={setSubpage}
                    friends={friends}
                    selectedUserId={selectedUserId}
                    setSelectedUserId={setSelectedUserId}
                    setSelectedFriends={setSelectedFriends}
                    setSearchValue={setSearchValue}
                    setSelectedExpense={setSelectedExpense}
                />
            </ThemeProvider>
        </LocalizationProvider>
    );
}
