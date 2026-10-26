import dayjs from "dayjs";
import {splitNumberIntoParts} from "@/utils/splitNumberIntoParts";
import {isAllocationBalanced} from "@/utils/expenseValidation";
import {EXPENSE_CURRENCY_PRECISION} from "@/const/currencies";
import {EXPENSE_DRAFT_ACTIONS} from "@/const/expenseDraftActions";
import {ALLOCATION_SIDES} from "@/const/allocationSides";
import type {Expense} from "@/entities";

const MAX_NAME_LENGTH = 256;
const MAX_AMOUNT_LENGTH = 15;

export interface Allocation {
    id: number;
    isSelected: boolean;
    amount?: number;
    amountRaw?: string;
    percentRaw?: string;
    isDirty: boolean;
}

export interface Participant {
    id: number;
    name: string;
}

export interface ExpenseDraft {
    meId: number;
    participants: Participant[];
    name: string;
    amount: number;
    amountRaw: string;
    currency: string;
    date: Date | string;
    isFullyPaidByMe: boolean;
    isSplitEqually: boolean;
    paidBy: Allocation[];
    split: Allocation[];
}

export type ExpenseDraftAction =
    | {type: EXPENSE_DRAFT_ACTIONS.NAME_CHANGED, value: string}
    | {type: EXPENSE_DRAFT_ACTIONS.AMOUNT_CHANGED, value: string}
    | {type: EXPENSE_DRAFT_ACTIONS.CURRENCY_CHANGED, value: string}
    | {type: EXPENSE_DRAFT_ACTIONS.DATE_CHANGED, value: Date}
    | {type: EXPENSE_DRAFT_ACTIONS.FULLY_PAID_BY_ME_CHANGED, checked: boolean}
    | {type: EXPENSE_DRAFT_ACTIONS.SPLIT_EQUALLY_CHANGED, checked: boolean}
    | {type: EXPENSE_DRAFT_ACTIONS.PARTICIPANT_SELECTED, side: ALLOCATION_SIDES, id: number, checked: boolean}
    | {type: EXPENSE_DRAFT_ACTIONS.ALLOCATION_AMOUNT_CHANGED, side: ALLOCATION_SIDES, id: number, value: string}
    | {type: EXPENSE_DRAFT_ACTIONS.ALLOCATION_PERCENT_CHANGED, side: ALLOCATION_SIDES, id: number, value: string};

export interface ExpenseDraftPayload {
    payers: {user_id: number, amount?: number}[];
    debtors: {user_id: number, amount?: number}[];
    users: number[];
    amount: number;
    description: string;
    currency: string;
    date: Date | string;
}

interface CreateExpenseDraft {
    me: Participant & {default_currency: string};
    expense: Expense | null;
    friends: Participant[];
}

const parseNumber = (value: string) => Number(value.replace(/,/g, "."));

const savedAllocations = (expense: Expense, key: "lent_amount" | "debt_amount"): Allocation[] =>
    expense.expense_users.map((expenseUser) => ({
        id: expenseUser.user.id,
        amount: Number(expenseUser[key]),
        amountRaw: String(expenseUser[key]),
        isSelected: Number(expenseUser[key]) !== 0,
        isDirty: false,
    }));

const emptyAllocations = (participants: Participant[]): Allocation[] =>
    participants.map(({id}) => ({id, isSelected: true, amount: 0, amountRaw: "0", isDirty: false}));

const currencyPrecision = (currency: string) => EXPENSE_CURRENCY_PRECISION[currency] ?? 2;

const roundToPrecision = (value: number, precision: number) => {
    const rounded = Number(value.toFixed(precision));
    return rounded === 0 ? 0 : rounded; // show "0", not "-0"
};

const equalAllocations = (draft: ExpenseDraft, amount: number, currency: string): Allocation[] => {
    const precision = currencyPrecision(currency);
    const parts = splitNumberIntoParts(amount, draft.participants.length, precision);
    return draft.participants.map(({id}, index) => ({
        id,
        isSelected: true,
        amount: parts[index],
        amountRaw: String(parts[index]),
        isDirty: false,
    }));
};

const paidInFullByMe = (draft: ExpenseDraft, amount: number, amountRaw: string): Allocation[] =>
    draft.participants.map(({id}) => ({
        id,
        isSelected: true,
        amount: id === draft.meId ? amount : 0,
        amountRaw: id === draft.meId ? amountRaw : "0",
        isDirty: false,
    }));

const updateAllocation = (
    draft: ExpenseDraft,
    side: ALLOCATION_SIDES,
    id: number,
    update: (allocation: Allocation) => Partial<Allocation>,
): ExpenseDraft => ({
    ...draft,
    [side]: draft[side].map((allocation) => allocation.id === id ?
        {...allocation, ...update(allocation), isDirty: true} :
        allocation),
});

export function createExpenseDraft({me, expense, friends}: CreateExpenseDraft): ExpenseDraft {
    if (!expense) {
        const participants = [me, ...friends];
        return {
            meId: me.id,
            participants,
            name: "",
            amount: 0,
            amountRaw: "",
            currency: me.default_currency,
            date: new Date(),
            isFullyPaidByMe: true,
            isSplitEqually: true,
            paidBy: emptyAllocations(participants),
            split: emptyAllocations(participants),
        };
    }

    const [first] = expense.expense_users;
    return {
        meId: me.id,
        participants: expense.expense_users.map(({user}) => user),
        name: expense.description ?? "",
        amount: Number(expense.amount ?? 0),
        amountRaw: String(Number(expense.amount)),
        currency: expense.currency ?? me.default_currency,
        date: expense.date ?? new Date(),
        isFullyPaidByMe: expense.expense_users.some(({user, lent_amount}) =>
            Number(lent_amount) === Number(expense.amount) && user.id === me.id),
        isSplitEqually: expense.expense_users.every(({debt_amount}) => debt_amount === first.debt_amount),
        paidBy: savedAllocations(expense, "lent_amount"),
        split: savedAllocations(expense, "debt_amount"),
    };
}

