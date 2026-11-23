import React from "react";
import {Modal, VisuallyHidden} from "@telegram-apps/telegram-ui";
import {Drawer} from "@xelene/vaul-with-scroll-fix";
import ExpenseHistory from "@/app/expense/details/ExpenseHistory";
import Activity from "@/entities/Activity";
import {Expense} from "@/entities";
import {
    ModalHeader
} from "@telegram-apps/telegram-ui/dist/components/Overlays/Modal/components/ModalHeader/ModalHeader";

export const ExpenseHistoryModal = ({trigger, title, activity, selectedExpense}: Readonly<{
    trigger: React.ReactNode,
    title: string,
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
            {/* Modal is a vaul Drawer (Radix Dialog): Radix needs a title for screen readers. The title repeats
                the history row that opened the modal, so it stays hidden. */}
            <Drawer.Title asChild>
                <VisuallyHidden Component="h2">{title}</VisuallyHidden>
            </Drawer.Title>
            <ExpenseHistory
                selectedExpense={selectedExpense}
                activity={activity}
            />
        </Modal>
    );
};
