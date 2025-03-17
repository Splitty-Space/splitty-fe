import {AxiosError} from "axios";
import useAxios, {RefetchFunction} from "axios-hooks";

export interface useUserPhoto {
    photoUrl: string,
    loading: boolean,
    error: AxiosError<any, any> | null;
    refetch: RefetchFunction<any, any>;
}

export function useUserPhoto(user_id?: number): useUserPhoto {
    const [{data, loading, error}, refetch] = useAxios({
            url: `/user/${user_id}/photo`,
            responseType: "blob",
            params: {
                user_id: user_id,
            },
        }
    );

    let photoUrl = "";

    if (data) {
        photoUrl = URL.createObjectURL(data);
    }

    return {
        photoUrl,
        loading,
        error,
        refetch
    };
}