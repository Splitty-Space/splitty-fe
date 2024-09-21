"use client"

import React, {useEffect, useState} from "react";
import classNames from "classnames";
import {useTranslation} from "react-i18next";
import {Friend} from "@/entities";
import Header from "@/app/main/header/header";
import {
    Avatar,
    Button,
    Cell,
    Divider,
    Input,
    List,
    Placeholder,
    Spinner,
    Switch,
    Tappable,
    Title
} from "@telegram-apps/telegram-ui";
import {TabIds} from "@/const/tabIds";
import {Icon24Close, Icon24Search} from "@/Icons";

enum SEGMENTS {
    FRIENDS,
    GROUPS
}

export default function AddExpenseParticipants({
                                                   selectedFriends,
                                                   friends,
                                                   loadingFriends,
                                                   setCurrentTab,
                                                   onAddExpense,
                                               }: {
    selectedFriends: Friend[],
    friends: Friend[],
    loadingFriends: boolean,
    setCurrentTab: Function,
    onAddExpense: Function
}) {
    const {t} = useTranslation();

    const [isPrevVisible, setIsPrevVisible] = useState(false);
    const [isNextDisabled, setIsNextDisabled] = useState(true);

    const [selectedSegment, setSelectedSegment] = useState<SEGMENTS>(SEGMENTS.FRIENDS);

    const [selectedUserIds, setSelectedUserIds] = useState<Array<number>>(selectedFriends.map(({id}) => id));

    const [searchValue, setSearchValue] = useState("");

    const onSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setSearchValue(e.target.value);
    }

    const clearSearch = () => {
        setSearchValue("");
    }

    const onNext = () => {
        setCurrentTab(TabIds.AddExpense);

        const selectedFriends = friends.filter(({id}) => selectedUserIds.includes(id));

        onAddExpense(selectedFriends);
    };

    useEffect(() => {
        setIsNextDisabled(selectedUserIds.length === 0);
    }, [selectedUserIds]);

    const onUserChange = (id: number) => (e: React.ChangeEvent<HTMLInputElement>) => {
        setSelectedUserIds(prev => (
            e.target.checked ?
                [...prev, id] :
                prev.filter(x => x !== id)
        ));
    };

    const filteredFriends = friends.filter((friend: Friend) =>
        friend.name.toLowerCase().includes(searchValue.toLowerCase()) ||
        friend.username.toLowerCase().includes(searchValue.toLowerCase()));

    return (
        <>
            <Header
                layoutClassName="p-0 py-4"
                LeftComponent={() => (
                    <Button
                        size="l"
                        mode="plain"
                        className={classNames({
                            "invisible": !isPrevVisible
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
                        onClick={onNext}
                        disabled={isNextDisabled}
                    >
                        {t("expenses.Next")}
                    </Button>
                )}
                AfterComponent={<>
                    {/* TODO add groups
                    <div className="m-4">
                        <SegmentedControl>
                            <SegmentedControl.Item
                                key={SEGMENTS.FRIENDS}
                                onClick={() => setSelectedSegment(SEGMENTS.FRIENDS)}
                                selected={selectedSegment === SEGMENTS.FRIENDS}
                            >
                                {t("expenses.Friends")}
                            </SegmentedControl.Item>
                            <SegmentedControl.Item
                                key={SEGMENTS.GROUPS}
                                onClick={() => setSelectedSegment(SEGMENTS.GROUPS)}
                                selected={selectedSegment === SEGMENTS.GROUPS}
                            >
                                {t("expenses.Groups")}
                            </SegmentedControl.Item>
                        </SegmentedControl>
                    </div>*/}

                    <Input
                        value={searchValue}
                        onChange={onSearchChange}
                        status="focused"
                        placeholder={t("header.Search")}
                        className="mx-4 header_color"
                        before={<Icon24Search/>}
                        after={
                            <Tappable
                                Component="div"
                                onClick={clearSearch}
                            >
                                <Icon24Close/>
                            </Tappable>}
                    />
                </>
                }
            />

            <main className="mt-16">
                {
                    selectedSegment === SEGMENTS.FRIENDS ? (loadingFriends ?
                            (<Spinner size="l"/>) :
                            filteredFriends?.length > 0 ?
                                (
                                    <List>
                                        {filteredFriends?.map(({id, amount, name, photo_url}) =>
                                            <div key={id}>
                                                <Cell
                                                    subtitle={amount}
                                                    before={<Avatar size={48} src={photo_url}/>}
                                                    after={<Switch
                                                        defaultChecked={selectedUserIds.includes(id)}
                                                        onChange={onUserChange(id)}
                                                    />}
                                                >
                                                    {name}
                                                </Cell>
                                                <Divider className="ml-20"/>
                                            </div>
                                        )
                                        }
                                    </List>)
                                : (<Placeholder header={t("friendsList.FriendNotFound")}/>)) :
                        <span>Group TODO</span>
                }
            </main>
        </>
    );
}