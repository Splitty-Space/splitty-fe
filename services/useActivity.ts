import {AxiosError} from "axios";
import useAxios, {RefetchFunction} from "axios-hooks";
import getCurrentUserId from "@/utils/getCurrentUserId";
import Activity from "@/entities/Activity";

export interface ActivityData {
    data: Activity[];
    meta: object;
}

export interface useActivity {
    data: ActivityData,
    loading: boolean;
    error: AxiosError<any, any> | null;
    refetch: RefetchFunction<any, any>;
}

const useActivity = (expanseId: number): useActivity => {
    const [{data, loading, error}, refetch] = useAxios({
        url: "/activity",
        params: {
            user_id: getCurrentUserId(),
            expanse_id: expanseId,

        },
    }, {useCache: false});

    return {data, loading, error, refetch};
};

export default useActivity;
