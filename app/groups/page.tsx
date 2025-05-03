"use client"

import {useState} from "react";
import {Cell, List, Placeholder} from "@telegram-apps/telegram-ui";
import GroupsHeader from "@/app/groups/groupsHeader/groupsHeader";
import Main from "@/app/components/main/main";
import useGroups from "@/services/useGroups";
import Avatar from "@/app/components/avatar/Avatar";
import {Arrow} from "@/Icons";
import Loader from "@/app/components/loader/loader";

export default function GroupsList() {
    const [searchValue, setSearchValue] = useState<string>("");
    const {data, loading} = useGroups();

    return (
        <>
            <GroupsHeader searchValue={searchValue} setSearchValue={setSearchValue}/>

            <Main center={loading}>
                {
                    !!data && data?.data?.length > 0 ? (
                            <List className="mb-8 px-0">
                                {data?.data?.map(({id, amount, name}: {
                                    id: number, amount: string, name: string
                                }) =>
                                    <Cell
                                        key={id}
                                        subtitle={amount}
                                        before={<Avatar size={48} user_id={id}/>}
                                    >
                                        {name}
                                    </Cell>)
                                }
                            </List>) :
                        loading ? (
                            <Loader/>
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