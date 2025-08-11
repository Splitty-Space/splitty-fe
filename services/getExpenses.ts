import axios from "axios"
import {SERVER_URL} from "@/API/APIConstants";
import getCurrentUserId from "@/utils/getCurrentUserId";
import {useStore} from "@/app/store";

const getExpenses = async ({
                               page,
                               limit,
                               friend_id,
                               group_id,
                               signal
                           }: {
    page: number,
    limit: number,
    friend_id?: number,
    group_id?: number,
    signal?: AbortSignal
}) => {
    const token = useStore.getState().token;

    return await axios.get(`${SERVER_URL}/expenses`, {
        params: {
            user_id: getCurrentUserId(),
            page,
            limit,
            friend_id,
            group_id
        },
        headers: {
            Authorization: `Bearer ${token}`,
        },
        signal
    });
}

export default getExpenses;