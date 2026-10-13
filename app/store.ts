import {create} from "zustand"
import {devtools} from "zustand/middleware"
import {Expense, Friend} from "@/entities";

export type PageData = {
    isFromActivity: boolean;
};

interface State {
    isRequestErrorSnackbarShown: boolean,
    setIsRequestErrorSnackbarShown: (shown: boolean) => void,

    token: string,
    setToken: (newToken: string) => void,

    searchValue: string,
    setSearchValue: (newSearchValue: string) => void,

    selectedFriends: Friend[],
    setSelectedFriends: (newFriends: Friend[]) => void,

    // The tour's sample expense has no backend id, so pages read it from here when the URL says TEST_EXPENSE_ID.
    tutorialExpense: Expense | null,
    setTutorialExpense: (newExpense: Expense | null) => void,

    pageData: PageData,
    setPageData: (newPageData: PageData) => void,

    isTourOpen: boolean,
    setIsTourOpen: (newIsTourOpen: boolean) => void,

    isDeleteFriendSnackbarShown: boolean,
    setIsDeleteFriendSnackbarShown: (newIsDeleteFriendSnackbarShown: boolean) => void,

    isDeleteExpenseSnackbarShown: boolean,
    setIsDeleteExpenseSnackbarShown: (newIsDeleteExpenseSnackbarShown: boolean) => void,

    isCreateExpenseSnackbarShown: boolean,
    setIsCreateExpenseSnackbarShown: (newIsCreateExpenseSnackbarShown: boolean) => void,

    isUpdateExpenseSnackbarShown: boolean,
    setIsUpdateExpenseSnackbarShown: (newIsUpdateExpenseSnackbarShown: boolean) => void,

    isCantShowDeletedExpenseSnackbarShown: boolean,
    setIsCantShowDeletedExpenseSnackbarShown: (newIsCantShowDeletedExpenseSnackbarShown: boolean) => void,

    isFriendRequestSentSnackbarShown: boolean,
    setIsFriendRequestSentSnackbarShown: (newIsFriendRequestSentSnackbarShown: boolean) => void,

    isGroupComingSoonSnackbarShown: boolean,
    setIsGroupComingSoonSnackbarShown: (newIsGroupComingSoonSnackbarShown: boolean) => void,

    isForceExpenseSaveEnabled: boolean,
    setIsForceExpenseSaveEnabled: (newIsForceExpenseSaveEnabled: boolean) => void,
}

export const useStore = create<State>()(
    devtools(
        (set) => ({
            isRequestErrorSnackbarShown: false,
            setIsRequestErrorSnackbarShown: (shown) => set({isRequestErrorSnackbarShown: shown}),

            token: "",
            setToken: (newToken) => set(() => ({token: newToken})),

            searchValue: "",
            setSearchValue: (newSearchValue) => set(() => ({searchValue: newSearchValue})),

            selectedFriends: [],
            setSelectedFriends: (newFriends) => set(() => ({selectedFriends: newFriends})),

            tutorialExpense: null,
            setTutorialExpense: (newExpense) => set(() => ({tutorialExpense: newExpense})),

            pageData: {
                isFromActivity: false
            },
            setPageData: (newPageData) => set(() => ({pageData: newPageData})),

            isTourOpen: false,
            setIsTourOpen: (newIsTourOpen: boolean) => set(() => ({isTourOpen: newIsTourOpen})),

            isDeleteFriendSnackbarShown: false,
            setIsDeleteFriendSnackbarShown: (newIsDeleteFriendSnackbarShown) => set(() => ({isDeleteFriendSnackbarShown: newIsDeleteFriendSnackbarShown})),

            isCreateExpenseSnackbarShown: false,
            setIsCreateExpenseSnackbarShown: (newIsCreateExpenseSnackbarShown) => set(() => ({isCreateExpenseSnackbarShown: newIsCreateExpenseSnackbarShown})),

            isUpdateExpenseSnackbarShown: false,
            setIsUpdateExpenseSnackbarShown: (newIsUpdateExpenseSnackbarShown) => set(() => ({isUpdateExpenseSnackbarShown: newIsUpdateExpenseSnackbarShown})),

            isDeleteExpenseSnackbarShown: false,
            setIsDeleteExpenseSnackbarShown: (newIsDeleteExpenseSnackbarShown) => set(() => ({isDeleteExpenseSnackbarShown: newIsDeleteExpenseSnackbarShown})),

            isCantShowDeletedExpenseSnackbarShown: false,
            setIsCantShowDeletedExpenseSnackbarShown: (newIsCantShowDeletedExpenseSnackbarShown) => set(() => ({isCantShowDeletedExpenseSnackbarShown: newIsCantShowDeletedExpenseSnackbarShown})),

            isFriendRequestSentSnackbarShown: false,
            setIsFriendRequestSentSnackbarShown: (newIsFriendRequestSentSnackbarShown) => set(() => ({isFriendRequestSentSnackbarShown: newIsFriendRequestSentSnackbarShown})),

            isGroupComingSoonSnackbarShown: false,
            setIsGroupComingSoonSnackbarShown: (newIsGroupComingSoonSnackbarShown) => set(() => ({isGroupComingSoonSnackbarShown: newIsGroupComingSoonSnackbarShown})),

            isForceExpenseSaveEnabled: false,
            setIsForceExpenseSaveEnabled: (newIsForceExpenseSaveEnabled) => set(() => ({isForceExpenseSaveEnabled: newIsForceExpenseSaveEnabled})),
        }),
    ),
)
