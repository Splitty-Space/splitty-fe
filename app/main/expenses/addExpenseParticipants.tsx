"use client"

import React, {useEffect, useState} from "react";
import {useTranslation} from "react-i18next";
import {Friend} from "@/entities";
import {
    Avatar,
    Button,
    Cell,
    Divider,
    List,
    Placeholder,
    Spinner,
    Switch,
    Title
} from "@telegram-apps/telegram-ui";
import {TabIds} from "@/const/tabIds";
import HeaderWithSearch from "@/app/main/header/headerWithSearch";

export default function AddExpenseParticipants({
                                                   selectedFriends,
                                                   friends,
                                                   loadingFriends,
                                                   setCurrentTab,
                                                   setSelectedFriends,
                                               }: {
    selectedFriends: Friend[],
    friends: Friend[],
    loadingFriends: boolean,
    setCurrentTab: Function,
    setSelectedFriends: Function
}) {
    const {t} = useTranslation();

    const [isNextDisabled, setIsNextDisabled] = useState(true);

    const [selectedUserIds, setSelectedUserIds] = useState<Array<number>>(selectedFriends.map(({id}) => id));

    const [searchValue, setSearchValue] = useState("");

    const onNext = () => {
        setCurrentTab(TabIds.AddExpense);

        const selectedFriends = friends.filter(({id}) => selectedUserIds.includes(id));

        setSelectedFriends(selectedFriends);
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
            <HeaderWithSearch
                CentralComponent={() => <Title>{t("expenses.AddAnExpense")}</Title>}
                RightComponent={() => (
                    <Button
                        size="m"
                        mode="plain"
                        onClick={onNext}
                        disabled={isNextDisabled}
                    >
                        {t("expenses.Next")}
                    </Button>
                )}
                searchValue={searchValue}
                setSearchValue={setSearchValue}
            />

            <main>
                {
                    loadingFriends ?
                        (<Spinner size="l"/>) :
                        filteredFriends?.length > 0 ?
                            (
                                <List className="mb-8 px-0">
                                    {filteredFriends?.map(({id, name, photo_url}) =>
                                        <div key={id}>
                                            <Cell
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
                            : (<Placeholder header={t("friendsList.FriendNotFound")}/>)
                }
            </main>
        </>
    );
}