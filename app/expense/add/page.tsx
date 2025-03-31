"use client"

import React, {useEffect, useState} from "react";
import {useTranslation} from "react-i18next";
import classNames from "classnames";
import Header from "@/app/components/header/header";
import Main from "@/app/components/main/main";
import {
    Button,
    Caption,
    Cell,
    Divider,
    Headline,
    IconContainer,
    Input,
    List,
    Switch,
    Text,
} from "@telegram-apps/telegram-ui";
import useMe from "@/services/useMe";
import {CurrencySelect} from "@/components/CurrencySelect";
import {DateTimePicker} from "@mui/x-date-pickers/DateTimePicker";
import dayjs, {Dayjs} from "dayjs";
import {splitNumberIntoParts} from "@/utils/splitNumberIntoParts";
import {addExpense} from "@/services/addExpense";
import {putExpense} from "@/services/putExpense";
import useFriends from "@/services/useFriends";
import {useStore} from "@/app/store";
import {useRouter} from "next/navigation";
import {expenseDetails, friendsList} from "@/const/urls";
import Avatar from "@/app/components/avatar/Avatar";
import {vibration} from "@/utils/vibration";
import "./addExpense.css";
import {Icon28Warning} from "@/Icons";

interface Payment {
    id: number;
    isSelected: boolean;
    amount?: number;
    isDirty: boolean;
}

