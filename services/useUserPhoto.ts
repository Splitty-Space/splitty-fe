import useAxios from "axios-hooks";
import type {AxiosResponseHeaders, InternalAxiosRequestConfig} from "axios";
import {useStore} from "@/app/store";
import {toDataUrl} from "@/utils/toDataUrl";

interface UserPhoto {
    url: string;
    userId?: number;
}

// The photo is cached as a data URL, so the hook keeps no state and needs no cleanup.
// It carries its user id: when an avatar switches users, the previous user's photo stays in
// `data` until the new request starts, and must not be shown for the new user.
function toUserPhoto(this: InternalAxiosRequestConfig, data: ArrayBuffer, headers: AxiosResponseHeaders, status?: number) {
    if (status !== undefined && status >= 400) return data;
    return {url: toDataUrl(data, headers.getContentType()?.toString()), userId: this.params?.user_id};
}

export function useUserPhoto(user_id?: number) {
    const hasUserId = typeof user_id === "number" && Number.isSafeInteger(user_id) && user_id > 0;
    const token = useStore((state) => state.token);
    const [{data, loading, error}, refetch] = useAxios<UserPhoto>({
        url: `/user/${user_id}/photo`,
        responseType: "arraybuffer",
        transformResponse: toUserPhoto,
        params: {user_id},
        headers: {Authorization: `Bearer ${token}`},
    }, {manual: !token || !hasUserId});
    const photoUrl = hasUserId && token && data?.userId === user_id && !loading && !error ? data.url : "";
    return {photoUrl, loading, error, refetch};
}
