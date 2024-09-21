import axios from "axios"
import {SERVER_URL} from "@/API/APIConstants";
import getCurrentUserId from "@/utils/getCurrentUserId";
import {CURRENCIES} from "@/const/currencies";

interface CreateExpenseUser {
    user_id: number,
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
    users: number[],
    amount: number,
    payment: boolean,
    currency: typeof CURRENCIES[number],
    date: Date,
    description: string,
}) => {
    await axios.post(`${SERVER_URL}/expenses`, {
        user_id: getCurrentUserId(),
        payers: payers,
        debtors: debtors,
        users: users,
        amount: amount,
        payment: payment,
        currency: currency,
        date: date,
        description: description,
    }).catch((error) => {
        console.error({error})
    })
}
