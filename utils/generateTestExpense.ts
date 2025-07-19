import UserInfo from "@/entities/UserInfo";
import {TEST_EXPENSE_ID} from "@/const/testExpenseId";

export const generateTestExpense = (me: UserInfo, testFriend: UserInfo, t: Function) => {
    return {
        "id": TEST_EXPENSE_ID,
        "description": t("tour.TestExpense"),
        "owe": 0,
        "owes": 70,
        "amount": "70.00",
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
                "lent_amount": 70,
                "debt_amount": 35
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
                "debt_amount": 35
            }
        ],
    }
}

export const generateTestExpenseWithSplit = (me: UserInfo, testFriend: UserInfo, t: Function) => {
    return {
        "id": TEST_EXPENSE_ID,
        "description": t("tour.TestExpense"),
        "owe": 0,
        "owes": 70,
        "amount": "70.00",
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
                "lent_amount": 20,
                "debt_amount": 40
            },
            {
                "id": TEST_EXPENSE_ID,
                "user": {
                    "id": testFriend.id,
                    "username": testFriend.username,
                    "name": testFriend.name,
                    "photo": testFriend.photo,
                },
                "lent_amount": 50,
                "debt_amount": 30
            }
        ],
    }
}

