"use client"

import React from "react";
import {useTranslation} from "react-i18next";
import useMe from "@/services/useMe";
import {Cell, Divider, List, Spinner, Text} from "@telegram-apps/telegram-ui";
import Activity from "@/entities/Activity";
import {formatDateTime} from "@/utils/formatDateTime";
import {Expense} from "@/entities";
import Avatar from "@/app/components/avatar/Avatar";

type ValueType = {
    [key: string]: {
        debt_amount: { old: number; new: number };
        lent_amount: { old: number; new: number };
    };
};

export default function ExpenseHistory({activity, selectedExpense}: {
    activity?: Activity,
    selectedExpense: Expense,
}) {
    const {t} = useTranslation();

    const {data: me, loading: loadingMe} = useMe();

    return loadingMe ?
        (<Spinner className="flex justify-center " size="l"/>)
        : (
            <div className="m-4 mb-12">
                <Text weight="3">{t("expenseDetails.detailedChanges")}</Text>

                <List className="px-0">
                    {
                        activity && Object.entries(activity.data).filter(([key]) => key !== "transactions")
                            .map(([key, value]) =>
                                key === "expense_users" ?
                                    (Object.entries(value as ValueType).map(([_key, _value]) =>
                                        // @ts-ignore
                                        Object.entries(_value).map(([__key, __value]) =>
                                            <div key={activity.id + key + _key + __key}>
                                                <Cell
                                                    className="p-0"
                                                    subtitle={formatDateTime(activity.created_at, me.language)}
                                                    before={<Avatar
                                                        size={48}
                                                        user_id={activity.user.id}
                                                    />}
                                                >
                                                    {_value && <span className="whitespace-normal">
                                                                {`${activity.user.name} changed ${selectedExpense.expense_users[Number(_key)].user.name} 
                                                                ${__key === "debt_amount" ? "debt" : "lent"} amount from 
                                                                ${__key === "debt_amount" ? _value?.debt_amount.old : _value?.lent_amount.old} to 
                                                                ${__key === "debt_amount" ? _value?.debt_amount.new : _value?.lent_amount.old}`}
                                                            </span>
                                                    }
                                                </Cell>
                                                <Divider className="ml-16 border-2"/>
                                            </div>)
                                    ))
                                    :
                                    (<div key={activity.id + key}>
                                        <Cell
                                            className="p-0"
                                            subtitle={formatDateTime(activity.created_at, me.language)}
                                            before={<Avatar
                                                size={48}
                                                user_id={activity.user.id}
                                            />}
                                        >
                                                <span className="whitespace-normal">
                                                    {`${activity.user.name} changed ${key} ${value.old} to ${value.new}`}
                                                </span>
                                        </Cell>
                                        <Divider className="ml-16 border-2"/>
                                    </div>)
                            )
                    }
                </List>
            </div>
        );
}