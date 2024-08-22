"use client"

import {useState} from "react";
import {subPageConst} from "@/const/subPageConst";
import FriendsList from "@/app/main/friends/friendsList/friendsList";
import AddFriend from "@/app/main/friends/addFriend/addFriend";
import useFriends from "@/services/useFriends";
import FriendPage from "@/app/main/friends/friend/friendPage";
import FriendSettings from "@/app/main/friends/friendSettings/friendSettings";

export default function Friends({subpage, setSubpage}: { subpage: number, setSubpage: Function }) {
    const [searchValue, setSearchValue] = useState("");
    const [selectedUserId, setSelectedUserId] = useState(null);
    const {data, loading} = useFriends(searchValue);

    const selectedFriend = data?.data?.find(friend => friend.id === selectedUserId);

    return (
        <>
            {subpage === subPageConst.FriendsList &&
                <FriendsList
                    setSubpage={setSubpage}
                    searchValue={searchValue}
                    setSearchValue={setSearchValue}
                    setSelectedUserId={setSelectedUserId}
                    data={data}
                    loading={loading}
                />}
            {subpage === subPageConst.AddFriend && <AddFriend/>}
            {subpage === subPageConst.Friend &&
                <FriendPage
                    friend={selectedFriend}
                    setSubpage={setSubpage}
                />}
            {subpage === subPageConst.FriendSettings &&
                <FriendSettings
                    friend={selectedFriend}
                    friends={data?.data}
                />}
        </>
    );
}