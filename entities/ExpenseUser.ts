import type UserInfo from "./UserInfo"

export default interface ExpenseUser {
    id: number;
    user: UserInfo;
    lent_amount: number;
    debt_amount: number;
}
