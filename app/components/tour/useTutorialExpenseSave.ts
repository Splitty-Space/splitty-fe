import {useCallback, useRef} from "react";
import {AxiosError, isCancel} from "axios";
import {useStore} from "@/app/store";
import {addExpense} from "@/services/addExpense";
import {createExpenseDraft, expenseDraftPayload} from "@/app/expense/expenseDraft";
import type {Me} from "@/services/useMe";
import type {UseFriends} from "@/services/useFriends";

// The tutorial saves the Tutorial expense itself, with the payload the expense editor would send for it:
// the editor cannot be edited during the tutorial, so its draft would be the same.
// The save never navigates, so a slow answer cannot move the user off a later tutorial step.
export default function useTutorialExpenseSave(refetchFriends: UseFriends["refetchFriends"]) {
    const showError = useStore((state) => state.setIsRequestErrorSnackbarShown);

    // Set while the request is in flight and after it succeeds, so re-entering the save step
    // does not create a second expense. A failed save clears it, and the next entry tries again.
    const isSaveStarted = useRef(false);
    // Counts tutorial runs. The tutorial can be reopened from the account page, and an answer
    // that arrives after its run was closed must not touch the next run's guard or show an error.
    const run = useRef(0);

    const saveTutorialExpense = useCallback((me: Me) => {
        // The save step stores the Tutorial expense the editor shows; read it at step entry.
        const {tutorialExpense} = useStore.getState();
        if (isSaveStarted.current || !tutorialExpense) return;
        isSaveStarted.current = true;
        const saveRun = run.current;

        const draft = createExpenseDraft({me, expense: tutorialExpense, friends: []});
        addExpense({...expenseDraftPayload(draft), payment: false})
            .then(
                // A refresh failure must not turn a confirmed write into a retryable write.
                () => refetchFriends().catch((err: AxiosError) => {
                    if (isCancel(err)) return;
                    console.warn("Friends refresh after the tutorial save failed:", err);
                    showError(true);
                }),
                (err: AxiosError) => {
                    console.warn("Tutorial expense save failed:", err);
                    if (saveRun !== run.current) return;
                    isSaveStarted.current = false;
                    showError(true);
                },
            );
    }, [refetchFriends, showError]);

    const resetTutorialExpenseSave = useCallback(() => {
        run.current += 1;
        isSaveStarted.current = false;
    }, []);

    return {saveTutorialExpense, resetTutorialExpenseSave};
}
