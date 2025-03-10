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
import HeaderWithSearch from "@/app/components/header/headerWithSearch";
import Main from "@/app/components/main/main";
import {useStore} from "@/app/store";
import useFriends from "@/services/useFriends";
import {useRouter} from "next/navigation";
import {addExpense} from "@/const/urls";

export default function AddExpenseParticipants() {
    const selectedFriends = useStore((state) => state.selectedFriends);
    const setSelectedFriends = useStore((state) => state.setSelectedFriends);

    const {data, loadingFriends} = useFriends("")
    const friends = data?.data ?? [];

    const {t} = useTranslation();

    const [isNextDisabled, setIsNextDisabled] = useState(true);

    const [selectedUserIds, setSelectedUserIds] = useState<Array<number>>(selectedFriends.map(({id}) => id));

    const [searchValue, setSearchValue] = useState("");

    const router = useRouter();

    const onNext = () => {
        const selectedFriends = friends.filter(({id}) => selectedUserIds.includes(id));
        setSelectedFriends(selectedFriends);

        router.push(addExpense);
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

            <Main>
                {
                    loadingFriends ?
                        (<Spinner size="l"/>) :
                        filteredFriends?.length > 0 ?
                            (
                                <List className="mb-8 px-0">
                                    {filteredFriends?.map(({id, name, username, photo_url}) =>
                                        <div key={id}>
                                            <Cell
                                                className="h-14"
                                                before={<Avatar size={48} src={photo_url}/>}
                                                subtitle={<span className="text-ellipsis overflow-hidden">
                                                         {"@" + username}
                                                    </span>}
                                                after={<Switch
                                                    defaultChecked={selectedUserIds.includes(id)}
                                                    onChange={onUserChange(id)}
                                                />}
                                            >
                                                {name}
                                            </Cell>
                                            <Divider className="ml-20 border-2"/>
                                        </div>
                                    )
                                    }
                                </List>)
                            : (<Placeholder header={t("friendsList.FriendNotFound")}/>)
                }
            </Main>
        </>
    );
}