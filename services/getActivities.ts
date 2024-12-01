import axios from "axios"
import {SERVER_URL} from "@/API/APIConstants";
import getCurrentUserId from "@/utils/getCurrentUserId";

const getActivities = async ({
                                 page,
                                 pageSize,
                                 signal
                             }: {
    page: number,
    pageSize: number,
    signal?: AbortSignal
}) => {
    return await axios.get(`${SERVER_URL}/activities`, {
        params: {
            user_id: getCurrentUserId(),
            page: page,
            page_size: pageSize,
        },
        signal
    });
}

export default getActivities;