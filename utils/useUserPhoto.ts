import {useMemo} from "react";
import {AxiosError} from "axios";
import useAxios, {RefetchFunction} from "axios-hooks";

export interface useUserPhoto {
    photoUrl: string,
    loading: boolean,
    error: AxiosError<any, any> | null;
    refetch: RefetchFunction<any, any>;
}

const photoCache: Record<number, string> = {};

export function useUserPhoto(user_id?: number) {
    const cachedUrl = user_id ? photoCache[user_id] : "";

    const [{data, loading, error}, refetch] = useAxios({
            url: `/user/${user_id}/photo`,
            responseType: "blob",
            params: {
                user_id: user_id,
            },
        }
    );

    const photoUrl = useMemo(() => {
        if (cachedUrl) return cachedUrl;
        if (data) {
            const url = URL.createObjectURL(data);
            if (user_id) {
                photoCache[user_id] = url;
            }
            return url;
        }
        return "";
    }, [cachedUrl, data, user_id]);

    return {photoUrl, loading, error, refetch};
}