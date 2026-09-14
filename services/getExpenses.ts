import axios from "axios"
import {SERVER_URL} from "@/API/APIConstants";
import getCurrentUserId from "@/utils/getCurrentUserId";
import {useStore} from "@/app/store";

type ExpenseScope =
    | {friend_id: number, group_id?: never}
    | {friend_id?: never, group_id: number};

type GetExpensesParams = ExpenseScope & {
    page: number,
    limit: number,
    signal?: AbortSignal
};

const getExpenses = async ({
                               page,
                               limit,
                               friend_id,
                               group_id,
                               signal
                           }: GetExpensesParams) => {
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
