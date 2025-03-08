import React from "react";
import {Modal} from "@telegram-apps/telegram-ui";
import ExpenseHistory from "@/app/friends/expenseDetails/ExpenseHistory";
import Activity from "@/entities/Activity";
import {Expense} from "@/entities";
import {
    ModalHeader
} from "@telegram-apps/telegram-ui/dist/components/Overlays/Modal/components/ModalHeader/ModalHeader";

export const ExpenseHistoryModal = ({trigger, activity, selectedExpense}: Readonly<{
    trigger: React.ReactNode,
    activity?: Activity,
    selectedExpense: Expense,
}>) => {
    return (
        <Modal
            header={<ModalHeader/>}
            className="z-50 top-20"
            trigger={trigger}
            aria-describedby={undefined}
        >
            <ExpenseHistory
                selectedExpense={selectedExpense}
                activity={activity}
            />
        </Modal>
    );
};