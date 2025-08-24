import useAxios, {RefetchFunction} from "axios-hooks";
import getCurrentUserId from "@/utils/getCurrentUserId";
import {AxiosError} from "axios";
import {useStore} from "@/app/store";

export interface Me {
    id: number;
    name: string;
    language: string;
    default_currency: string;
    photo: Blob;
    username: string;
    referral_code: string;
    isGuideShown: boolean;
}

export interface useMe {
    data: Me
    loading: boolean,
    error: AxiosError<any, any> | null;
    refetch: RefetchFunction<any, any>;
}

const useMe = (): useMe => {
    const token = useStore.getState().token;

    const [{data, loading, error}, refetch] = useAxios({
        url: "/me",
        params: {
            user_id: getCurrentUserId(),
        },
        headers: {
            Authorization: `Bearer ${token}`,
        },
    });

    return {data, loading, error, refetch};
};

export default useMe;