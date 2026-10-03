"use client"

import {useRouter} from "next/navigation";
import HeaderWithSearch from "@/app/components/header/headerWithSearch";
import {IconButton} from "@telegram-apps/telegram-ui";
import {Icon28AddCircle} from "@telegram-apps/telegram-ui/dist/icons/28/add_circle";
import {addGroups} from "@/const/urls";
import {useTranslation} from "react-i18next";

export default function GroupsHeader({searchValue, setSearchValue}: {
    searchValue: string,
    setSearchValue: Function,
}) {
    const router = useRouter();
    const {t} = useTranslation();

    return (
        <HeaderWithSearch
            searchValue={searchValue}
            setSearchValue={setSearchValue}
            RightComponent={() => (
                <IconButton
                    size="l"
                    mode="bezeled"
                    aria-label={t("accessibility.AddGroup")}
                    onClick={() => router.push(addGroups)}
                >
                    <Icon28AddCircle/>
                </IconButton>)
            }
        />
    );
}