export default function AddExpense() {
    const {t} = useTranslation();

    const {data: me} = useMe();

    const maxExpenseNameLength = 256;
    const maxMoneySpentLength = 256;

    const searchValue = useStore((state) => state.searchValue);
    const selectedFriends = useStore((state) => state.selectedFriends);
    const selectedExpense = useStore((state) => state.selectedExpense);
    const setIsCreateExpenseSnackbarShown = useStore((state) => state.setIsCreateExpenseSnackbarShown);
    const setIsUpdateExpenseSnackbarShown = useStore((state) => state.setIsUpdateExpenseSnackbarShown);

    const {refetchFriends} = useFriends(searchValue);

    const participants = selectedExpense?.expense_users.map(expense => expense.user) ?? (me ? [me, ...selectedFriends] : [...selectedFriends]);

    const [isSaveDisabled, setIsSaveDisabled] = useState(true);
    const [isSaveInProgress, setIsSaveInProgress] = useState(false);

    const [expenseName, setExpenseName] = useState(selectedExpense?.description ?? "");

    const [moneySpent, setMoneySpent] = useState<number | null>(Number(selectedExpense?.amount) ?? null);
    const [rawMoneySpent, setRawMoneySpent] = useState<string | null>(null);
    const [currency, setCurrency] = useState<string | undefined>();

    const [date, setDate] = useState(selectedExpense?.date ?? new Date());

    const [isFullyPaidByYou, setIsFullyPaidByYou] = useState<boolean | undefined>();
    const [paidBy, setPaidBy] = useState<Payment[]>(selectedExpense ?
        selectedExpense.expense_users.map((expense) => ({
            id: expense.user.id,
            amount: Number(expense.lent_amount),
            isSelected: Number(expense.lent_amount) !== 0,
            isDirty: false,
        })) :
        participants.map((x) => ({
            id: x.id,
            isSelected: true,
            amount: 0,
            isDirty: false,
        })));

    const [isSplitEquallyBetweenAll, setIsSplitEquallyBetweenAll] = useState(selectedExpense ?
        selectedExpense.expense_users.every(e => e.debt_amount === selectedExpense.expense_users[0].debt_amount) :
        true);
    const [splitBetween, setSplitBetween] = useState<Payment[]>(selectedExpense ?
        selectedExpense.expense_users.map((expense) => ({
            id: expense.user.id,
            amount: Number(expense.debt_amount),
            isSelected: Number(expense.debt_amount) !== 0,
            isDirty: false,
        })) :
        participants.map((x) => ({
            id: x.id,
            isSelected: true,
            amount: 0,
            isDirty: false,
        })));

    const currentPaidMoneyAmount = paidBy.reduce((acc, value) => value.isSelected && value.amount ? acc + value.amount : acc, 0);
    const currentSplitBetweenMoneyAmount = splitBetween.reduce((acc, value) => value.isSelected && value.amount ? acc + value.amount : acc, 0);

    useEffect(() => {
        if (me) {
            setCurrency(selectedExpense?.currency ?? me?.default_currency);
            setIsFullyPaidByYou(selectedExpense ?
                selectedExpense.expense_users
                    .some(e => Number(e.lent_amount) === Number(selectedExpense?.amount) && e.user.id === me.id) : true);
        }
    }, [me, selectedExpense]);

    useEffect(() => {
        if (expenseName.length > 0 &&
            moneySpent && moneySpent > 0 &&
            (isFullyPaidByYou || paidBy.some(x => x.isSelected)) &&
            currentPaidMoneyAmount === moneySpent &&
            (isSplitEquallyBetweenAll || splitBetween.some(x => x.isSelected))
        ) {
            setIsSaveDisabled(false);
        } else {
            setIsSaveDisabled(true);
        }
    }, [expenseName, isFullyPaidByYou, isSplitEquallyBetweenAll, moneySpent, paidBy, splitBetween, currentPaidMoneyAmount]);

    const router = useRouter();

    const onSave = () => {
        if (isSaveInProgress) {
            return;
        }

        setIsSaveInProgress(true);

        const payers = paidBy
            .map(x => x.isSelected ? x : {...x, amount: 0})
            .map((x) => ({user_id: x.id, amount: x.amount}));
        const debtors = splitBetween
            .map(x => x.isSelected ? x : {...x, amount: 0})
            .map((x) => ({user_id: x.id, amount: x.amount}));
        const users = Array.from(new Set([...paidBy, ...splitBetween].map((x) => x.id)));
        const amount = Number(moneySpent);
        const description = expenseName;

        if (!selectedExpense) {
            addExpense({
                payers,
                debtors,
                users,
                amount,
                payment: false,
                currency,
                date,
                description,
            })
                .then(() => refetchFriends())
                .then(() => setIsCreateExpenseSnackbarShown(true))
                .then(() => router.push(friendsList));
        } else {
            putExpense({
                expense_id: selectedExpense.id,
                payers,
                debtors,
                users,
                amount,
                description
            })
                .then(() => refetchFriends())
                .then(() => setIsUpdateExpenseSnackbarShown(true))
                .then(() => router.push(expenseDetails));
        }
    };

    const onExpenseNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.value.length <= maxExpenseNameLength) {
            setExpenseName(e.target.value);
        }
    };

    const onMoneySpentChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setRawMoneySpent(e.target.value);

        if (e.target.value.length > maxMoneySpentLength) {
            return;
        }

        const amount = Number(e.target.value.replace(/,/g, "."));
        const moneySpent = amount === 0 ? null : amount;
        setMoneySpent(moneySpent);

        if (isFullyPaidByYou) {
            setPaidBy(participants.map((x, index) => ({
                id: x.id,
                isSelected: true,
                amount: index === 0 ? amount : 0,
                isDirty: false,
            })));
        }

        if (isSplitEquallyBetweenAll) {
            const parts = splitNumberIntoParts(amount, participants.length);

            setSplitBetween(participants.map((x, index) => ({
                id: x.id,
                isSelected: true,
                amount: parts[index],
                isDirty: false,
            })));
        }
    };

    const onCurrencyChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setCurrency(e.target.value);
    };

    const onDateChange = (newDate: Dayjs | null) => {
        if (newDate) {
            setDate(newDate?.toDate());
        }
    };

    const onFullyPaidByYouChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setIsFullyPaidByYou(e.target.checked);

        vibration();

        if (!e.target.checked && moneySpent) {
            const parts = splitNumberIntoParts(moneySpent, participants.length);

            setPaidBy(participants.map((x, index) => ({
                id: x.id,
                isSelected: true,
                amount: parts[index],
                isDirty: false,
            })));
        } else {
            setPaidBy(participants.map((x, index) => ({
                id: x.id,
                isSelected: true,
                amount: index === 0 && moneySpent ? Number(moneySpent) : 0,
                isDirty: false,
            })));
        }
    };

    const onPaidByChange = (id: number) => (e: React.ChangeEvent<HTMLInputElement>) => {
        vibration();

        setPaidBy(paidBy => paidBy.map(x => x.id === id ? {
            ...x,
            isSelected: e.target.checked,
            amount: e.target.checked ? x.amount : 0,
            isDirty: true,
        } : x));
    };

    const onPaidByAmountChange = (id: number) => (e: React.ChangeEvent<HTMLInputElement>) => {
        setPaidBy(paidBy.map(x => x.id === id ? {
            ...x,
            amount: e.target.value ? Number(e.target.value.replace(",", ".")) : undefined,
            isDirty: true,
        } : x));
    };

    const onSplitEquallyBetweenAllChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setIsSplitEquallyBetweenAll(e.target.checked);

        vibration();

        const parts = splitNumberIntoParts(moneySpent ? Number(moneySpent) : 0, participants.length);
        if (!e.target.checked && moneySpent) {
            setSplitBetween(participants.map((x, index) => ({
                id: x.id,
                isSelected: true,
                amount: parts[index],
                isDirty: false,
            })));
        } else {
            setSplitBetween(participants.map((x, index) => ({
                id: x.id,
                isSelected: true,
                amount: parts[index],
                isDirty: false,
            })));
        }
    };

    const onSplitBetweenChange = (id: number) => (e: React.ChangeEvent<HTMLInputElement>) => {
        vibration();

        setSplitBetween(splitBetween => splitBetween.map(x => x.id === id ? {
            ...x,
            isSelected: e.target.checked,
            amount: e.target.checked ? x.amount : 0,
            isDirty: true,
        } : x));
    };

    const onSplitBetweenAmountChange = (id: number) => (e: React.ChangeEvent<HTMLInputElement>) => {
        setSplitBetween(splitBetween.map(x => x.id === id ? {
            ...x,
            amount: e.target.value ? Number(e.target.value.replace(",", ".")) : undefined,
            isDirty: true,
        } : x));
    };

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
                CentralComponent={() =>
                    <Headline weight="3">{
                        !selectedExpense ?
                            t("expenses.AddAnExpense") :
                            t("expenses.EditAnExpense")}
                    </Headline>}
                RightComponent={() => (
                    <Button
                        size="l"
                        mode="plain"
                        onClick={onSave}
                        disabled={isSaveDisabled}
                        loading={isSaveInProgress}
                    >
                        {t("expenses.Save")}
                    </Button>
                )}
            />

            <Main className="px-4">
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

                <div>
                    <Input
                        autoFocus
                        value={expenseName}
                        onChange={onExpenseNameChange}
                        maxLength={maxExpenseNameLength}
                        placeholder={t("expenses.ExpenseName")}
                        className="mb-2"
                        status={expenseName.length < 3 ? "error" : "default"}
                    />

                    <div className="flex items-center justify-between">
                        <div className="grow mr-1">
                            <Input
                                // type="number"
                                inputMode="decimal"
                                // step="any"
                                // @ts-ignore
                                value={moneySpent}
                                onChange={onMoneySpentChange}
                                // maxLength={maxMoneySpentLength}
                                placeholder={t("expenses.MoneySpent")}
                                status={(moneySpent && moneySpent > 0) ? "default" : "error"}
                            />
                        </div>
                        <CurrencySelect
                            defaultCurrency={currency}
                            onChange={onCurrencyChange}
                            disabled={!!selectedExpense}
                        />
                    </div>

                    <div>{rawMoneySpent}</div>

                    <div>{
                        rawMoneySpent?.split("").map(((x, index) => <span key={index} className="m-4">{x.charCodeAt(0)}</span>))
                    }</div>
                </div>

                <List
                    className="mt-4 w-full rounded-3xl"
                    style={{
                        background: "var(--tgui--bg_color)",
                    }}>
                <Cell
                        className="p-0 addExpense__cell"
                        after={
                            <DateTimePicker
                                disabled={!!selectedExpense}
                                value={dayjs(date)}
                                onChange={onDateChange}
                                className="max-w-60 min-w-48 rounded-3xl"
                            />}
                    >
                        {t("expenses.DateAndTime")}
                    </Cell>
                    <Divider/>

                    {typeof isFullyPaidByYou === "boolean" &&
                        <>
                            <Cell
                                className="p-0 addExpense__cell"
                                after={
                                    <Switch
                                        defaultChecked={isFullyPaidByYou}
                                        onChange={onFullyPaidByYouChange}
                                        style={{"backgroundColor": "red"}}
                                    />
                                }
                            >
                                {t("expenses.FullyPaidByYou")}
                            </Cell>
                            <Divider/>
                        </>
                    }

                    <Cell
                        className="p-0 addExpense__cell"
                        after={
                            <Switch
                                defaultChecked={isSplitEquallyBetweenAll}
                                onChange={onSplitEquallyBetweenAllChange}
                            />
                        }
                    >
                        {t("expenses.SplitEquallyBetweenAll")}
                    </Cell>
                </List>

                {!isFullyPaidByYou &&
                    <div className="mb-4">
                        <div className="mt-4 flex items-center justify-between">
                            <Headline weight="3">{t("expenses.PaidBy")}:</Headline>
                        </div>
                        <Divider className="mt-2 border-2"/>

                        {Number(moneySpent) > 0 && (Number(moneySpent) - currentPaidMoneyAmount) !== 0 &&
                            <div className="flex items-center bg-surface_dark rounded-lg p-2 mt-4">
                                <IconContainer className="ml-2 red">
                                    <Icon28Warning/>
                                </IconContainer>

                                <div className="flex flex-col ml-4">
                                    <Caption level="1" weight="3">
                                        {`${currentPaidMoneyAmount} ${t("expenses.Of")} ${moneySpent} ${currency} ${t("expenses.Filled")}`}
                                    </Caption>
                                    <Caption level="1" weight="3">
                                        {`${Number(moneySpent) - currentPaidMoneyAmount} ${currency} ${t("expenses.Left")}`}
                                    </Caption>
                                </div>
                            </div>}

                        <List className="mt-4 w-full rounded-3xl px-0">
                            {participants.map(({id, name}) => {

                                const isItemSelected = paidBy.find(x => x.id === id)?.isSelected;

                                return (<div key={id} className="flex items-center justify-between">
                                    <div className="flex items-center w-1/2">
                                        <Switch
                                            className="shrink-0"
                                            defaultChecked={isItemSelected}
                                            onChange={onPaidByChange(id)}
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

                                    <Input
                                        value={paidBy.find(x => x.id === id)?.amount}
                                        onChange={onPaidByAmountChange(id)}
                                        type="number"
                                        inputMode="decimal"
                                        step="any"
                                        className="w-36 ml-auto"
                                        status={currentPaidMoneyAmount !== moneySpent && isItemSelected ? "error" : undefined}
                                        disabled={!isItemSelected}
                                        after={
                                            <Caption
                                                level="1"
                                                weight="3"
                                            >
                                                {currency}
                                            </Caption>}
                                    />

                                </div>)
                            })}
                        </List>
                    </div>
                }

                {
                    !isSplitEquallyBetweenAll &&
                    <div className="mb-4">
                        <div className="mt-4 flex items-center justify-between">
                            <Headline weight="3">{t("expenses.Split")}:</Headline>

                            <Headline weight="3" className="invisible">{t("expenses.Split")}:</Headline>
                        </div>
                        <Divider className="mt-2 border-2"/>

                        {Number(moneySpent) > 0 && (Number(moneySpent) - currentSplitBetweenMoneyAmount) !== 0 &&
                            <div className="flex items-center bg-surface_dark rounded-lg p-2 mt-4">
                                <IconContainer className="ml-2 red">
                                    <Icon28Warning/>
                                </IconContainer>

                                <div className="flex flex-col ml-4">
                                    <Caption level="1" weight="3">
                                        {`${currentSplitBetweenMoneyAmount} ${t("expenses.Of")} ${moneySpent} ${currency} ${t("expenses.Filled")}`}
                                    </Caption>
                                    <Caption level="1" weight="3">
                                        {`${Number(moneySpent) - currentSplitBetweenMoneyAmount} ${currency} ${t("expenses.Left")}`}
                                    </Caption>
                                </div>
                            </div>}

                        <List className="mt-4 w-full rounded-3xl px-0">
                            {participants?.map(({id, name}) => {
                                    const isItemSelected = splitBetween.find(x => x.id === id)?.isSelected;

                                    return (<div key={id} className="flex items-center justify-between">
                                        <div className="flex items-center w-1/2">
                                            <Switch
                                                className="shrink-0"
                                                defaultChecked={isItemSelected}
                                                onChange={onSplitBetweenChange(id)}
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

                                        <Input
                                            value={splitBetween.find(x => x.id === id)?.amount}
                                            onChange={onSplitBetweenAmountChange(id)}
                                            type="number"
                                            inputMode="decimal"
                                            step="any"
                                            className="w-36 ml-auto"
                                            status={currentSplitBetweenMoneyAmount !== moneySpent ? "error" : undefined}
                                            disabled={!isItemSelected}
                                            after={
                                                <Caption
                                                    level="1"
                                                    weight="3"
                                                >
                                                    {currency}
                                                </Caption>}
                                        />
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