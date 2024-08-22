import useAxios from "axios-hooks";
import getCurrentUserId from "@/utils/getCurrentUserId";

const useGroups = () => {
    const [{data, loading, error}, refetch] = useAxios({
        url: "/groups",
        params: {
            user_id: getCurrentUserId(),
        },
    });

    return {data, loading, error, refetch};
};

export default useGroups;