import {AxiosError} from "axios";
import useAxios, {RefetchFunction} from "axios-hooks";
import getCurrentUserId from "@/utils/getCurrentUserId";
import Expense from "@/entities/Expense";

export interface UseExpense {
    data: Expense;
    loading: boolean;
    error: AxiosError<any, any> | null;
    refetch: RefetchFunction<any, any>;
}

const useExpense = (expense_id: number): UseExpense => {
    const [{data, loading, error}, refetch] = useAxios({
        url: `/expenses/${expense_id}`,
        params: {
            user_id: getCurrentUserId(),
        },
    }, {useCache: false});

    return {data, loading, error, refetch};
};

export default useExpense;