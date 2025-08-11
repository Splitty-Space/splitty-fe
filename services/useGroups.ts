import useAxios from "axios-hooks";
import getCurrentUserId from "@/utils/getCurrentUserId";
import {useStore} from "@/app/store";

const useGroups = () => {
    const token = useStore.getState().token;

    const [{data, loading, error}, refetch] = useAxios({
        url: "/groups",
        params: {
            user_id: getCurrentUserId(),
        },
        headers: {
            Authorization: `Bearer ${token}`,
        },
    });

    return {data, loading, error, refetch};
};

export default useGroups;