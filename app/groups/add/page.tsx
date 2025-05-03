"use client"

import React, {useState} from "react";
import {useTranslation} from "react-i18next";
import {
    Cell,
    Divider,
    Input,
    List,
    Select,
    Switch,
    Tappable
} from "@telegram-apps/telegram-ui";
import AddGroupsHeader from "@/app/groups/add/addGroupHeader/addGroupHeader";
import {Icon24Close} from "@/Icons";
import {GROUP_KINDS} from "@/const/groupKinds";
import useFriends from "@/services/useFriends";
import classNames from "classnames";
import Avatar from "@/app/components/avatar/Avatar";
import {vibration} from "@/utils/vibration";
import Loader from "@/app/components/loader/loader";

enum STEPS {
    GroupSettings,
    GroupUserSettings,
}

export default function AddGroup() {
    const {t} = useTranslation();
    const [groupName, setGroupName] = useState("");
    const [groupType, setGroupType] = useState(GROUP_KINDS.TRIP);
    const [step, setStep] = useState(STEPS.GroupSettings);

    const [searchValue, setSearchValue] = useState<string>("");
    const {data, loadingFriends} = useFriends(searchValue);
    const [selectedUserIds, setSelectedUserIds] = useState<Array<number>>([]);

    const isGroupSettings = step === STEPS.GroupSettings;
    const isGroupUserSettings = step === STEPS.GroupUserSettings;
    let isNextDisabled = false;
    if (isGroupSettings) {
        if (groupName === "") {
            isNextDisabled = true;
        }
    } else if (isGroupUserSettings) {
        if (selectedUserIds.length === 0) {
            isNextDisabled = true;
        }
    }

    return (
        <>
            <AddGroupsHeader
                searchValue={searchValue}
                setSearchValue={setSearchValue}
                isNextDisabled={isNextDisabled}
                isPrevVisible={isGroupUserSettings}
                onPrev={() => setStep(step => step - 1)}
                onNext={() => setStep(step => step + 1)}
            />
            <main className={classNames({
                "p-4": isGroupSettings,
                "flex items-center justify-center": loadingFriends
            })}>
                {isGroupSettings && (
                    <>
                        < Input
                            status="focused"
                            value={groupName}
                            header={t("addGroup.GroupName")}
                            placeholder={t("addGroup.EnterGroupName")}
                            className="mb-4"
                            onChange={e => setGroupName(e.target.value)}
                            after={
                                <Tappable
                                    Component="div"
                                    style={{display: "flex"}}
                                    onClick={() => setGroupName("")}
                                >
                                    <Icon24Close/>
                                </Tappable>
                            }
                        />

                        <Select
                            value={groupType}
                            header={t("addGroup.GroupType")}
                            // @ts-ignore
                            placeholder={t("addGroup.SelectGroupType")}
                            onChange={(event) => {
                                setGroupType(event.target.value as GROUP_KINDS);
                            }}
                        >
                            {Object.values(GROUP_KINDS)
                                .filter((kind) => isNaN(Number(kind)))
                                .map((kind) => (
                                    <option key={kind} value={kind}>
                                        {t(`addGroup.GroupKinds.${kind}`)}
                                    </option>
                                ))}
                        </Select>
                    </>
                )}
                {isGroupUserSettings && (
                    <>
                        {
                            loadingFriends ?
                                (<Loader/>) :
                                (<List className="mb-8 px-0">
                                    {data?.data?.map(({id, name}: {
                                            id: number, name: string
                                        }) =>
                                            <div key={id}>
                                                <Cell
                                                    before={<Avatar
                                                        size={48}
                                                        user_id={id}
                                                    />}
                                                    after={<Switch
                                                        onChange={(e) => {
                                                            vibration();

                                                            setSelectedUserIds(prev => (
                                                                e.target.checked ?
                                                                    [...prev, id] :
                                                                    prev.filter(x => x !== id)
                                                            ))
                                                        }}
                                                    />}
                                                >
                                                    {name}
                                                </Cell>
                                                <Divider className="ml-20 border-2"/>
                                            </div>
                                    )
                                    }
                                </List>)
                        }
                    </>
                )}
            </main>
        </>
    );
}