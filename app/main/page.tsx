"use client"

import {useState} from "react";
import Friends from "@/app/main/friends/friends";
import Groups from "@/app/main/groups/groups";
import Account from "@/app/main/account/account";
import Footer from "@/app/main/footer/footer";
import {TabIds} from "@/const/tabIds";
import {subPageConst} from "@/const/subPageConst";

export default function Page() {
    const [currentTab, setCurrentTab] = useState(TabIds.Friends);
    const [subpage, setSubpage] = useState(subPageConst.FriendsList);

    return (
        <>
            {currentTab === TabIds.Friends && <Friends subpage={subpage} setSubpage={setSubpage}/>}
            {currentTab === TabIds.Groups && <Groups subpage={subpage} setSubpage={setSubpage}/>}
            {currentTab === TabIds.Account && <Account/>}

            <Footer currentTab={currentTab} setCurrentTab={setCurrentTab} setSubpage={setSubpage}/>
        </>
    );
}
