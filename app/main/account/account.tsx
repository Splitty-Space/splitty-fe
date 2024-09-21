import React, {useState} from "react";
import {useTranslation} from "react-i18next";
import {Avatar, Cell, IconContainer, List, Select, Spinner, Title} from "@telegram-apps/telegram-ui";
import {Icon28Chat} from "@telegram-apps/telegram-ui/dist/icons/28/chat";
import {Icon28Devices} from "@telegram-apps/telegram-ui/dist/icons/28/devices";
import {Icon28Stats} from "@telegram-apps/telegram-ui/dist/icons/28/stats";
import {CURRENCIES} from "@/const/currencies";
import {LANGUAGES} from "@/const/languages";
import useMe from "@/services/useMe";
import useUpdateUserSettings from "@/services/useUpdateUserSettings";
import i18next from "i18next";

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
        <main className="mt-40 flex flex-col items-center justify-center">
            {data ?
                <>
                    <div className="flex flex-col items-center mb-10">
                        <Avatar
                            size={96}
                            src={data.photo_url}
                        />

                        <Title
                            level="1"
                            weight="1"
                        >
                            {data.name}
                        </Title>
                    </div>

                    <List
                        className="w-full"
                        style={{
                            background: "var(--tgui--secondary_bg_color)",
                        }}
                    >
                        <Cell
                            before={<IconContainer><Icon28Chat/></IconContainer>}
                            onClick={onContactUs}
                        >
                            {t("account.ContactUs")}
                        </Cell>
                        <Cell
                            before={<IconContainer><Icon28Stats/></IconContainer>}
                        >
                            <div className="flex items-center">
                                <span>{t("account.DefaultCurrency")}</span>

                                {/*TODO заменить на CurrencySelect component */}
                                {!isCurrencyLoading ?
                                    <Select
                                        defaultValue={data.default_currency}
                                        className="ml-8"
                                        onChange={onCurrencyChange}
                                    >
                                        {CURRENCIES.map((currency) => (
                                            <option key={currency}>{currency}</option>
                                        ))}
                                    </Select>
                                    :
                                    <Spinner size="s" className="ml-8 my-2.5"/>
                                }
                            </div>
                        </Cell>
                        <Cell before={<IconContainer><Icon28Devices/></IconContainer>}>
                            <div className="flex items-center">
                                <span>{t("account.Language")}</span>

                                {!isLanguageLoading ?
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
                            </div>
                        </Cell>
                    </List>
                </>
                :
                <Spinner size="l"/>
            }
        </main>);
}