import {AxiosError} from "axios";
import useAxios, {RefetchFunction} from "axios-hooks";
import getCurrentUserId from "@/utils/getCurrentUserId";
import {Friend} from "@/entities";

export interface UseFriends {
    data: {
        data: Friend[];
        meta: object;
    },
    loadingFriends: boolean;
    error: AxiosError<any, any> | null;
    refetchFriends: RefetchFunction<any, any>;
}

const useFriends = (searchValue: string): UseFriends => {
    const [{data, loading, error}, refetchFriends] = useAxios({
        url: "/friends",
        params: {
            user_id: getCurrentUserId(),
        },
    });

    let filteredData = {...data};
    if (data && searchValue !== "") {
        filteredData.data = data.data.filter((user: Friend) =>
            user.name.toLowerCase().includes(searchValue.toLowerCase()) ||
            user.username.toLowerCase().includes(searchValue.toLowerCase()));
    }

    return {
        data: filteredData,
        loadingFriends: loading,
        error,
        refetchFriends
    };
};

export default useFriends;