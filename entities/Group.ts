import type UserInfo from "./UserInfo";
import type Expense from "./Expense";

export default interface Group {
    id: number;
    user_id: number;
    name: string;
    amount: string;
    owes: string;
    owe: string;
    kind: string;
    simplify_debts: boolean;
    total: any[];
    users: UserInfo[];
    expenses: Expense[];
}
