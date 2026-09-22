import {apiClient as axios} from "@/API/client"
import {SERVER_URL} from "@/API/APIConstants";
import getCurrentUserId from "@/utils/getCurrentUserId";
import {CURRENCIES} from "@/const/currencies";
import {useStore} from "@/app/store";

import type {Expense} from "@/entities";

interface CreateExpenseUser {
    user_id?: number,
    amount?: number,
}

export const addExpense = async ({
                                     payers,
                                     debtors,
                                     users,
                                     amount,
                                     payment,
                                     currency,
                                     date,
                                     description
                                 }: {
    payers: CreateExpenseUser[],
    debtors: CreateExpenseUser[],
    users: (number | undefined)[],
    amount: number,
    payment: boolean,
    currency: typeof CURRENCIES[number] | undefined,
    date: Date | string,
    description?: string,
}) => {
    const token = useStore.getState().token;

    return await axios.post<Expense>(`${SERVER_URL}/expenses`, {
            user_id: getCurrentUserId(),
            payers: payers,
            debtors: debtors,
            users: users,
            amount: amount,
            payment: payment,
            currency: currency,
            date: date,
            description: description,
        },
        {
            headers: {
                Authorization: `Bearer ${token}`,
            },
        })
}
