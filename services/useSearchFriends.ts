import useAxios from "axios-hooks";

export const useSearchFriends = (searchValue: string) => {
    const query = searchValue.trim()

    let doRequest = query === "" || query.length < 3;

    const [{data, loading, error}, refetch] = useAxios({
        url: "/searchUser",
        params: {
            page: 0,
            per_page: 10,
            query: query,
        },
    }, {manual: doRequest});

    return {data, loading, error, refetch};
}