"use client"

import React, {Suspense, useRef, useState} from "react";
import {useTranslation} from "react-i18next";
import classNames from "classnames";
import dayjs, {Dayjs} from "dayjs";
import {DateTimePicker} from "@mui/x-date-pickers/DateTimePicker";
import Header from "@/app/components/header/header";
import {Button, Input, Section, Text, Title} from "@telegram-apps/telegram-ui";
import {CurrencySelect} from "@/components/CurrencySelect";
import {addExpense} from "@/services/addExpense";
import useMe, {type Me} from "@/services/useMe";
import {Arrow} from "@/Icons";
import {putExpense} from "@/services/putExpense";
import {useStore} from "@/app/store";
import {useRouter, useSearchParams} from "next/navigation";
import {friend as friendURL} from "@/const/urls";
import {SEARCH_PARAMS} from "@/const/searchParams";
import {withSearchParams} from "@/utils/withSearchParams";
import Avatar from "@/app/components/avatar/Avatar";
import Main from "@/app/components/main/main";
import Loader from "@/app/components/loader/loader";
import PullToRefresh from "@/app/components/pullToRefresh/pullToRefresh";
import useRefreshToken from "@/utils/useRefreshToken";
import {useFriend} from "@/hooks/useSelectedFriend";
import useSelectedExpense from "@/hooks/useSelectedExpense";
import {parseId} from "@/utils/parseId";
import type {Expense, Friend} from "@/entities";
import type {RefetchFunction} from "axios-hooks";

// Editing takes the settlement from ?expenseId= and the friend from its participants;
// a new settlement takes ?friendId= and ?currency=.
function SettleUpPayment() {
    const searchParams = useSearchParams();
    const isEditing = searchParams.has(SEARCH_PARAMS.EXPENSE_ID);
    const [refreshKey, refreshExpense] = useRefreshToken();
    const {expense, isLoading: isExpenseLoading} = useSelectedExpense({required: false, refreshKey});
    const {data: me, loading} = useMe();

    const otherUserId = expense?.expense_users.find(({user}) => user.id !== me?.id)?.user.id ?? null;
    const friendId = isEditing ?
        (expense && me ? otherUserId : undefined) :
        parseId(searchParams.get(SEARCH_PARAMS.FRIEND_ID));
    const {friend, refetchFriends} = useFriend(friendId);
    const defaultCurrency = isEditing ? expense?.currency : searchParams.get(SEARCH_PARAMS.CURRENCY) ?? undefined;

    // A failed request leaves nothing to edit; pulling down requests the settlement again.
    if (isEditing && !isExpenseLoading && !expense) {
        return (
            <Main className="px-4 pt-24">
                <PullToRefresh onRefresh={() => { refreshExpense(); return Promise.resolve(); }}>
                    <div className="h-full"/>
                </PullToRefresh>
            </Main>
        );
    }
    if (loading || !me || !friend || (isEditing && !expense)) return <Loader/>;

    return (
        <SettleUpPaymentForm
            key={`${friend.id}-${expense?.id}`}
            me={me}
            friend={friend}
            selectedExpense={expense}
            defaultCurrency={defaultCurrency}
            refetchFriends={refetchFriends}
        />
    );
}

function SettleUpPaymentForm({me, friend, selectedExpense, defaultCurrency, refetchFriends}: {
    me: Me,
    friend: Friend,
    selectedExpense: Expense | null,
    defaultCurrency: string | undefined,
    refetchFriends: RefetchFunction<any, any>,
}) {
    const {t} = useTranslation();

    const showError = useStore((state) => state.setIsRequestErrorSnackbarShown);
    const saveInFlight = useRef(false);
    const setIsCreateExpenseSnackbarShown = useStore((state) => state.setIsCreateExpenseSnackbarShown);
    const setIsUpdateExpenseSnackbarShown = useStore((state) => state.setIsUpdateExpenseSnackbarShown);

    const [isSaveInProgress, setIsSaveInProgress] = useState(false);

    const defaultAmount = Number(selectedExpense ? selectedExpense.amount : friend.total.find(x => x.currency === defaultCurrency)?.amount);
    const isYouAreDebtor = selectedExpense
        ? selectedExpense.expense_users.some(({user, lent_amount}) => user.id === me.id && Number(lent_amount) > 0)
        : defaultAmount < 0;

    const [amountPaid, setAmountPaid] = useState(Math.abs(defaultAmount));
    const [currency, setCurrency] = useState(selectedExpense ? selectedExpense.currency : defaultCurrency);
    const [date, setDate] = useState(selectedExpense ? selectedExpense.date : new Date());
    const isSaveDisabled = !currency || !Number.isFinite(amountPaid) || amountPaid <= 0 || !dayjs(date).isValid();

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
        if (saveInFlight.current || isSaveDisabled) return;
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
            router.push(withSearchParams(friendURL, {[SEARCH_PARAMS.FRIEND_ID]: friend.id}));
        } catch {
            saveInFlight.current = false;
            setIsSaveInProgress(false);
            showError(true);
        }
    };

    return (
            <>
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

export default function SettleUpPaymentRoute() {
    return (
        <Suspense>
            <SettleUpPayment/>
        </Suspense>
    );
}
