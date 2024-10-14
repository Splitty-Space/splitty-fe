import type ExpenseUser from "./ExpenseUser";
import type Group from "./Group";
import type Transaction from "./Transaction";

export default interface Expense {
    amount: number;
    description: string;
    expense_users: ExpenseUser[];
    id: number;
    owe: number;
    created_at: string;
    owes: number;
    currency: string;
    payment: boolean;
    settled: boolean;
    group: Group;
    date: Date,
    transactions: Transaction[];
}
