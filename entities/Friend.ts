import type Expense from "./Expense";
import type DebtInfo from "./DebtInfo";

export default interface Friend {
    id: number;
    name: string;
    username: string;
    photo: Blob;
    expenses: Expense[];
    total: DebtInfo[];
    amount: number;
    default_currency: string;
}
