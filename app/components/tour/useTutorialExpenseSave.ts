import {useCallback, useRef} from "react";
import type {AxiosError} from "axios";
import {useStore} from "@/app/store";
import {addExpense} from "@/services/addExpense";
import {createExpenseDraft, expenseDraftPayload} from "@/app/expense/expenseDraft";
import type {Me} from "@/services/useMe";
import type {Expense} from "@/entities";

// The tutorial saves the Tutorial expense itself, with the payload the expense editor would send for it:
// the editor cannot be edited during the tutorial, so its draft would be the same.
// The save never navigates, so a slow answer cannot move the user off a later tutorial step.
export default function useTutorialExpenseSave(refetchFriends: () => Promise<unknown>) {
    const showError = useStore((state) => state.setIsRequestErrorSnackbarShown);

    // Set while the request is in flight and after it succeeds, so re-entering the save step
    // does not create a second expense. A failed save clears it, and the next entry tries again.
    const isSaveStarted = useRef(false);

    const saveTutorialExpense = useCallback((me: Me, tutorialExpense: Expense) => {
        if (isSaveStarted.current) return;
        isSaveStarted.current = true;

        const draft = createExpenseDraft({me, expense: tutorialExpense, friends: []});
        addExpense({...expenseDraftPayload(draft), payment: false})
            .then(
                // A refresh failure must not turn a confirmed write into a retryable write.
                () => refetchFriends().catch((err: AxiosError) => {
                    console.warn("Friends refresh after the tutorial save failed:", err);
                    showError(true);
                }),
                (err: AxiosError) => {
                    console.warn("Tutorial expense save failed:", err);
                    isSaveStarted.current = false;
                    showError(true);
                },
            );
    }, [refetchFriends, showError]);

    const resetTutorialExpenseSave = useCallback(() => {
        isSaveStarted.current = false;
    }, []);

    return {saveTutorialExpense, resetTutorialExpenseSave};
}
