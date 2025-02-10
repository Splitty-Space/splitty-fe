"use client"

import {useState} from "react";
import {Avatar, Cell, List, Placeholder, Spinner} from "@telegram-apps/telegram-ui";
import GroupsHeader from "@/app/main/groups/groupList/groupsHeader/groupsHeader";
import Main from "@/app/main/main/main";
import useGroups from "@/services/useGroups";
import {Arrow} from "@/Icons";

export default function GroupsList({setSubpage}: { setSubpage: Function }) {
    const [searchValue, setSearchValue] = useState<string>("");
    const {data, loading} = useGroups();

    return (
        <>
            <GroupsHeader searchValue={searchValue} setSearchValue={setSearchValue} setSubpage={setSubpage}/>

            <Main center={loading}>
                {
                    !!data && data?.data?.length > 0 ? (
                            <List className="mb-8 px-0">
                                {data?.data?.map(({id, amount, name, photo_url}: {
                                    id: number, amount: string, name: string, photo_url: string
                                }) =>
                                    <Cell
                                        key={id}
                                        subtitle={amount}
                                        before={<Avatar size={48} src={photo_url}/>}
                                    >
                                        {name}
                                    </Cell>)
                                }
                            </List>) :
                        loading ? (
                            <Spinner size="l"/>
                        ) : (
                            <Placeholder header="Add you first group">
                                <Arrow className="ml-16"/>
                            </Placeholder>
                        )
                }
            </Main>
        </>
    );
}