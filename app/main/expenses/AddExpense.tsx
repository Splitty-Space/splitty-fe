"use client"

import React, {useState} from "react";
import classNames from "classnames";
import {useTranslation} from "react-i18next";
import Header from "@/app/main/header/header";
import {
    Avatar,
    AvatarStack,
    Button,
    Cell,
    Divider, Headline,
    Input,
    List, SegmentedControl,
    Switch,
    Text,
    Title
} from "@telegram-apps/telegram-ui";
import {TabIds} from "@/const/tabIds";
import {Friend} from "@/entities";
import useMe from "@/services/useMe";
import {CurrencySelect} from "@/components/CurrencySelect";

enum SEGMENTS {
    NUMERIC,
    PERCENT
}

export default function AddExpense({selectedFriends, setCurrentTab}: {
    selectedFriends: Friend[],
    setCurrentTab: Function
}) {
    const {t} = useTranslation();

    const [isSaveVisible, setIsSaveVisible] = useState(true);
    const [isNextDisabled, setIsNextDisabled] = useState(false);

    const [expenseName, setExpenseName] = useState("");
    const [moneySpent, setMoneySpent] = useState("");
    const [isFullyPaidByYou, setIsFullyPaidByYou] = useState(true);
    const [isSplitEquallyBetweenAll, setIsSplitEquallyBetweenAll] = useState(true);

    const {data, refetch} = useMe();

    const [currency, setCurrency] = useState(data?.default_currency);

    const [selectedSegment, setSelectedSegment] = useState(SEGMENTS.NUMERIC);

    const onPrev = () => {
        setCurrentTab(TabIds.AddExpenseParticipants);
    };

    const onSave = () => {
    };

    const onExpenseNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setExpenseName(e.target.value);
    };

    const onMoneySpentChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setMoneySpent(e.target.value);
    };

    const onCurrencyChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setCurrency(e.target.value);
    };

    const onFullyPaidByYouChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setIsFullyPaidByYou(e.target.checked);
    };

    const onSplitEquallyBetweenAllChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setIsSplitEquallyBetweenAll(e.target.checked);
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
                        className={classNames({
                            "invisible": !isSaveVisible
                        })}
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
                        disabled={isNextDisabled}
                    >
                        {t("expenses.Save")}
                    </Button>
                )}
            />

            <main className="mx-4">
                <div className="my-5 flex flex-col items-center justify-center">
                    <AvatarStack>
                        {selectedFriends.map(({id, photo_url}) =>
                            <Avatar
                                key={id}
                                size={48}
                                src={photo_url}
                            />)}
                    </AvatarStack>
                    <Text>{selectedFriends.map(({name}) => name).join(", ")}</Text>
                </div>

                <div>
                    <Input
                        value={expenseName}
                        onChange={onExpenseNameChange}
                        status="focused"
                        placeholder={t("expenses.ExpenseName")}
                        className="mb-2"
                    />

                    <Input
                        value={moneySpent}
                        onChange={onMoneySpentChange}
                        placeholder={t("expenses.MoneySpent")}
                    />
                </div>

                <List
                    className="mt-4 w-full rounded-3xl"
                    style={{
                        background: "var(--tgui--bg_color)",
                    }}>
                    <Cell
                        after={
                            <CurrencySelect
                                defaultCurrency={data?.default_currency}
                                onChange={onCurrencyChange}/>
                        }
                    >
                        {t("expenses.Currency")}
                    </Cell>
                    <Divider/>

                    <Cell>
                        {t("expenses.Date")}
                    </Cell>
                    <Divider/>

                    <Cell
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

                <div className="mt-4 flex items-center justify-between">
                    <Headline weight="3">{t("expenses.Split")}:</Headline>

                    <SegmentedControl className="w-1/2">
                        <SegmentedControl.Item
                            key={SEGMENTS.NUMERIC}
                            onClick={() => setSelectedSegment(SEGMENTS.NUMERIC)}
                            selected={selectedSegment === SEGMENTS.NUMERIC}
                        >
                            1.23
                        </SegmentedControl.Item>
                        <SegmentedControl.Item
                            key={SEGMENTS.PERCENT}
                            onClick={() => setSelectedSegment(SEGMENTS.PERCENT)}
                            selected={selectedSegment === SEGMENTS.PERCENT}
                        >
                            %
                        </SegmentedControl.Item>
                    </SegmentedControl>

                    <Headline weight="3" className="invisible">{t("expenses.Split")}:</Headline>
                </div>
                <Divider className="mt-2"/>

                <div>
                    <List
                        className="mt-4 w-full rounded-3xl"
                        style={{
                            background: "var(--tgui--bg_color)",
                        }}>
                        {selectedFriends.map(({id, name}) =>
                            <Cell
                                key={id}
                                before={<Switch
                                    defaultChecked={false}
                                    onChange={()=> {}}
                                />}
                                after={null}
                            >
                                {name}
                            </Cell>)
                        }
                    </List>
                </div>
            </main>
        </>
    );
}