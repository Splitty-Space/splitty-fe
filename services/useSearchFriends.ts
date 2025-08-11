import useAxios from "axios-hooks";
import {useStore} from "@/app/store";

export const useSearchFriends = (searchValue: string) => {
    const query = searchValue.trim()

    let doRequest = query === "" || query.length < 3;

    const token = useStore.getState().token;

    const [{data, loading, error}, refetch] = useAxios({
        url: "/searchUser",
        params: {
            page: 0,
            per_page: 10,
            query: query,
        },
        headers: {
            Authorization: `Bearer ${token}`,
        },
    }, {manual: doRequest});

    return {data, loading, error, refetch};
}