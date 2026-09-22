import {useEffect, useState} from "react";
import useAxios from "axios-hooks";
import {useStore} from "@/app/store";

export function useUserPhoto(user_id?: number) {
    const hasUserId = typeof user_id === "number" && Number.isSafeInteger(user_id) && user_id > 0;
    const token = useStore((state) => state.token);
    const [{data, loading, error}, refetch] = useAxios<Blob>({
        url: `/user/${user_id}/photo`,
        responseType: "blob",
        params: {user_id},
        headers: {Authorization: `Bearer ${token}`},
    }, {manual: !token || !hasUserId});
    const [photo, setPhoto] = useState<{url: string, userId?: number, token: string, data: Blob}>();
    useEffect(() => {
        if (!hasUserId || !token || !data || loading || error) {
            setPhoto(undefined);
            return;
        }
        const url = URL.createObjectURL(data);
        setPhoto({url, userId: user_id, token, data});
        return () => URL.revokeObjectURL(url);
    }, [data, error, hasUserId, loading, token, user_id]);
    const photoUrl = photo?.userId === user_id && photo?.token === token && photo?.data === data && !loading && !error
        ? photo?.url ?? "" : "";
    return {photoUrl, loading, error, refetch};
}
