import React, {useState} from "react";
import {useTranslation} from "react-i18next";
import {Avatar, Button, Cell, Divider, IconContainer, List, Select, Spinner, Title} from "@telegram-apps/telegram-ui";
import {Icon28Chat} from "@telegram-apps/telegram-ui/dist/icons/28/chat";
import {Icon28Devices} from "@telegram-apps/telegram-ui/dist/icons/28/devices";
import {Icon28Stats} from "@telegram-apps/telegram-ui/dist/icons/28/stats";
import {LANGUAGES} from "@/const/languages";
import useMe from "@/services/useMe";
import useUpdateUserSettings from "@/services/useUpdateUserSettings";
import i18next from "i18next";
import {CurrencySelect} from "@/components/CurrencySelect";
import Header from "@/app/main/header/header";
import Logo from "@/app/main/header/logo";

export default function Account() {
    const {t} = useTranslation();

    const {data, refetch} = useMe();

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

            <main className="mt-4 mx-4 flex flex-col items-center justify-center">
                {data ?
                    <>
                        <div className="flex flex-col items-center mb-16">
                            <Avatar
                                size={96}
                                src={data.photo_url}
                            />

                            <Title
                                className="mt-4"
                                level="1"
                                weight="1"
                            >
                                {data.name}
                            </Title>
                        </div>

                        <List
                            className="w-full rounded-xl py-0"
                            style={{
                                background: "var(--tgui--bg_color)",
                            }}
                        >
                            <Cell
                                className="p-0 margin-0 max-h-12"
                                before={<IconContainer><Icon28Chat/></IconContainer>}
                                onClick={onContactUs}
                            >
                                {t("account.ContactUs")}
                            </Cell>
                            <Divider className="ml-10 margin-bottom-0-125"/>

                            <Cell
                                className="p-0 margin-0"
                                before={<IconContainer><Icon28Stats/></IconContainer>}
                                after={<CurrencySelect
                                    isLoading={isCurrencyLoading}
                                    defaultCurrency={data.default_currency}
                                    onChange={onCurrencyChange}
                                    className="h-10"
                                />}
                            >
                                {t("account.DefaultCurrency")}
                            </Cell>
                            <Divider className="ml-10 margin-bottom-0-125"/>

                            <Cell
                                className="p-0 margin-0"
                                before={<IconContainer><Icon28Devices/></IconContainer>}
                                after={!isLanguageLoading ?
                                    <Select
                                        defaultValue={data.language.toUpperCase()}
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
                        </List>
                    </>
                    :
                    <Spinner size="l"/>
                }
            </main>
        </>
    );
}