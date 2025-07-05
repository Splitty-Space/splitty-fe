import type ExpenseUser from "./ExpenseUser";
import type Group from "./Group";
import type Transaction from "./Transaction";
import {CURRENCIES} from "@/const/currencies";

export default interface Expense {
    amount: string;
    description: string;
    expense_users: ExpenseUser[];
    id: number;
    owe?: number;
    created_at?: string;
    owes?: number;
    currency: typeof CURRENCIES[number];
    payment: boolean;
    isDeleted: boolean;
    settled: boolean;
    group?: Group;
    date: string | null,
    transactions: Transaction[];
}
