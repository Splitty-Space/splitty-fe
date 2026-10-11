"use client"

import React, {useCallback, useEffect, useReducer, useRef, useState} from "react";
import {useTranslation} from "react-i18next";
import classNames from "classnames";
import Header from "@/app/components/header/header";
import Main from "@/app/components/main/main";
import Loader from "@/app/components/loader/loader";
import {
    Button,
    Caption,
    Cell,
    Divider,
    Headline,
    IconContainer,
    Input,
    List,
    SegmentedControl,
    Switch,
    Text,
} from "@telegram-apps/telegram-ui";
import useMe from "@/services/useMe";
import {CurrencySelect} from "@/components/CurrencySelect";
import {DateTimePicker} from "@mui/x-date-pickers/DateTimePicker";
import dayjs, {Dayjs} from "dayjs";
import {ExpenseNameInputId} from "@/app/expense/add/focusOnExpenseNameInput";
import {addExpense} from "@/services/addExpense";
import {putExpense} from "@/services/putExpense";
import useFriends from "@/services/useFriends";
import handleInputFocus from "@/utils/handleInputFocus";
import {useStore} from "@/app/store";
import {useRouter} from "next/navigation";
import {expenseDetails} from "@/const/urls";
import Avatar from "@/app/components/avatar/Avatar";
import {vibration} from "@/utils/vibration";
import {Icon28Warning} from "@/Icons";
import {TEST_EXPENSE_ID} from "@/const/testExpenseId";
import {
    allocatedTotal,
    applyToExpenseDraft,
    canSaveExpenseDraft,
    createExpenseDraft,
    expenseDraftPayload,
    type Allocation,
    type AllocationSide,
    type ExpenseDraft,
    type ExpenseDraftAction,
} from "@/app/expense/expenseDraft";
import type {Expense} from "@/entities";
import "./addExpense.css";


enum NUMBER_MODES {
    AMOUNT = "AMOUNT",
    PERCENT = "PERCENT"
}

interface Editor {
    // The selected expense the draft was created from; a new one replaces the draft.
    source: Expense | null;
    draft: ExpenseDraft;
}

type EditorAction = {type: "draftCreated", editor: Editor} | ExpenseDraftAction;

function reduceEditor(editor: Editor | null, action: EditorAction): Editor | null {
    if (action.type === "draftCreated") return action.editor;
    return editor && {...editor, draft: applyToExpenseDraft(editor.draft, action)};
}

const percentOf = (allocation: Allocation | undefined, amount: number) =>
    allocation?.percentRaw ?? Number(allocation?.amountRaw) * 100 / amount;

