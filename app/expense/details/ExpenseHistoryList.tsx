"use client"

import React from "react";
import {useTranslation} from "react-i18next";
import useMe from "@/services/useMe";
import {Badge, Cell, Divider, List, Spinner, Text} from "@telegram-apps/telegram-ui";
import useActivity from "@/services/useActivity";
import classNames from "classnames";
import {ACTIVITY_TYPE, ACTIVITY_TYPE_TO_TEXT} from "@/entities/Activity";
import {Expense} from "@/entities";
import {formatDate} from "@/utils/formatDate";
import {ExpenseHistoryModal} from "@/app/expense/details/ExpenseHistoryModal";
import Avatar from "@/app/components/avatar/Avatar";

export default function ExpenseHistoryList({
                                               expanseId,
                                               selectedExpense
                                           }: {
    expanseId: number,
    selectedExpense: Expense,
}) {
    const {t} = useTranslation();

    const {data: me} = useMe();

    const {data: activityData, loading} = useActivity(expanseId);

    const countExpenseHistoryItems = (data: object): number => {
        return Object.entries(data)
            .reduce((acc, curr) => {
                if (curr[0] === "amount" || curr[0] === "description")
                    return acc + 1;

                if (curr[0] === "expense_users") {
                    // @ts-ignore
                    return acc + Object.values(curr[1]).reduce((_acc, _curr) => {
                        // @ts-ignore
                        return _acc + Object.keys(_curr).length;
                    }, 0);
                }

                return acc;
            }, 0)
    }

    return (
        <div>
            <Text weight="3">{t("expenseDetails.expenseHistory")}</Text>

            <div>
                {loading ?
                    (
                        <div className={classNames({
                            " flex items-center justify-center": loading
                        })}>
                            <Spinner size="l"/>
                        </div>
                    ) :
                    (<List className="px-0">
                        {activityData?.data?.map((activity) => {
                                const {id, activity_type, user, expense, created_at, data} = activity;

                                const numberOfExpenseHistoryItems = countExpenseHistoryItems(data);

                                return activity_type === ACTIVITY_TYPE.EXPENSE_EDITED || activity_type === ACTIVITY_TYPE.PAYMENT_EDITED ?
                                    (
                                        <ExpenseHistoryModal
                                            key={id}
                                            selectedExpense={selectedExpense}
                                            activity={activityData.data.find((activity) => activity.id === id)}
                                            trigger={
                                                <div key={id}>
                                                    <Cell
                                                        className="p-0"
                                                        subtitle={formatDate(created_at, me.language)}
                                                        before={<Avatar size={48} user_id={user.id}/>}
                                                        after={numberOfExpenseHistoryItems > 0 &&
                                                            (<Badge type="number">
                                                                {numberOfExpenseHistoryItems}
                                                            </Badge>)
                                                        }
                                                    >
                                                        {`${t(activity_type === ACTIVITY_TYPE.EXPENSE_EDITED ?
                                                            "expenseDetails.Expense" : "expenseDetails.Payment")} ${t("expenseDetails.wasEditedBy")} ${user.name}`}
                                                    </Cell>
                                                    <Divider className="ml-16 border-2"/>
                                                </div>}
                                        />)
                                    :
                                    (<div key={id}>
                                        <Cell
                                            className="p-0"
                                            subtitle={formatDate(created_at, me.language)}
                                            before={<Avatar size={48} user_id={user.id}/>}
                                        >
                                            {activity_type !== ACTIVITY_TYPE.PAYMENT_CREATED ?
                                                `${user.name} ` + t(`activity.${ACTIVITY_TYPE_TO_TEXT[activity_type]}`) + ` "${expense.description}"` :
                                                expense.expense_users.find(expense_user => expense_user.lent_amount === 0)?.user.id === me.id ?
                                                    `${expense.expense_users.find(expense_user => expense_user.debt_amount === 0)?.user.name} ${t("settleUp.PaidYou")}` :
                                                    `${t("settleUp.YouPaid")} ${expense.expense_users.find(expense_user => expense_user.lent_amount === 0)?.user.name}`
                                            }
                                        </Cell>
                                        <Divider className="ml-16 border-2"/>
                                    </div>)
                            }
                        )}
                    </List>)
                }
            </div>
        </div>
    );
}