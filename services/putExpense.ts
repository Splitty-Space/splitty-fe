import axios from "axios"
import {SERVER_URL} from "@/API/APIConstants";
import getCurrentUserId from "@/utils/getCurrentUserId";

interface CreateExpenseUser {
    user_id: number,
    amount?: number,
}

export const putExpense = async ({
                                     expense_id,
                                     payers,
                                     debtors,
                                     users,
                                     amount,
                                     description
                                 }: {
    expense_id: number,
    payers: CreateExpenseUser[],
    debtors: CreateExpenseUser[],
    users: number[],
    amount: number,
    description?: string,
}) => {
    await axios.put(`${SERVER_URL}/expenses/${expense_id}`, {
        user_id: getCurrentUserId(),
        payers: payers,
        debtors: debtors,
        users: users,
        amount: amount,
        description: description,
    }).catch((error) => {
        console.error({error})
    })
}
