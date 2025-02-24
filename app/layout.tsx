"use client"

import Script from "next/script";
import {useRouter} from "next/navigation";
import {useEffect, useState} from "react";
import i18next from "i18next";
import "@/i18n";
import {AppRoot} from "@telegram-apps/telegram-ui";
import "@telegram-apps/telegram-ui/dist/styles.css";
import classNames from "classnames";
import {main} from "@/const/urls";
import "@/API/axiosConfig";
import useMe from "@/services/useMe";
import {DARK, DEFAULT_THEME, THEME_TYPE} from "@/const/theme";
import {DEFAULT_PLATFORM, IOS, BASE, PLATFORM_TYPE} from "@/const/platform";
import {AppRootContext} from "./AppRootContext";
import "./globals.css";

// import type {Metadata} from "next";
// export const metadata: Metadata = {
//     title: "Splitty",
//     description: "",
// };

export default function RootLayout({children}: Readonly<{
    children: React.ReactNode;
}>) {
    const [platform, setPlatform] = useState<PLATFORM_TYPE>(DEFAULT_PLATFORM);
    const [appearance, setAppearance] = useState<THEME_TYPE>(DEFAULT_THEME);

    const {data} = useMe();

    useEffect(() => {
        if (data) {
            i18next.changeLanguage(data.language);
        }
    }, [data]);

    const router = useRouter()

    useEffect(() => {
        function checkIfTelegramScriptReady() {
            setTimeout(() => {
                if (window?.Telegram) {
                    setPlatform(window.Telegram?.WebApp?.platform === IOS ? IOS : BASE);
                    setAppearance(window.Telegram.WebApp.colorScheme);

                    // TODO for test
                    setAppearance(DARK);
                    setPlatform(IOS);

                    window.Telegram.WebApp.expand();

                    router.push(main);
                } else {
                    checkIfTelegramScriptReady();
                }
            }, 10);
        }

        checkIfTelegramScriptReady();
    }, [router]);

    return (
        <html lang="en">
        <Script src="https://telegram.org/js/telegram-web-app.js"/>

        <body className={classNames("overflow-hidden h-screen", {
            "body_dark": appearance === DARK
        })}>
        {platform && appearance && (
            <AppRootContext.Provider value={{platform, appearance}}>
                <AppRoot
                    platform={platform}
                    appearance={appearance}
                    className="app-root"
                >
                    {data && children}
                </AppRoot>
            </AppRootContext.Provider>)
        }
        </body>
        </html>
    );
}
