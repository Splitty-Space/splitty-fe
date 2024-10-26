"use client"

import React, {useEffect, useState} from "react";
import {useTranslation} from "react-i18next";
import Header from "@/app/main/header/header";
import {
    Avatar,
    AvatarStack,
    Button, Caption,
    Cell,
    Divider, Headline,
    Input,
    List,
    Switch,
    Text,
    Title,
} from "@telegram-apps/telegram-ui";
import {TabIds} from "@/const/tabIds";
import {Friend} from "@/entities";
import {Me} from "@/services/useMe";
import {CurrencySelect} from "@/components/CurrencySelect";
import {DatePicker} from "@mui/x-date-pickers/DatePicker";
import dayjs, {Dayjs} from "dayjs";
import {splitNumberIntoParts} from "@/utils/splitNumberIntoParts";
import {addExpense} from "@/services/addExpense";
import "./addExpense.css";

interface Payment {
    id: number;
    isSelected: boolean;
    amount?: number;
    isDirty: boolean;
}

export default function AddExpense({selectedFriends, refetchFriends, setCurrentTab, me}: {
    selectedFriends: Friend[],
    refetchFriends: Function,
    setCurrentTab: Function,
    me: Me
}) {
    const {t} = useTranslation();

    const participants = [me, ...selectedFriends];

    const [isSaveDisabled, setIsSaveDisabled] = useState(true);
    const [isSaveInProgress, setIsSaveInProgress] = useState(false);

    const [expenseName, setExpenseName] = useState("");

    const [moneySpent, setMoneySpent] = useState<number | null>();
    const [currency, setCurrency] = useState(me?.default_currency);

    const [date, setDate] = useState(new Date());

    const [isFullyPaidByYou, setIsFullyPaidByYou] = useState(true);
    const [paidBy, setPaidBy] = useState<Payment[]>(participants.map((x) => ({
        id: x.id,
        isSelected: true,
        amount: 0,
        isDirty: false,
    })));

    const [isSplitEquallyBetweenAll, setIsSplitEquallyBetweenAll] = useState(true);
    const [splitBetween, setSplitBetween] = useState<Payment[]>(participants.map((x) => ({
        id: x.id,
        isSelected: true,
        amount: 0,
        isDirty: false,
    })));

    const currentPaidMoneyAmount = paidBy.reduce((acc, value) => value.isSelected && value.amount ? acc + value.amount : acc, 0);
    const currentSplitBetweenMoneyAmount = splitBetween.reduce((acc, value) => value.isSelected && value.amount ? acc + value.amount : acc, 0);

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

    const onPrev = () => {
        setCurrentTab(TabIds.AddExpenseParticipants);
    };

    const onSave = () => {
        if (isSaveInProgress){
            return;
        }

        setIsSaveInProgress(true);

        addExpense({
            payers: paidBy
                .filter(x => x.isSelected)
                .map((x) => ({user_id: x.id, amount: x.amount})),
            debtors: splitBetween
                .filter(x => x.isSelected)
                .map((x) => ({user_id: x.id, amount: x.amount})),
            users: Array.from(new Set([...paidBy, ...splitBetween].filter(x => x.isSelected).map((x) => x.id))),
            amount: Number(moneySpent),
            payment: false,
            currency,
            date,
            description: expenseName
        }).then(() => {
            refetchFriends();
            setCurrentTab(TabIds.Friends);
        });
    };

    const onExpenseNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setExpenseName(e.target.value);
    };

    const onMoneySpentChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const amount = Number(e.target.value.replace(/[^0-9]/g, ""))
        const moneySpent = amount === 0 ? null : amount
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
        setPaidBy(paidBy.map(x => x.id === id ? {
            ...x,
            isSelected: e.target.checked,
            isDirty: true,
        } : x));
    };

    const onPaidByAmountChange = (id: number) => (e: React.ChangeEvent<HTMLInputElement>) => {
        setPaidBy(paidBy.map(x => x.id === id ? {
            ...x,
            amount: e.target.value ? Number(e.target.value) : undefined,
            isDirty: true,
        } : x));
    };

    const onSplitEquallyBetweenAllChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setIsSplitEquallyBetweenAll(e.target.checked);

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
        setSplitBetween(splitBetween.map(x => x.id === id ? {
            ...x,
            isSelected: e.target.checked,
            isDirty: true,
        } : x));
    };

    const onSplitBetweenAmountChange = (id: number) => (e: React.ChangeEvent<HTMLInputElement>) => {
        setSplitBetween(splitBetween.map(x => x.id === id ? {
            ...x,
            amount: e.target.value ? Number(e.target.value) : undefined,
            isDirty: true,
        } : x));
    };

    return (
        <>
            <Header
                layoutClassName="p-0 py-4"
                LeftComponent={() => (
                    <Button
                        size="l"
                        mode="plain"
                        onClick={onPrev}
                    >
                        {t("expenses.Prev")}
                    </Button>
                )}
                CentralComponent={() => <Title>{t("expenses.AddAnExpense")}</Title>}
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

            <main className="mx-4 mb-12">
                <div className="my-5 flex flex-col items-center justify-center">
                    <AvatarStack>
                        {participants.map(({id, photo_url}) =>
                            <Avatar
                                key={id}
                                size={48}
                                src={photo_url}
                            />)}
                    </AvatarStack>
                    <Text>{participants.map(({name}) => name).join(", ")}</Text>
                </div>

                <div>
                    <Input
                        autoFocus
                        value={expenseName}
                        onChange={onExpenseNameChange}
                        placeholder={t("expenses.ExpenseName")}
                        className="mb-2"
                        status={expenseName.length < 3 && "error"}
                    />

                    <div className="flex items-center justify-between">
                        <div className="grow mr-1">
                            <Input
                                type="number"
                                value={moneySpent}
                                onChange={onMoneySpentChange}
                                placeholder={t("expenses.MoneySpent")}
                                status={(moneySpent && moneySpent > 0) || "error"}
                            />
                        </div>
                        <CurrencySelect
                            defaultCurrency={currency}
                            onChange={onCurrencyChange}
                        />
                    </div>
                </div>

                <List
                    className="mt-4 w-full rounded-3xl"
                    style={{
                        background: "var(--tgui--bg_color)",
                    }}>
                    <Cell
                        className="p-0 addExpense__cell"
                        after={
                            <DatePicker
                                value={dayjs(date)}
                                onChange={onDateChange}
                                className="max-w-28 rounded-3xl addExpense"
                            />}
                    >
                        {t("expenses.Date")}
                    </Cell>
                    <Divider/>

                    <Cell
                        className="p-0 addExpense__cell"
                        after={
                            <Switch
                                defaultChecked={isFullyPaidByYou}
                                onChange={onFullyPaidByYouChange}
                            />
                        }
                    >
                        {t("expenses.FullyPaidByYou")}
                    </Cell>
                    <Divider/>

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
                    <>
                        <div className="mt-4 flex items-center justify-between">
                            <Headline weight="3">{t("expenses.PaidBy")}:</Headline>
                        </div>
                        <Divider className="mt-2"/>

                        <List className="mt-4 w-full rounded-3xl px-0">
                            {participants.map(({id, name, photo_url}) =>
                                (<div key={id} className="flex items-center justify-between">
                                    <div className="flex items-center w-2/3">
                                        <Switch
                                            className="shrink-0"
                                            defaultChecked={paidBy.find(x => x.id === id)?.isSelected}
                                            onChange={onPaidByChange(id)}
                                        />

                                        <Avatar size={48} src={photo_url} className="ml-2"/>

                                        <Text className="ml-4 overflow-auto text-ellipsis">{name}</Text>
                                    </div>

                                    <Input
                                        value={paidBy.find(x => x.id === id)?.amount}
                                        onChange={onPaidByAmountChange(id)}
                                        type="number"
                                        className="w-28 ml-auto"
                                        status={currentPaidMoneyAmount !== moneySpent ? "error" : null}
                                        disabled={!paidBy.find(x => x.id === id)?.isSelected}
                                        after={
                                            <Caption
                                                level="1"
                                                weight="3"
                                            >
                                                {currency}
                                            </Caption>}
                                    />

                                </div>))}
                        </List>

                        <Text
                            weight="3"
                            className="flex justify-end"
                        >
                            {currentPaidMoneyAmount} of {moneySpent} USD filled. {`${moneySpent - currentPaidMoneyAmount} USD left.`}
                        </Text>
                    </>}

                {!isSplitEquallyBetweenAll &&
                    <>
                        <div className="mt-4 flex items-center justify-between">
                            <Headline weight="3">{t("expenses.Split")}:</Headline>

                            <Headline weight="3" className="invisible">{t("expenses.Split")}:</Headline>
                        </div>
                        <Divider className="mt-2"/>

                        <List className="mt-4 w-full rounded-3xl px-0">
                            {participants.map(({id, name, photo_url}) =>
                                <div key={id} className="flex items-center justify-between">
                                    <div className="flex items-center w-2/3">
                                        <Switch
                                            className="shrink-0"
                                            defaultChecked={splitBetween.find(x => x.id === id)?.isSelected}
                                            onChange={onSplitBetweenChange(id)}
                                        />

                                        <Avatar size={48} src={photo_url} className="ml-2"/>

                                        <Text className="ml-4 overflow-auto text-ellipsis">{name}</Text>
                                    </div>

                                    <Input
                                        value={splitBetween.find(x => x.id === id)?.amount}
                                        onChange={onSplitBetweenAmountChange(id)}
                                        type="number"
                                        className="w-28 ml-auto"
                                        after={
                                            <Caption
                                                level="1"
                                                weight="3"
                                            >
                                                {currency}
                                            </Caption>}
                                    />
                                </div>
                            )}
                        </List>

                        <Text
                            weight="3"
                            className="flex justify-end"
                        >
                            {currentSplitBetweenMoneyAmount} of {moneySpent} USD filled. {`${moneySpent - currentSplitBetweenMoneyAmount} USD left.`}
                        </Text>
                    </>
                }
            </main>
        </>
    );
}