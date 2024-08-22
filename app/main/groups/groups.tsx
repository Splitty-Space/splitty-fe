"use client"

import {subPageConst} from "@/const/subPageConst";
import GroupsList from "@/app/main/groups/groupList/groupsList";
import AddGroup from "@/app/main/groups/addGroup/addGroup";

export default function Groups({subpage, setSubpage}: { subpage: number, setSubpage: Function }) {
    return (
        <>
            {subpage === subPageConst.GroupsList && <GroupsList setSubpage={setSubpage}/>}
            {subpage === subPageConst.AddGroup && <AddGroup/>}
        </>
    );
}