import axios from "axios"
import {SERVER_URL} from "@/API/APIConstants";
import getCurrentUserId from "@/utils/getCurrentUserId";
import {useStore} from "@/app/store";

const getActivities = async ({
                                 page,
                                 pageSize,
                                 signal
                             }: {
    page: number,
    pageSize: number,
    signal?: AbortSignal
}) => {
    const token = useStore.getState().token;

    return await axios.get(`${SERVER_URL}/activities`, {
        params: {
            user_id: getCurrentUserId(),
            page: page,
            page_size: pageSize,
        },
        headers: {
            Authorization: `Bearer ${token}`,
        },
        signal
    });
}

export default getActivities;