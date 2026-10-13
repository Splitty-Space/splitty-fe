import {useEffect} from "react";
import {useRouter, useSearchParams} from "next/navigation";
import useFriends from "@/services/useFriends";
import {useStore} from "@/app/store";
import {friendsList} from "@/const/urls";
import {SEARCH_PARAMS} from "@/const/searchParams";
import {parseId} from "@/utils/parseId";

// The friend a page shows comes from the URL, so a reload or Back keeps it (docs/adr/0001-selection-in-url.md).
// A missing id, or one the loaded friends list does not contain, sends the user to the friends list.
export default function useSelectedFriend() {
    const searchParams = useSearchParams();
    const friendId = parseId(searchParams.get(SEARCH_PARAMS.FRIEND_ID));

    const searchValue = useStore((state) => state.searchValue);
    const friendsResult = useFriends(searchValue);
    const friends = friendsResult.data?.data;
    const friend = friendId === null ? undefined : friends?.find(({id}) => id === friendId);
    const isMissing = friendId === null || (!friendsResult.loadingFriends && !!friends && !friend);

    const router = useRouter();
    useEffect(() => {
        if (isMissing) router.replace(friendsList);
    }, [isMissing, router]);

    return {...friendsResult, friend};
}
