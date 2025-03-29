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

            settleUpPaymentInfo: null,
            setSettleUpPaymentInfo: (newSettleUpPaymentInfo) => set(() => ({settleUpPaymentInfo: newSettleUpPaymentInfo})),
        }),
    ),
)