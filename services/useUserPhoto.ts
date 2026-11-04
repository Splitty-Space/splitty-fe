import useAxios from "axios-hooks";
import type {AxiosResponseHeaders, InternalAxiosRequestConfig} from "axios";
import {useStore} from "@/app/store";
import {toDataUrl} from "@/utils/toDataUrl";

interface UserPhoto {
    url: string;
    userId?: number;
    authorization?: string;
}

const authorizationFor = (token: string) => `Bearer ${token}`;

// The photo is cached as a data URL, so the hook keeps no state and needs no cleanup.
// It carries the user id and token it was requested with: when either changes, the previous
// photo stays in `data` until the new request starts, and must not be shown meanwhile.
function toUserPhoto(this: InternalAxiosRequestConfig, data: ArrayBuffer, headers: AxiosResponseHeaders, status?: number) {
    if (status !== undefined && status >= 400) return data;
    return {
        url: toDataUrl(data, headers.getContentType()?.toString()),
        userId: this.params?.user_id,
        authorization: this.headers?.get("Authorization")?.toString(),
    };
}

export function useUserPhoto(user_id?: number) {
    const hasUserId = typeof user_id === "number" && Number.isSafeInteger(user_id) && user_id > 0;
    const token = useStore((state) => state.token);
    const [{data, loading, error}, refetch] = useAxios<UserPhoto>({
        url: `/user/${user_id}/photo`,
        responseType: "arraybuffer",
        transformResponse: toUserPhoto,
        params: {user_id},
        headers: {Authorization: authorizationFor(token)},
    }, {manual: !token || !hasUserId});
    const isCurrentPhoto = data?.userId === user_id && data?.authorization === authorizationFor(token);
    const photoUrl = hasUserId && token && isCurrentPhoto && !loading && !error ? data.url : "";
    return {photoUrl, loading, error, refetch};
}
