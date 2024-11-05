import axios from "axios"
import {SERVER_URL} from "@/API/APIConstants";

export const deleteExpense = async (expense_id: number) => {
    await axios.delete(`${SERVER_URL}/expenses/${expense_id}`)
        .catch((error) => {
            console.error({error})
        })
}
