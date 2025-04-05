"use client"

import React, {useState} from "react";
import {useTranslation} from "react-i18next";
import {Cell, Divider, IconContainer, List, Select, Spinner, Title} from "@telegram-apps/telegram-ui";
import {Icon28Chat} from "@telegram-apps/telegram-ui/dist/icons/28/chat";
import {Icon28Devices} from "@telegram-apps/telegram-ui/dist/icons/28/devices";
import {Icon28Stats} from "@telegram-apps/telegram-ui/dist/icons/28/stats";
import {Icon28Warning} from "@/Icons";
import {LANGUAGES} from "@/const/languages";
import useMe from "@/services/useMe";
import useUpdateUserSettings from "@/services/useUpdateUserSettings";
import i18next from "i18next";
import {CurrencySelect} from "@/components/CurrencySelect";
import Header from "@/app/components/header/header";
import Logo from "@/app/components/header/logo";
import Main from "@/app/components/main/main";
import Avatar from "@/app/components/avatar/Avatar";

export default function Account() {
    const {t} = useTranslation();

    const {data: me, refetch} = useMe();

    const {updateUserSettings} = useUpdateUserSettings();

    const [isCurrencyLoading, setIsCurrencyLoading] = useState(false);
    const [isLanguageLoading, setIsLanguageLoading] = useState(false);

    const onContactUs = () => {
        window.location.replace("https://t.me/Eoller");
    };

    const onCurrencyChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        setIsCurrencyLoading(true);
        updateUserSettings({
            defaultCurrency: e.target.value,
        }).then(() =>
            refetch().then(() => setIsCurrencyLoading(false))
        );
    };

    const onLanguageChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        setIsLanguageLoading(true);
        updateUserSettings({
            language: e.target.value,
        }).then(() =>
            refetch().then(() => {
                setIsLanguageLoading(false);
                i18next.changeLanguage(e.target.value.toLowerCase());
            })
        );
    };

    return (
        <>
            <Header
                CentralComponent={Logo}
                subHeaderClassName="justify-content-center"
            />

            <Main className="px-4 flex flex-col items-center">
                {me ?
                    <>
                        <div className="flex flex-col items-center mt-4">
                            <Avatar
                                size={96}
                                user_id={me.id}
                            />

                            <Title
                                className="mt-4"
                                level="1"
                                weight="1"
                            >
                                {me.name}
                            </Title>
                        </div>

                        <List
                            className="w-11/12 rounded-xl py-0 pr-0 absolute top-1/2 -translate-y-1/2 mt-4"
                            style={{
                                background: "var(--tgui--bg_color)",
                            }}
                        >
                            <Cell
                                className="p-0 margin-0"
                                before={<IconContainer><Icon28Stats/></IconContainer>}
                                after={<CurrencySelect
                                    isLoading={isCurrencyLoading}
                                    defaultCurrency={me.default_currency}
                                    onChange={onCurrencyChange}
                                    className="h-10"
                                />}
                            >
                                {t("account.DefaultCurrency")}
                            </Cell>
                            <Divider className="ml-10 margin-bottom-0-125 border-2"/>

                            <Cell
                                className="p-0 margin-0"
                                before={<IconContainer><Icon28Devices/></IconContainer>}
                                after={!isLanguageLoading ?
                                    <Select
                                        defaultValue={me.language.toUpperCase()}
                                        className="ml-8"
                                        onChange={onLanguageChange}
                                    >
                                        {LANGUAGES.map((language) => (
                                            <option key={language}>{language}</option>
                                        ))}
                                    </Select>
                                    :
                                    <Spinner size="s" className="ml-8 my-2.5"/>
                                }
                            >
                                {t("account.Language")}
                            </Cell>
                            <Divider className="ml-10 margin-bottom-0-125 border-2"/>

                            <Cell
                                className="p-0 margin-0 max-h-12"
                                before={<IconContainer><Icon28Chat/></IconContainer>}
                                onClick={onContactUs}
                            >
                                {t("account.ContactUs")}
                            </Cell>
                            <Divider className="ml-10 margin-bottom-0-125 border-2"/>

                            <Cell
                                className="p-0 margin-0 max-h-12"
                                before={<IconContainer><Icon28Warning/></IconContainer>}
                                onClick={onContactUs}
                            >
                                {t("account.ReportABug")} / {t("account.ProposeChanges")}
                            </Cell>
                        </List>
                    </>
                    :
                    <Spinner size="l"/>
                }
            </Main>
        </>
    );
}