export default function AddExpense() {
    const {t} = useTranslation();

    const {data: me} = useMe();

    const maxExpenseNameLength = 256;

    const [paidByMode, setPaidByMode] = useState<NUMBER_MODES>(NUMBER_MODES.AMOUNT);
    const [splitEquallyMode, setSplitEquallyMode] = useState<NUMBER_MODES>(NUMBER_MODES.AMOUNT);

    const searchValue = useStore((state) => state.searchValue);
    const selectedFriends = useStore((state) => state.selectedFriends);
    const selectedExpense = useStore((state) => state.selectedExpense);
    const setIsCreateExpenseSnackbarShown = useStore((state) => state.setIsCreateExpenseSnackbarShown);
    const setIsUpdateExpenseSnackbarShown = useStore((state) => state.setIsUpdateExpenseSnackbarShown);
    const setSelectedExpense = useStore((state) => state.setSelectedExpense);
    const isForceExpenseSaveEnabled = useStore((state) => state.isForceExpenseSaveEnabled);
    const setIsForceExpenseSaveEnabled = useStore((state) => state.setIsForceExpenseSaveEnabled);
    const showError = useStore((state) => state.setIsRequestErrorSnackbarShown);
    const saveInFlight = useRef(false);

    const {refetchFriends} = useFriends(searchValue);

    const [isSaveInProgress, setIsSaveInProgress] = useState(false);

    // The draft needs the current user, so it is created once the profile has loaded.
    const [editor, dispatch] = useReducer(reduceEditor, null);
    const isDraftOutdated = !!me && editor?.source !== selectedExpense;
    if (me && (editor === null || isDraftOutdated)) {
        dispatch({
            type: "draftCreated",
            editor: {
                source: selectedExpense,
                draft: createExpenseDraft({me, expense: selectedExpense, friends: selectedFriends}),
            },
        });
    }
    const draft = editor && !isDraftOutdated ? editor.draft : null;

    const isSaveDisabled = !draft || !canSaveExpenseDraft(draft);

    const router = useRouter();

    const onSave = useCallback(async () => {
        if (saveInFlight.current || !draft || isSaveDisabled) {
            return;
        }

        saveInFlight.current = true;
        setIsSaveInProgress(true);
        setIsForceExpenseSaveEnabled(false);

        const {payers, debtors, users, amount, description, currency, date} = expenseDraftPayload(draft);

        try {
            if (!selectedExpense || selectedExpense?.id === TEST_EXPENSE_ID) {
                const {data} = await addExpense({
                    payers,
                    debtors,
                    users,
                    amount,
                    payment: false,
                    currency,
                    date,
                    description,
                });
                setSelectedExpense(data);
                setIsCreateExpenseSnackbarShown(true);
            } else {
                await putExpense({
                    expense_id: selectedExpense.id,
                    payers,
                    debtors,
                    users,
                    amount,
                    description
                });
                setIsUpdateExpenseSnackbarShown(true);
            }
            // A refresh failure must not turn a confirmed write into a retryable write.
            await refetchFriends().catch(() => showError(true));
            if (!selectedExpense || selectedExpense.id === TEST_EXPENSE_ID) router.replace(expenseDetails);
            else router.push(expenseDetails);
        } catch {
            saveInFlight.current = false;
            setIsSaveInProgress(false);
            showError(true);
        }
    }, [draft, isSaveDisabled, refetchFriends, router, selectedExpense, setIsCreateExpenseSnackbarShown, setIsUpdateExpenseSnackbarShown, setSelectedExpense, setIsForceExpenseSaveEnabled, showError]);

    // The tour's save request is consumed on first sight and only ever saves the tutorial expense,
    // so a leftover request cannot save a real expense while the user is still typing it.
    useEffect(() => {
        if (!isForceExpenseSaveEnabled) return;
        setIsForceExpenseSaveEnabled(false);
        if (selectedExpense?.id === TEST_EXPENSE_ID) {
            void onSave();
        }
    }, [isForceExpenseSaveEnabled, onSave, selectedExpense, setIsForceExpenseSaveEnabled]);

    if (!draft) {
        return <Loader/>;
    }

    const {participants} = draft;
    const currentPaidMoneyAmount = allocatedTotal(draft, "paidBy");
    const currentSplitBetweenMoneyAmount = allocatedTotal(draft, "split");
    const findAllocation = (side: AllocationSide, id: number) => draft[side].find(x => x.id === id);

    const onDateChange = (newDate: Dayjs | null) => {
        if (newDate) {
            dispatch({type: "dateChanged", value: newDate.toDate()});
        }
    };

    const onFullyPaidByYouChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        vibration();
        dispatch({type: "fullyPaidByMeChanged", checked: e.target.checked});
    };

    const onSplitEquallyBetweenAllChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        vibration();
        dispatch({type: "splitEquallyChanged", checked: e.target.checked});
    };

    const onParticipantSelected = (side: AllocationSide, id: number) => (e: React.ChangeEvent<HTMLInputElement>) => {
        vibration();
        dispatch({type: "participantSelected", side, id, checked: e.target.checked});
    };

    const onAllocationAmountChange = (side: AllocationSide, id: number) => (e: React.ChangeEvent<HTMLInputElement>) =>
        dispatch({type: "allocationAmountChanged", side, id, value: e.target.value});

    const onAllocationPercentChange = (side: AllocationSide, id: number) => (e: React.ChangeEvent<HTMLInputElement>) =>
        dispatch({type: "allocationPercentChanged", side, id, value: e.target.value});

    return (
        <>
            <Header
                LeftComponent={() => (
                    <Button
                        size="l"
                        mode="plain"
                        disabled
                        className="invisible"
                    >
                        {t("expenses.Prev")}
                    </Button>
                )}
                CentralComponent={({className}) =>
                    <Headline className={className} weight="3">{
                        !selectedExpense ?
                            t("expenses.AddAnExpense") :
                            t("expenses.EditAnExpense")}
                    </Headline>}
                RightComponent={() => (
                    <Button
                        size="l"
                        mode="plain"
                        onClick={onSave}
                        disabled={isSaveDisabled || isSaveInProgress}
                        loading={isSaveInProgress}
                        id="expense-add-save-button"
                    >
                        {t("expenses.Save")}
                    </Button>
                )}
            />

            <Main id="expense-add-main" className="px-4">
                <div className="mb-5 flex flex-col items-center justify-center">
                    <div className="flex max-w-full overflow-auto pl-4">
                        {participants?.map(({id}) =>
                            <Avatar
                                key={id}
                                // @ts-ignore
                                size={64}
                                user_id={id}
                                style={{
                                    marginLeft: "-1rem"
                                }}
                            />)}
                    </div>
                </div>

                <div id="expense-add-name-and-money">
                    <Input
                        id={ExpenseNameInputId}
                        value={draft.name}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => dispatch({type: "nameChanged", value: e.target.value})}
                        maxLength={maxExpenseNameLength}
                        placeholder={t("expenses.ExpenseName")}
                        className="mb-2"
                        status={draft.name.length < 3 ? "error" : "default"}
                    />

                    <div className="flex items-center justify-between">
                        <div className="grow mr-1">
                            <Input
                                id="moneySpentInput"
                                type="text"
                                inputMode="decimal"
                                value={draft.amountRaw}
                                onChange={(e: React.ChangeEvent<HTMLInputElement>) => dispatch({type: "amountChanged", value: e.target.value})}
                                placeholder={t("expenses.MoneySpent")}
                                status={(draft.amount && draft.amount > 0) ? "default" : "error"}
                            />
                        </div>
                        <CurrencySelect
                            defaultCurrency={draft.currency}
                            onChange={(e: React.ChangeEvent<HTMLInputElement>) => dispatch({type: "currencyChanged", value: e.target.value})}
                            disabled={!!selectedExpense}
                        />
                    </div>
                </div>

                <List
                    id="expense-add-date-and-switches"
                    className="mt-4 py-0 w-full rounded-3xl"
                    style={{
                        background: "var(--tgui--bg_color)",
                    }}>
                    <Cell
                        className="p-0 addExpense__cell"
                        after={
                            <DateTimePicker
                                value={dayjs(draft.date)}
                                onChange={onDateChange}
                                disabled={!!selectedExpense}
                                className="w-52 rounded-3xl"
                            />}
                    >
                        {t("expenses.DateAndTime")}
                    </Cell>
                    <Divider className="!m-0"/>

                    <Cell
                        className="p-0 addExpense__cell"
                        after={
                            <Switch
                                disabled={!(draft.amount && draft.amount > 0)}
                                checked={draft.isFullyPaidByMe}
                                onChange={onFullyPaidByYouChange}
                                style={{"backgroundColor": "red"}}
                            />
                        }
                    >
                        {t("expenses.FullyPaidByYou")}
                    </Cell>
                    <Divider className="!m-0"/>


                    <Cell
                        className="p-0 addExpense__cell"
                        after={
                            <Switch
                                disabled={!(draft.amount && draft.amount > 0)}
                                checked={draft.isSplitEqually}
                                onChange={onSplitEquallyBetweenAllChange}
                            />
                        }
                    >
                        {t("expenses.SplitEquallyBetweenAll")}
                    </Cell>
                </List>

                {!draft.isFullyPaidByMe &&
                    <div className="mb-4" id="expense-add-paid-by">
                        <div className="mt-4 flex items-center justify-between">
                            <Headline weight="3">{t("expenses.PaidBy")}</Headline>

                            <SegmentedControl className="w-36">
                                <SegmentedControl.Item
                                    className="overflow-visible"
                                    onClick={() => {
                                        setPaidByMode(NUMBER_MODES.AMOUNT);
                                    }}
                                    selected={paidByMode === NUMBER_MODES.AMOUNT}
                                >
                                    1.23
                                </SegmentedControl.Item>
                                <SegmentedControl.Item
                                    onClick={() => {
                                        setPaidByMode(NUMBER_MODES.PERCENT);
                                    }}
                                    selected={paidByMode === NUMBER_MODES.PERCENT}
                                >
                                    %
                                </SegmentedControl.Item>
                            </SegmentedControl>
                        </div>

                        <Divider className="mt-2 border-2"/>

                        {Number(draft.amount) > 0 && (Number(draft.amount) - currentPaidMoneyAmount) !== 0 &&
                            <div className="flex items-center bg-surface_dark rounded-lg p-2 mt-4">
                                <IconContainer className="ml-2 red">
                                    <Icon28Warning/>
                                </IconContainer>

                                <div className="flex flex-col ml-4">
                                    <Caption level="1" weight="3">
                                        {`${currentPaidMoneyAmount} ${t("expenses.Of")} ${draft.amount} ${draft.currency} ${t("expenses.Filled")}`}
                                    </Caption>
                                    <Caption level="1" weight="3">
                                        {`${Number(draft.amount) - currentPaidMoneyAmount} ${draft.currency} ${t("expenses.Left")}`}
                                    </Caption>
                                </div>
                            </div>}

                        <List className="mt-4 w-full rounded-3xl px-0">
                            {participants.map(({id, name}) => {

                                const isItemSelected = findAllocation("paidBy", id)?.isSelected;

                                return (<div key={id} className="flex items-center justify-between">
                                    <div className="flex items-center w-1/2">
                                        <Switch
                                            className="shrink-0"
                                            checked={!!isItemSelected}
                                            onChange={onParticipantSelected("paidBy", id)}
                                        />

                                        <Avatar
                                            size={48}
                                            user_id={id}
                                            className={classNames("ml-2", {
                                                "opacity-50": !isItemSelected
                                            })}
                                        />

                                        <Text className={classNames("ml-4 overflow-hidden text-ellipsis", {
                                            "hint_color": !isItemSelected
                                        })}>
                                            {name}
                                        </Text>
                                    </div>

                                    {paidByMode === NUMBER_MODES.AMOUNT ?
                                        <Input
                                            type="text"
                                            inputMode="decimal"
                                            maxLength={15}
                                            value={findAllocation("paidBy", id)?.amountRaw}
                                            onChange={onAllocationAmountChange("paidBy", id)}
                                            className="w-36 ml-auto"
                                            status={currentPaidMoneyAmount !== draft.amount && isItemSelected ? "error" : undefined}
                                            disabled={!isItemSelected}
                                            onFocus={handleInputFocus()}
                                            after={
                                                <Caption
                                                    level="1"
                                                    weight="3"
                                                >
                                                    {draft.currency}
                                                </Caption>}
                                        /> : <Input
                                            type="text"
                                            inputMode="decimal"
                                            maxLength={15}
                                            value={percentOf(findAllocation("paidBy", id), draft.amount)}
                                            onChange={onAllocationPercentChange("paidBy", id)}
                                            className="w-36 ml-auto"
                                            status={currentPaidMoneyAmount !== draft.amount && isItemSelected ? "error" : undefined}
                                            disabled={!isItemSelected}
                                            onFocus={handleInputFocus()}
                                            after={
                                                <Caption
                                                    level="1"
                                                    weight="3"
                                                >
                                                    %
                                                </Caption>}
                                        />}

                                </div>)
                            })}
                        </List>
                    </div>
                }

                {
                    !draft.isSplitEqually &&
                    <div className="mb-4" id="expense-add-split-equally">
                        <div className="mt-4 flex items-center justify-between">
                            <Headline weight="3">{t("expenses.Split")}</Headline>

                            <SegmentedControl className="w-36">
                                <SegmentedControl.Item
                                    className="overflow-visible"
                                    onClick={() => {
                                        setSplitEquallyMode(NUMBER_MODES.AMOUNT);
                                    }}
                                    selected={splitEquallyMode === NUMBER_MODES.AMOUNT}
                                >
                                    1.23
                                </SegmentedControl.Item>
                                <SegmentedControl.Item
                                    onClick={() => {
                                        setSplitEquallyMode(NUMBER_MODES.PERCENT);
                                    }}
                                    selected={splitEquallyMode === NUMBER_MODES.PERCENT}
                                >
                                    %
                                </SegmentedControl.Item>
                            </SegmentedControl>
                        </div>
                        <Divider className="mt-2 border-2"/>

                        {Number(draft.amount) > 0 && (Number(draft.amount) - currentSplitBetweenMoneyAmount) !== 0 &&
                            <div className="flex items-center bg-surface_dark rounded-lg p-2 mt-4">
                                <IconContainer className="ml-2 red">
                                    <Icon28Warning/>
                                </IconContainer>

                                <div className="flex flex-col ml-4">
                                    <Caption level="1" weight="3">
                                        {`${currentSplitBetweenMoneyAmount} ${t("expenses.Of")} ${draft.amount} ${draft.currency} ${t("expenses.Filled")}`}
                                    </Caption>
                                    <Caption level="1" weight="3">
                                        {`${Number(draft.amount) - currentSplitBetweenMoneyAmount} ${draft.currency} ${t("expenses.Left")}`}
                                    </Caption>
                                </div>
                            </div>}

                        <List className="mt-4 w-full rounded-3xl px-0">
                            {participants?.map(({id, name}) => {
                                    const isItemSelected = findAllocation("split", id)?.isSelected;

                                    return (<div key={id} className="flex items-center justify-between">
                                        <div className="flex items-center w-1/2">
                                            <Switch
                                                className="shrink-0"
                                                checked={!!isItemSelected}
                                                onChange={onParticipantSelected("split", id)}
                                            />

                                            <Avatar
                                                size={48}
                                                user_id={id}
                                                className={classNames("ml-2", {
                                                    "opacity-50": !isItemSelected
                                                })}
                                            />

                                            <Text className={classNames("ml-4 overflow-hidden text-ellipsis", {
                                                "hint_color": !isItemSelected
                                            })}>
                                                {name}
                                            </Text>
                                        </div>

                                        {splitEquallyMode === NUMBER_MODES.AMOUNT ?
                                            <Input
                                                type="text"
                                                inputMode="decimal"
                                                maxLength={15}
                                                value={findAllocation("split", id)?.amountRaw}
                                                onChange={onAllocationAmountChange("split", id)}
                                                className="w-36 ml-auto"
                                                status={currentSplitBetweenMoneyAmount !== draft.amount ? "error" : undefined}
                                                disabled={!isItemSelected}
                                                onFocus={handleInputFocus()}
                                                after={
                                                    <Caption
                                                        level="1"
                                                        weight="3"
                                                    >
                                                        {draft.currency}
                                                    </Caption>}
                                            /> : <Input
                                                type="text"
                                                inputMode="decimal"
                                                maxLength={15}
                                                value={percentOf(findAllocation("split", id), draft.amount)}
                                                onChange={onAllocationPercentChange("split", id)}
                                                className="w-36 ml-auto"
                                                status={currentSplitBetweenMoneyAmount !== draft.amount ? "error" : undefined}
                                                disabled={!isItemSelected}
                                                onFocus={handleInputFocus()}
                                                after={
                                                    <Caption
                                                        level="1"
                                                        weight="3"
                                                    >
                                                        %
                                                    </Caption>}
                                            />}
                                    </div>)
                                }
                            )}
                        </List>
                    </div>
                }
            </Main>
        </>
    );
}
