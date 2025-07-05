import UserInfo from "@/entities/UserInfo";
import {TEST_EXPENSE_ID} from "@/const/testExpenseId";

export const generateTestExpense = (me: UserInfo, testFriend: UserInfo, t: Function) => {
    return {
        "id": TEST_EXPENSE_ID,
        "description": t("tour.TestExpense"),
        "owe": 0,
        "owes": 300,
        "amount": "300.00",
        "payment": false,
        "currency": "USD",
        "isDeleted": false,
        "settled": false,
        "date": null,
        "transactions": [],
        "expense_users": [
            {
                "id": TEST_EXPENSE_ID,
                "user": {
                    "id": me.id,
                    "username": me.username,
                    "name": me.name,
                    "photo": me.photo,
                },
                "lent_amount": 300,
                "debt_amount": 150
            },
            {
                "id": TEST_EXPENSE_ID,
                "user": {
                    "id": testFriend.id,
                    "username": testFriend.username,
                    "name": testFriend.name,
                    "photo": testFriend.photo,
                },
                "lent_amount": 0,
                "debt_amount": 150
            }
        ],
    }
}