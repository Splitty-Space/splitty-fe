"use client"

import React, {useCallback, useState} from "react";
import {useTranslation} from "react-i18next";
import {Cell, Divider, IconContainer, List, Select, Title} from "@telegram-apps/telegram-ui";
import {Icon28Chat} from "@telegram-apps/telegram-ui/dist/icons/28/chat";
import {Icon28Devices} from "@telegram-apps/telegram-ui/dist/icons/28/devices";
import {Icon28Stats} from "@telegram-apps/telegram-ui/dist/icons/28/stats";
import {Icon28Warning, Icon28Lightbulb, Icon28Smile} from "@/Icons";
import {LANGUAGES} from "@/const/languages";
import useMe from "@/services/useMe";
import useUpdateUserSettings from "@/services/useUpdateUserSettings";
import i18next from "i18next";
import {CurrencySelect} from "@/components/CurrencySelect";
import Header from "@/app/components/header/header";
import Logo from "@/app/components/header/logo";
import Main from "@/app/components/main/main";
import Avatar from "@/app/components/avatar/Avatar";
import Loader from "@/app/components/loader/loader";
import {useStore} from "@/app/store";
import {useRouter} from "next/navigation";
import {friendsList} from "@/const/urls";
import {invoice} from "@telegram-apps/sdk";


export default function Account() {
    const {t} = useTranslation();

    const {data: me, refetch} = useMe();

    const {updateUserSettings} = useUpdateUserSettings();

    const [isCurrencyLoading, setIsCurrencyLoading] = useState(false);
    const [isLanguageLoading, setIsLanguageLoading] = useState(false);

    const router = useRouter();

    const setIsTourOpen = useStore((state) => state.setIsTourOpen);

    const onGuideClick = useCallback(() => {
        router.push(friendsList);
        setIsTourOpen(true);
    }, [router, setIsTourOpen]);

    const onContactUs = useCallback(() => {
        window.location.replace("https://t.me/Eoller");
    }, []);

    const onSupportUs = useCallback(async () => {
        console.log("onSupportUs");
        console.log("invoice.isSupported() = ", invoice.isSupported());
        console.log("invoice.open.isAvailable() = ", invoice.open.isAvailable());
        if (invoice.isSupported() && invoice.open.isAvailable()) {
            const promise = invoice.open("Support us 😊");
            const status = await promise;
            console.log("status = ", status);
        } else {
            console.log("Telegram WebApp API is not available.");
        }
    }, []);

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
                                        style={{paddingRight: "69px"}}
                                        onChange={onLanguageChange}
                                    >
                                        {LANGUAGES.map((language) => (
                                            <option key={language}>{language}</option>
                                        ))}
                                    </Select>
                                    :
                                    <Loader className="mr-4 mt-4"/>
                                }
                            >
                                {t("account.Language")}
                            </Cell>
                            <Divider className="ml-10 margin-bottom-0-125 border-2"/>

                            <Cell
                                className="p-0 margin-0 max-h-12"
                                before={<IconContainer><Icon28Lightbulb/></IconContainer>}
                                onClick={onGuideClick}
                            >
                                {t("account.Guide")}
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
                                before={<IconContainer><Icon28Smile/></IconContainer>}
                                onClick={onSupportUs}
                            >
                                {t("account.SupportUs")}
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
                    <Loader/>
                }
            </Main>
        </>
    );
}