export function applyToExpenseDraft(draft: ExpenseDraft, action: ExpenseDraftAction): ExpenseDraft {
    switch (action.type) {
        case EXPENSE_DRAFT_ACTIONS.NAME_CHANGED:
            return action.value.length <= MAX_NAME_LENGTH ? {...draft, name: action.value} : draft;

        case EXPENSE_DRAFT_ACTIONS.AMOUNT_CHANGED: {
            if (action.value.length > MAX_AMOUNT_LENGTH) return draft;
            const amount = parseNumber(action.value);
            return {
                ...draft,
                amount,
                amountRaw: action.value,
                paidBy: draft.isFullyPaidByMe ? paidInFullByMe(draft, amount, action.value) : draft.paidBy,
                split: draft.isSplitEqually ? equalAllocations(draft, amount, draft.currency) : draft.split,
            };
        }

        case EXPENSE_DRAFT_ACTIONS.CURRENCY_CHANGED: {
            const currency = action.value;
            const isSplitUntouched = draft.split.every(({isDirty}) => !isDirty);
            const isPaidByUntouched = draft.paidBy.every(({isDirty}) => !isDirty);
            return {
                ...draft,
                currency,
                split: draft.isSplitEqually || isSplitUntouched ?
                    equalAllocations(draft, draft.amount, currency) :
                    draft.split,
                paidBy: !draft.isFullyPaidByMe && isPaidByUntouched ?
                    equalAllocations(draft, draft.amount, currency) :
                    draft.paidBy,
            };
        }

        case EXPENSE_DRAFT_ACTIONS.DATE_CHANGED:
            return {...draft, date: action.value};

        case EXPENSE_DRAFT_ACTIONS.FULLY_PAID_BY_ME_CHANGED:
            return {
                ...draft,
                isFullyPaidByMe: action.checked,
                paidBy: !action.checked && draft.amount ?
                    equalAllocations(draft, draft.amount, draft.currency) :
                    paidInFullByMe(draft, draft.amount || 0, draft.amount ? String(draft.amount) : "0"),
            };

        case EXPENSE_DRAFT_ACTIONS.SPLIT_EQUALLY_CHANGED:
            return {
                ...draft,
                isSplitEqually: action.checked,
                split: equalAllocations(draft, draft.amount, draft.currency),
            };

        case EXPENSE_DRAFT_ACTIONS.PARTICIPANT_SELECTED:
            return updateAllocation(draft, action.side, action.id, (allocation) => ({
                isSelected: action.checked,
                amount: action.checked ? allocation.amount : 0,
                amountRaw: action.checked ? allocation.amountRaw : "0",
            }));

        case EXPENSE_DRAFT_ACTIONS.ALLOCATION_AMOUNT_CHANGED:
            return updateAllocation(draft, action.side, action.id, () => ({
                amount: action.value ? parseNumber(action.value) : 0,
                amountRaw: action.value,
            }));

        case EXPENSE_DRAFT_ACTIONS.ALLOCATION_PERCENT_CHANGED: {
            const percent = action.value ? parseNumber(action.value) : 0;
            const amount = percent === 0 ? 0 : (draft.amount ? draft.amount * percent / 100 : 0);
            return updateAllocation(draft, action.side, action.id, () => ({
                amount,
                amountRaw: amount.toString(),
                percentRaw: action.value,
            }));
        }
    }
}

export interface AllocationProgress {
    /** Sum of the selected Allocations, rounded to the currency precision. */
    filled: number;
    /** Expense total minus `filled`, rounded to the currency precision. */
    left: number;
    /** Whether this side passes the same balance rule that Save uses. */
    isBalanced: boolean;
}

/** How far one side of the draft is from the expense total, as shown in the editor. */
export function allocationProgress(draft: ExpenseDraft, side: ALLOCATION_SIDES): AllocationProgress {
    const total = draft[side].reduce((sum, {isSelected, amount}) => isSelected && amount ? sum + amount : sum, 0);
    const precision = currencyPrecision(draft.currency);
    return {
        filled: roundToPrecision(total, precision),
        left: roundToPrecision(Number(draft.amount) - total, precision),
        isBalanced: isAllocationBalanced(draft.amount, draft[side]),
    };
}

export function canSaveExpenseDraft(draft: ExpenseDraft): boolean {
    return !!draft.currency && !!draft.name.trim() && dayjs(draft.date).isValid() &&
        allocationProgress(draft, ALLOCATION_SIDES.PAID_BY).isBalanced &&
        allocationProgress(draft, ALLOCATION_SIDES.SPLIT).isBalanced;
}

export function expenseDraftPayload(draft: ExpenseDraft): ExpenseDraftPayload {
    const toRequest = (allocations: Allocation[]) => allocations
        .map((allocation) => allocation.isSelected ? allocation : {...allocation, amount: 0})
        .map(({id, amount}) => ({user_id: id, amount}));

    return {
        payers: toRequest(draft.paidBy),
        debtors: toRequest(draft.split),
        users: Array.from(new Set([...draft.paidBy, ...draft.split].map(({id}) => id))),
        amount: Number(draft.amount),
        description: draft.name,
        currency: draft.currency,
        date: draft.date,
    };
}
