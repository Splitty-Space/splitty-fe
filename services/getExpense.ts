import axios from "axios"
import {SERVER_URL} from "@/API/APIConstants";
import getCurrentUserId from "@/utils/getCurrentUserId";

const getExpense = async ({
                              expense_id,
                              signal
                          }: {
    expense_id?: number,
    signal?: AbortSignal
}) => {
    return await axios.get(`${SERVER_URL}/expenses/${expense_id}`, {
        params: {
            user_id: getCurrentUserId(),
        },
        signal
    });
}

export default getExpense;