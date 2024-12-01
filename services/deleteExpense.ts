import axios from "axios"
import {SERVER_URL} from "@/API/APIConstants";
import getCurrentUserId from "@/utils/getCurrentUserId";

export const deleteExpense = async (expense_id: number) => {
    await axios.delete(`${SERVER_URL}/expenses/${expense_id}`, {
        params: {
            user_id: getCurrentUserId(),
        }
    }).catch((error) => {
        console.error({error})
    })
}
