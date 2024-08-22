import useAxios from "axios-hooks";
import getCurrentUserId from "@/utils/getCurrentUserId";

const useMe = () => {
    const [{data, loading, error}, refetch] = useAxios({
        url: "/me",
        params: {
            user_id: getCurrentUserId(),
        },
    });

    return {data, loading, error, refetch};
};

export default useMe;