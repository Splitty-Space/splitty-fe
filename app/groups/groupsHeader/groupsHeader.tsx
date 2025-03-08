"use client"

import {useRouter} from "next/navigation";
import HeaderWithSearch from "@/app/main/header/headerWithSearch";
import {IconButton} from "@telegram-apps/telegram-ui";
import {Icon28AddCircle} from "@telegram-apps/telegram-ui/dist/icons/28/add_circle";

export default function GroupsHeader({searchValue, setSearchValue, setSubpage}: {
    searchValue: string,
    setSearchValue: Function,
    setSubpage: Function
}) {
    const router = useRouter();

    return (
        <HeaderWithSearch
            searchValue={searchValue}
            setSearchValue={setSearchValue}
            RightComponent={() => (
                <IconButton
                    size="l"
                    mode="bezeled"
                    onClick={() => router.push("/groups/add")}
                >
                    <Icon28AddCircle/>
                </IconButton>)
            }
        />
    );
}