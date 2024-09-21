import useAxios from "axios-hooks";
import getCurrentUserId from "@/utils/getCurrentUserId";

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
}) => {
    const [{data, loading, error}, refetch] = useAxios({
        url: "/expenses",
        params: {
            user_id: getCurrentUserId(),
            page,
            limit,
            friend_id,
            group_id
        },
    });

    return {data, loading, error, refetch};
};

export default useExpenses;