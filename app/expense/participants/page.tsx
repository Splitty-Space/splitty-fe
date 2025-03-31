"use client"

import React, {useEffect, useRef, useState} from "react";
import {useTranslation} from "react-i18next";
import classNames from "classnames";
import {Friend} from "@/entities";
import {
    Button,
    Cell,
    Divider,
    Headline,
    Placeholder,
    Skeleton,
    Spinner,
    Switch,
} from "@telegram-apps/telegram-ui";
import HeaderWithSearch from "@/app/components/header/headerWithSearch";
import Main from "@/app/components/main/main";
import {useStore} from "@/app/store";
import useFriends from "@/services/useFriends";
import {useRouter} from "next/navigation";
import {addExpense} from "@/const/urls";
import Avatar from "@/app/components/avatar/Avatar";
import {vibration} from "@/utils/vibration";
import Username from "@/app/components/username/username";
import {AutoSizer, InfiniteLoader, List} from "react-virtualized";

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
        vibration();

        setSelectedUserIds(prev => (
            e.target.checked ?
                [...prev, id] :
                prev.filter(x => x !== id)
        ));
    };

    const [isSearchOpen, setIsSearchOpen] = useState(false);

    const refContainer = useRef(null);
    const [height, setHeight] = useState(0);

    useEffect(() => {
        // @ts-ignore
        setHeight(refContainer.current?.clientHeight);
    }, []);

    const pageSize = 25;
    const [rowCount, setRowCount] = useState(pageSize);

    useEffect(() => {
        if (friends) {
            setRowCount(friends?.length);
        }
    }, [friends]);

    const isRowLoaded = ({index}: { index: number }) => {
        return friends && !!friends[index];
    };

    const loadMoreRows = () => {
        return;
    };

    const filteredFriends = friends.filter((friend: Friend) =>
        friend.name.toLowerCase().includes(searchValue.toLowerCase()) ||
        friend.username.toLowerCase().includes(searchValue.toLowerCase()));

    const rowRenderer = ({index, key, style}: { index: number, key: string, style: object }) => {
        const _friend = filteredFriends[index];
        if (!_friend) {
            return (
                <Skeleton visible withoutAnimation key={key} style={style} className="red">
                    <Cell> </Cell>
                </Skeleton>);
        }

        const {id, name, username} = _friend;

        return (
            <div key={id} style={style}>
                <Cell
                    className="friends-list_shrink-0"
                    before={<Avatar size={48} user_id={id}/>}
                    subtitle={<Username username={username}/>}
                    after={<Switch
                        defaultChecked={selectedUserIds.includes(id)}
                        onChange={onUserChange(id)}
                    />}
                >
                    {name}
                </Cell>
                <Divider className="ml-20 border-2"/>
            </div>
        );
    };

    return (
        <>
            <HeaderWithSearch
                CentralComponent={() => <Headline weight="3">{t("expenses.AddAnExpense")}</Headline>}
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
                onSearchChange={setIsSearchOpen}
            />

            <Main
                ref={refContainer}
                center={loadingFriends}
                style={isSearchOpen ? {height: "calc(100% - 4rem)"} : undefined}
                className={classNames({
                    "margin-top-8": isSearchOpen
                })}
            >
                {loadingFriends ?
                    <Spinner size="l" className="flex flex-col items-center justify-center"/> :
                    filteredFriends?.length > 0 ?
                        // @ts-ignore
                        (<InfiniteLoader
                            isRowLoaded={isRowLoaded}
                            // @ts-ignore
                            loadMoreRows={loadMoreRows}
                            rowCount={rowCount}
                        >
                            { // @ts-ignore
                                ({onRowsRendered, registerChild}) => (
                                    // @ts-ignore
                                    <AutoSizer>
                                        {({width}) => (
                                            // @ts-ignore
                                            <List
                                                ref={registerChild}
                                                width={width}
                                                height={height}
                                                rowHeight={68}
                                                rowCount={filteredFriends?.length}
                                                rowRenderer={rowRenderer}
                                                onRowsRendered={onRowsRendered}
                                                className="pb-20"
                                            />
                                        )}
                                    </AutoSizer>
                                )}
                        </InfiniteLoader>)
                        :
                        (<Placeholder header={t("friendsList.FriendNotFound")}/>)
                }
            </Main>
        </>
    );
}