import axios from "axios"
import {SERVER_URL} from "@/API/APIConstants";
import getCurrentUserId from "@/utils/getCurrentUserId";
import {useStore} from "@/app/store";

const getExpense = async ({
                              expense_id,
                              signal
                          }: {
    expense_id?: number,
    signal?: AbortSignal
}) => {
    const token = useStore.getState().token;

    return await axios.get(`${SERVER_URL}/expenses/${expense_id}`, {
        params: {
            user_id: getCurrentUserId(),
        },
        headers: {
            Authorization: `Bearer ${token}`,
        },
        signal
    });
}

export default getExpense;