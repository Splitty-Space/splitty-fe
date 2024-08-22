import {AxiosError} from "axios";
import useAxios, {RefetchFunction} from "axios-hooks";
import getCurrentUserId from "@/utils/getCurrentUserId";
import {Friend} from "@/entities";

export interface UseFriends {
    data: {
        data: Friend[];
        meta: object;
    },
    loading: boolean;
    error: AxiosError<any, any> | null;
    refetch: RefetchFunction<any, any>;
}

const useFriends = (searchValue: string): UseFriends => {
    const [{data, loading, error}, refetch] = useAxios({
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
        loading,
        error,
        refetch
    };
};

export default useFriends;