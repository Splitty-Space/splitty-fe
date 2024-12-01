import UserInfo from "@/entities/UserInfo";
import Expense from "@/entities/Expense";

export enum ACTIVITY_TYPE {
    EXPENSE_CREATED = "EXPENSE_CREATED",
    EXPENSE_DELETED = "EXPENSE_DELETED",
    EXPENSE_EDITED = "EXPENSE_EDITED",
    PAYMENT_CREATED = "PAYMENT_CREATED",
    PAYMENT_EDITED = "PAYMENT_EDITED",
    PAYMENT_DELETED = "PAYMENT_DELETED",
}

export const ACTIVITY_TYPE_TO_TEXT = {
    EXPENSE_CREATED: "created",
    PAYMENT_CREATED: "payed",
    EXPENSE_DELETED: "deleted",
    PAYMENT_DELETED: "deleted",
    EXPENSE_EDITED: "edited",
    PAYMENT_EDITED: "edited",
}

export default interface Activity {
    id: number,
    activity_type: ACTIVITY_TYPE,
    user: UserInfo,
    expense: Expense,
    created_at: Date,
    data: object,
}
