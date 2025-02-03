import React, {useState} from "react";
import {useTranslation} from "react-i18next";
import classNames from "classnames";
import dayjs, {Dayjs} from "dayjs";
import {DatePicker} from "@mui/x-date-pickers/DatePicker";
import {Expense, Friend} from "@/entities";
import Header from "@/app/main/header/header";
import Logo from "@/app/main/header/logo";
import {Avatar, Button, Input, Section, Spinner, Text, Title} from "@telegram-apps/telegram-ui";
import {CurrencySelect} from "@/components/CurrencySelect";
import {addExpense} from "@/services/addExpense";
import {subPageConst} from "@/const/subPageConst";
import useMe from "@/services/useMe";
import {Arrow} from "@/Icons";
import {putExpense} from "@/services/putExpense";

export default function SettleUpPayment({friend, defaultCurrency, selectedExpense, setSubpage, refetchFriends}: {
    friend: Friend,
    defaultCurrency: string,
    selectedExpense?: Expense
    setSubpage: Function,
    refetchFriends: Function,
}) {
    const {t} = useTranslation();

    const {data: me, loading} = useMe();

    const [isSaveDisabled, setIsSaveDisabled] = useState(false);
    const [isSaveInProgress, setIsSaveInProgress] = useState(false);

    const defaultAmount = Number(selectedExpense ? selectedExpense.amount : friend.total.find(x => x.currency === defaultCurrency)?.amount);
    const isYouAreDebtor = defaultAmount < 0;

    const [amountPaid, setAmountPaid] = useState(Math.abs(defaultAmount));
    const [currency, setCurrency] = useState(selectedExpense ? selectedExpense.currency : defaultCurrency);
    const [date, setDate] = useState(selectedExpense ? selectedExpense.date : new Date());

    const onAmountPaidChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const amount = Number(e.target.value);
        setAmountPaid(amount);

        setIsSaveDisabled(amount === 0);
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
        `${t("settleUp.YouPaid")} ${friend.name}` :
        `${friend.name} ${t("settleUp.PaidYou")}`;

    const onSave = () => {
        setIsSaveInProgress(true);

        const payers = []
        const debtors = []
        if (isYouAreDebtor) {
            payers.push({user_id: me.id, amount: amountPaid}, {user_id: friend.id, amount: 0})
            debtors.push({user_id: me.id, amount: 0}, {user_id: friend.id, amount: amountPaid})
        } else {
            payers.push({user_id: friend.id, amount: amountPaid}, {user_id: me.id, amount: 0})
            debtors.push({user_id: friend.id, amount: 0}, {user_id: me.id, amount: amountPaid})
        }

        const amount = amountPaid;
        const users = [me.id, friend.id];

        if (selectedExpense) {
            putExpense({
                expense_id: selectedExpense.id,
                payers,
                debtors,
                users,
                amount,
                description
            }).then(() => {
                refetchFriends();
                setSubpage(subPageConst.FriendsList);
            });
        } else {
            addExpense({
                payers,
                debtors,
                users,
                amount,
                payment: true,
                currency,
                date,
                description,
            }).then(() => {
                refetchFriends();
                setSubpage(subPageConst.FriendsList);
            });
        }
    };

    return loading ?
        (<Spinner size="l"/>) : (
            <>
                <Header
                    CentralComponent={Logo}
                    LeftComponent={() => (
                        <Button
                            size="l"
                            mode="plain"
                            className={classNames({"invisible": true})}
                        >
                            {t("addGroup.Prev")}
                        </Button>
                    )}
                    RightComponent={() => (
                        <Button
                            size="l"
                            mode="plain"
                            onClick={onSave}
                            disabled={isSaveDisabled}
                            loading={isSaveInProgress}
                        >
                            {t("settleUp.Save")}
                        </Button>
                    )}
                    AfterComponent={<Title className="flex justify-content-center">{t("settleUp.PaymentInfo")}</Title>}
                />

                <main className="m-12 mx-4">
                    <div className="flex justify-around">
                        <div className="flex flex-col items-center">
                            <Avatar
                                size={48}
                                src={isYouAreDebtor ? me.photo_url : friend.photo_url}
                            />

                            <Text weight="3">
                                {isYouAreDebtor ? me.name : friend?.name}
                            </Text>
                        </div>

                        <Arrow className="rotate-[60deg] scale-50 absolute top-8"/>

                        <div className="flex flex-col items-center">
                            <Avatar
                                size={48}
                                src={isYouAreDebtor ? friend.photo_url : me.photo_url}
                            />

                            <Text weight="3">
                                {isYouAreDebtor ? friend.name : me?.name}
                            </Text>
                        </div>
                    </div>

                    <Section header={description.toUpperCase()}>
                        <Input
                            placeholder="Amount Paid"
                            value={amountPaid}
                            type="number"
                            inputMode="decimal"
                            pattern="^\d+([.,]\d+)?$" 
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
                        <DatePicker
                            value={dayjs(date)}
                            onChange={onDateChange}
                            disabled={!!selectedExpense}
                            className="w-full rounded-3xl"
                        />
                    </Section>
                </main>
            </>
        );
}