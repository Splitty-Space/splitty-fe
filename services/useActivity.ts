import {AxiosError} from "axios";
import useAxios, {RefetchFunction} from "axios-hooks";
import getCurrentUserId from "@/utils/getCurrentUserId";
import Activity from "@/entities/Activity";
import {useStore} from "@/app/store";

export interface ActivityData {
    data: Activity[];
    meta: object;
}

export interface useActivity {
    data: ActivityData,
    loading: boolean;
    error: AxiosError<any> | null;
    refetch: RefetchFunction<any, any>;
}

const useActivity = (expanseId: number): useActivity => {
    const token = useStore((state) => state.token);

    const [{data, loading, error}, refetch] = useAxios({
        url: "/activity",
        params: {
            user_id: getCurrentUserId(),
            expanse_id: expanseId,

        },
        headers: {
            Authorization: `Bearer ${token}`,
        },
    }, {useCache: false, manual: !token});

    return {data, loading, error, refetch};
};

export default useActivity;
