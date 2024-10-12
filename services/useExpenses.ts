import {AxiosError} from "axios";
import useAxios, {RefetchFunction} from "axios-hooks";
import getCurrentUserId from "@/utils/getCurrentUserId";
import Expense from "@/entities/Expense";

export interface UseExpenses {
    data: {
        data: Expense[];
        meta: object;
    },
    loadingFriends: boolean;
    error: AxiosError<any, any> | null;
    refetchFriends: RefetchFunction<any, any>;
}

const useExpenses = ({
                         page,
                         limit,
                         friend_id,
                         group_id
                     }: {
    page: number,
    limit: number,
    friend_id?: number,
    group_id?: number,
}): UseExpenses => {
    const [{data, loading, error}, refetch] = useAxios({
        url: "/expenses",
        params: {
            user_id: getCurrentUserId(),
            page,
            limit,
            friend_id,
            group_id
        },
    }, {useCache: false});

    return {data, loading, error, refetch};
};

export default useExpenses;