import useAxios from "axios-hooks";
import getCurrentUserId from "@/utils/getCurrentUserId";
import {useStore} from "@/app/store";

const useGroups = () => {
    const token = useStore((state) => state.token);

    const [{data, loading, error}, refetch] = useAxios({
        url: "/groups",
        params: {
            user_id: getCurrentUserId(),
        },
        headers: {
            Authorization: `Bearer ${token}`,
        },
    }, {manual: !token});

    return {data, loading, error, refetch};
};

export default useGroups;