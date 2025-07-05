import {create} from "zustand"
import {devtools} from "zustand/middleware"
import {Expense, Friend} from "@/entities";

export type PageData = {
    isFromActivity: boolean;
};

interface State {
    searchValue: string,
    setSearchValue: (newSearchValue: string) => void,

    selectedUserId: number | null,
    setSelectedUserId: (newUserId: number | null) => void,

    selectedFriends: Friend[],
    setSelectedFriends: (newFriends: Friend[]) => void,

    selectedExpense: Expense | null,
    setSelectedExpense: (newExpense: Expense | null) => void,

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

    settleUpPaymentInfo: { friend: Friend, currency: string } | null,
    setSettleUpPaymentInfo: (newSettleUpPaymentInfo: { friend: Friend, currency: string } | null) => void,
}

export const useStore = create<State>()(
    devtools(
        (set) => ({
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

            isTourOpen: true,
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

            settleUpPaymentInfo: null,
            setSettleUpPaymentInfo: (newSettleUpPaymentInfo) => set(() => ({settleUpPaymentInfo: newSettleUpPaymentInfo})),
        }),
    ),
)