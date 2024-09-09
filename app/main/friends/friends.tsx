"use client"

import {useState} from "react";
import {subPageConst} from "@/const/subPageConst";
import FriendsList from "@/app/main/friends/friendsList/friendsList";
import AddFriend from "@/app/main/friends/addFriend/addFriend";
import FriendPage from "@/app/main/friends/friend/friendPage";
import FriendSettings from "@/app/main/friends/friendSettings/friendSettings";
import {Snackbar} from "@telegram-apps/telegram-ui";
import {Icon28Bin} from "@/Icons";
import {Friend} from "@/entities";
import {RefetchFunction} from "axios-hooks";

export default function Friends({
                                    subpage,
                                    setSubpage,
                                    searchValue,
                                    setSearchValue,
                                    setSelectedUserId,
                                    friends,
                                    loadingFriends,
                                    refetchFriends,
                                    selectedFriend
                                }: {
    subpage: number,
    setSubpage: Function,
    searchValue: string,
    setSearchValue: Function,
    setSelectedUserId: Function,
    friends: Friend[],
    loadingFriends: boolean,
    refetchFriends: RefetchFunction<any, any>,
    selectedFriend?: Friend
}) {
    const [isDeleteSnackbarShown, setIsDeleteSnackbarShown] = useState(false);

    return (
        <>
            {subpage === subPageConst.FriendsList &&
                <FriendsList
                    setSubpage={setSubpage}
                    searchValue={searchValue}
                    setSearchValue={setSearchValue}
                    setSelectedUserId={setSelectedUserId}
                    friends={friends}
                    loadingFriends={loadingFriends}
                />}
            {subpage === subPageConst.AddFriend &&
                <AddFriend
                    refetchFriends={refetchFriends}
                    setSubpage={setSubpage}
                />}
            {subpage === subPageConst.Friend &&
                <FriendPage
                    friend={selectedFriend}
                    setSubpage={setSubpage}
                />}
            {subpage === subPageConst.FriendSettings &&
                <FriendSettings
                    friend={selectedFriend}
                    friends={friends}
                    refetchFriends={refetchFriends}
                    setSubpage={setSubpage}
                    setIsDeleteSnackbarShown={setIsDeleteSnackbarShown}
                />}

            {isDeleteSnackbarShown && (
                <Snackbar
                    className="mb-20"
                    before={<Icon28Bin/>}
                    onClose={() => setIsDeleteSnackbarShown(false)}
                >
                    Friend deleted
                </Snackbar>
            )}
        </>
    );
}