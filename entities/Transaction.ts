import type Friend from "./Friend";

export default interface Transaction {
    id?: number;
    debtor: Friend;
    borrower: Friend;
    amount: number;
}
