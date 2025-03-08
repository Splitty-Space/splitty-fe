import {create} from "zustand"
import {devtools, persist} from "zustand/middleware"
import {TabIds} from "@/const/tabIds";
import {subPageConst} from "@/const/subPageConst";
import {Friend} from "@/entities";

export type PageData = {
    isFromActivity: boolean;
};

interface State {
    currentTab: TabIds
    setCurrentTab: (newTab: TabIds) => void,

    subpage: subPageConst,
    setSubpage: (newTab: subPageConst) => void,

    searchValue: string,
    setSearchValue: (newSearchValue: string) => void,

    selectedUserId: number | null,
    setSelectedUserId: (newUserId: number | null) => void,

    selectedFriends: Friend[],
    setSelectedFriends: (newFriends: Friend[]) => void,

    selectedExpense: object | null,
    setSelectedExpense: (newExpense: object | null) => void,

    pageData: PageData,
    setPageData: (newPageData: PageData) => void,
}

export const useStore = create<State>()(
    devtools(
        (set) => ({
            currentTab: TabIds.Friends,
            setCurrentTab: (newTab) => set(() => ({currentTab: newTab})),

            subpage: subPageConst.FriendsList,
            setSubpage: (newSubpage) => set(() => ({subpage: newSubpage})),

            searchValue: "",
            setSearchValue: (newSearchValue) => set(() => ({searchValue: newSearchValue})),

            selectedUserId: null,
            setSelectedUserId: (newUserId) => set(() => ({selectedUserId: newUserId})),

            selectedFriends: [],
            setSelectedFriends: (newFriends) => set(() => ({selectedFriends: newFriends})),

            selectedExpense: null,
            setSelectedExpense: (newExpense) => set(() => ({selectedExpense: newExpense})),

            pageData: {
                isFromActivity: false
            },
            setPageData: (newPageData) => set(() => ({pageData: newPageData})),
        }),
    ),
)