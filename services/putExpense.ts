import axios from "axios"
import {SERVER_URL} from "@/API/APIConstants";
import getCurrentUserId from "@/utils/getCurrentUserId";
import {useStore} from "@/app/store";

interface CreateExpenseUser {
    user_id?: number,
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
    users: (number | undefined)[],
    amount: number,
    description?: string,
}) => {
    const token = useStore.getState().token;

    await axios.put(`${SERVER_URL}/expenses/${expense_id}`, {
        user_id: getCurrentUserId(),
        payers: payers,
        debtors: debtors,
        users: users,
        amount: amount,
        description: description,
    }, {
        headers: {
            Authorization: `Bearer ${token}`,
        },
    }).catch((error) => {
        console.error({error})
    })
}
