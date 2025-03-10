"use client"

import {MouseEventHandler} from "react";
import {useTranslation} from "react-i18next";
import classNames from "classnames";
import {Button} from "@telegram-apps/telegram-ui";
import HeaderWithSearch from "@/app/components/header/headerWithSearch";

export default function AddGroupsHeader({searchValue, setSearchValue, isPrevVisible, isNextDisabled, onPrev, onNext}: {
    searchValue: string,
    setSearchValue: Function,
    isPrevVisible: boolean,
    isNextDisabled: boolean,
    onPrev: MouseEventHandler<HTMLButtonElement>,
    onNext: MouseEventHandler<HTMLButtonElement>
}) {
    const {t} = useTranslation();
    return (
        <HeaderWithSearch
            searchValue={searchValue}
            setSearchValue={setSearchValue}
            forceSearchOpen={isPrevVisible}
            LeftComponent={() => (
                <Button
                    size="l"
                    mode="plain"
                    onClick={onPrev}
                    className={classNames({
                        "invisible": !isPrevVisible
                    })}
                >
                    {t("addGroup.Prev")}
                </Button>
            )}
            RightComponent={() => (
                <Button
                    size="l"
                    mode="plain"
                    onClick={onNext}
                    disabled={isNextDisabled}
                >
                    {t("addGroup.Next")}
                </Button>
            )}
        />
    );
}