"use client"

import React, {useRef, useState} from "react";
import {useTranslation} from "react-i18next";
import classNames from "classnames";
import dayjs, {Dayjs} from "dayjs";
import {DateTimePicker} from "@mui/x-date-pickers/DateTimePicker";
import Header from "@/app/components/header/header";
import {Button, Input, Section, Text, Title} from "@telegram-apps/telegram-ui";
import {CurrencySelect} from "@/components/CurrencySelect";
import {addExpense} from "@/services/addExpense";
import useMe from "@/services/useMe";
import {Arrow} from "@/Icons";
import {putExpense} from "@/services/putExpense";
import {useStore} from "@/app/store";
import useFriends from "@/services/useFriends";
import {useRouter} from "next/navigation";
import {friend as friendURL} from "@/const/urls";
import Avatar from "@/app/components/avatar/Avatar";
import Main from "@/app/components/main/main";
import Loader from "@/app/components/loader/loader";

export default function SettleUpPayment() {
    const {t} = useTranslation();

    const setSelectedUserId = useStore((state) => state.setSelectedUserId);
    const selectedExpense = useStore((state) => state.selectedExpense);
    const showError = useStore((state) => state.setIsRequestErrorSnackbarShown);
    const saveInFlight = useRef(false);
    const searchValue = useStore((state) => state.searchValue);
    const setIsCreateExpenseSnackbarShown = useStore((state) => state.setIsCreateExpenseSnackbarShown);
    const setIsUpdateExpenseSnackbarShown = useStore((state) => state.setIsUpdateExpenseSnackbarShown);

    const settleUpPaymentInfo = useStore((state) => state.settleUpPaymentInfo);
    const friend = settleUpPaymentInfo?.friend;
    const defaultCurrency = settleUpPaymentInfo?.currency;

    const {data: me, loading} = useMe();

    const {refetchFriends} = useFriends(searchValue);

    const [isSaveInProgress, setIsSaveInProgress] = useState(false);

    const defaultAmount = Number(selectedExpense ? selectedExpense.amount : friend?.total.find(x => x.currency === defaultCurrency)?.amount);
    const isYouAreDebtor = selectedExpense
        ? selectedExpense.expense_users.some(({user, lent_amount}) => user.id === me?.id && Number(lent_amount) > 0)
        : defaultAmount < 0;

    const [amountPaid, setAmountPaid] = useState(Math.abs(defaultAmount));
    const [currency, setCurrency] = useState(selectedExpense ? selectedExpense.currency : defaultCurrency);
    const [date, setDate] = useState(selectedExpense ? selectedExpense.date : new Date());
    const isSaveDisabled = !me || !friend || !currency || !Number.isFinite(amountPaid) || amountPaid <= 0 || !dayjs(date).isValid();

    const onAmountPaidChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const amount = Number(e.target.value.replace(",", "."));
        setAmountPaid(amount);

    };

    const onCurrencyChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setCurrency(e.target.value);
    };

    const onDateChange = (newDate: Dayjs | null) => {
        if (newDate) {
            setDate(newDate?.toDate());
        }
    };

    const description = isYouAreDebtor ?
        `${t("settleUp.YouPaid")} ${friend?.name}` :
        `${friend?.name} ${t("settleUp.PaidYou")}`;

    const router = useRouter();

    const onSave = async () => {
        if (saveInFlight.current || isSaveDisabled || !friend) return;
        saveInFlight.current = true;
        setIsSaveInProgress(true);

        const payers = []
        const debtors = []
        if (isYouAreDebtor) {
            payers.push({user_id: me.id, amount: amountPaid}, {user_id: friend?.id, amount: 0})
            debtors.push({user_id: me.id, amount: 0}, {user_id: friend?.id, amount: amountPaid})
        } else {
            payers.push({user_id: friend?.id, amount: amountPaid}, {user_id: me.id, amount: 0})
            debtors.push({user_id: friend?.id, amount: 0}, {user_id: me.id, amount: amountPaid})
        }

        const amount = amountPaid;
        const users = [me.id, friend?.id];

        try {
            if (selectedExpense) {
                await putExpense({
                    expense_id: selectedExpense.id,
                    payers,
                    debtors,
                    users,
                    amount,
                    description
                });
                setIsUpdateExpenseSnackbarShown(true);
            } else {
                await addExpense({
                    payers,
                    debtors,
                    users,
                    amount,
                    payment: true,
                    currency,
                    date,
                    description,
                });
                setIsCreateExpenseSnackbarShown(true);
            }
            await refetchFriends().catch(() => showError(true));
            setSelectedUserId(friend.id);
            router.push(friendURL);
        } catch {
            saveInFlight.current = false;
            setIsSaveInProgress(false);
            showError(true);
        }
    };

    return loading ?
        (<Loader/>) :
        (<>
                <Header
                    LeftComponent={() => (
                        <Button
                            size="l"
                            mode="plain"
                            className={classNames({"invisible": true})}
                        >
                            {t("addGroup.Prev")}
                        </Button>
                    )}
                    CentralComponent={({className}) =>
                        <Title
                            className={classNames(className, "flex justify-content-center")}>
                            {t("settleUp.PaymentInfo")}
                        </Title>
                    }
                    RightComponent={() => (
                        <Button
                            size="l"
                            mode="plain"
                            onClick={onSave}
                            disabled={isSaveDisabled || isSaveInProgress}
                            loading={isSaveInProgress}
                        >
                            {t("settleUp.Save")}
                        </Button>
                    )}
                />

                <Main className="pt-32 px-4">
                    <div className="flex justify-around">
                        <div className="flex flex-col items-center">
                            <Avatar
                                size={48}
                                user_id={isYouAreDebtor ? me?.id : friend?.id}
                            />

                            <Text weight="3">
                                {isYouAreDebtor ? me?.name : friend?.name}
                            </Text>
                        </div>

                        <Arrow className="rotate-[60deg] scale-50 absolute top-8"/>

                        <div className="flex flex-col items-center">
                            <Avatar
                                size={48}
                                user_id={isYouAreDebtor ? friend?.id : me?.id}
                            />

                            <Text weight="3">
                                {isYouAreDebtor ? friend?.name : me?.name}
                            </Text>
                        </div>
                    </div>

                    <Section header={description.toUpperCase()}>
                        <Input
                            placeholder="Amount Paid"
                            value={amountPaid}
                            type="number"
                            inputMode="decimal"
                            step="any"
                            onChange={onAmountPaidChange}
                            status={amountPaid > 0 ? "default" : "error"}
                        />
                    </Section>

                    <Section header="Currency">
                        <CurrencySelect
                            defaultCurrency={currency}
                            onChange={onCurrencyChange}
                            disabled={!!selectedExpense}
                        />
                    </Section>

                    <Section header="Date of payment">
                        <DateTimePicker
                            value={dayjs(date)}
                            onChange={onDateChange}
                            disabled={!!selectedExpense}
                            className="w-full rounded-3xl"
                        />
                    </Section>
                </Main>
            </>
        );
}
