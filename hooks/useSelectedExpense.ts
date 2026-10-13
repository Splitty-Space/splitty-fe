import {useEffect, useState} from "react";
import type {AxiosError} from "axios";
import {useRouter, useSearchParams} from "next/navigation";
import getExpense from "@/services/getExpense";
import {useStore} from "@/app/store";
import {friendsList} from "@/const/urls";
import {SEARCH_PARAMS} from "@/const/searchParams";
import {TEST_EXPENSE_ID} from "@/const/testExpenseId";
import {parseId} from "@/utils/parseId";
import type {Expense} from "@/entities";

interface LoadedExpense {
    id: number;
    // Null when the last request for this id failed.
    expense: Expense | null;
}

// The expense a page shows comes from the URL, so a reload or Back keeps it (docs/adr/0001-selection-in-url.md).
// A missing or malformed id, or a deleted expense, sends the user to the friends list; a failed request does not.
// `required: false` is for pages where no id means a new expense. `refreshKey` reloads the expense when it changes.
export default function useSelectedExpense({required = true, refreshKey}: { required?: boolean, refreshKey?: string } = {}) {
    const searchParams = useSearchParams();
    const rawId = searchParams.get(SEARCH_PARAMS.EXPENSE_ID);
    const expenseId = parseId(rawId);
    const isTutorial = expenseId === TEST_EXPENSE_ID;

    const authToken = useStore((state) => state.token);
    const tutorialExpense = useStore((state) => state.tutorialExpense);
    const showError = useStore((state) => state.setIsRequestErrorSnackbarShown);
    const showDeleted = useStore((state) => state.setIsCantShowDeletedExpenseSnackbarShown);
    const router = useRouter();

    const [loaded, setLoaded] = useState<LoadedExpense | null>(null);
    const [isRequestInFlight, setIsRequestInFlight] = useState(false);

    const isMissing = expenseId === null ? required || rawId !== null : isTutorial && !tutorialExpense;
    useEffect(() => {
        if (isMissing) router.replace(friendsList);
    }, [isMissing, router]);

    useEffect(() => {
        if (expenseId === null || isTutorial || !authToken) return;
        const controller = new AbortController();
        const onDeleted = () => {
            showDeleted(true);
            router.replace(friendsList);
        };
        setIsRequestInFlight(true);
        getExpense({expense_id: expenseId, signal: controller.signal})
            .then(({data}: { data: Expense }) => {
                if (controller.signal.aborted) return;
                if (data.isDeleted) onDeleted();
                else setLoaded({id: expenseId, expense: data});
            })
            .catch((error: AxiosError) => {
                // Leaving the page or a newer id aborts this request; that is not a failure.
                if (controller.signal.aborted) return;
                if (error.response?.status === 404) {
                    onDeleted();
                } else {
                    console.warn("Expense request failed:", error);
                    showError(true);
                    // A failed refresh keeps showing the expense already loaded for this id.
                    setLoaded((previous) => previous?.id === expenseId ? previous : {id: expenseId, expense: null});
                }
            })
            .finally(() => {
                if (!controller.signal.aborted) setIsRequestInFlight(false);
            });
        return () => controller.abort();
    }, [authToken, expenseId, isTutorial, refreshKey, router, showDeleted, showError]);

    const current = loaded?.id === expenseId ? loaded : null;
    const expense = isTutorial ? tutorialExpense : current?.expense ?? null;
    const isLoading = isRequestInFlight || (expenseId !== null && !isTutorial && !current);

    return {expenseId, expense, isLoading};
}
