import axios from "axios"
import {SERVER_URL} from "@/API/APIConstants";
import getCurrentUserId from "@/utils/getCurrentUserId";
import {useStore} from "@/app/store";

export const deleteExpense = async (expense_id: number) => {
    const token = useStore.getState().token;

    await axios.delete(`${SERVER_URL}/expenses/${expense_id}`, {
        params: {
            user_id: getCurrentUserId(),
        },
        headers: {
            Authorization: `Bearer ${token}`,
        },
    }).catch((error) => {
        console.error({error})
    })
}
