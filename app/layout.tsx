"use client"

import Script from "next/script";
import {useRouter} from "next/navigation";
import {useEffect, useState} from "react";
import {AppRoot} from "@telegram-apps/telegram-ui";
import "@telegram-apps/telegram-ui/dist/styles.css";
import classNames from "classnames";
import {main} from "@/const/urls";
import "@/API/axiosConfig";
import "@/i18n";
import "./globals.css";
import useMe from "@/services/useMe";
import i18next from "i18next";

// import type {Metadata} from "next";
// export const metadata: Metadata = {
//     title: "Splitty",
//     description: "",
// };

declare global {
    interface Window {
        Telegram: any;
    }
}

export default function RootLayout({children}: Readonly<{
    children: React.ReactNode;
}>) {

    const [platform, setPlatform] = useState<"base" | "ios">("ios");
    const [appearance, setAppearance] = useState<"light" | "dark">("dark");

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
                    setPlatform(window.Telegram?.WebApp?.platform === "ios" ? "ios" : "base");
                    setAppearance(window.Telegram.WebApp.colorScheme);

                    // TODO for test
                    setAppearance("dark");
                    setPlatform("ios");

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

        <body className={classNames({
            "body_dark": appearance === "dark"
        })}>
        {platform && appearance && (
            <AppRoot
                platform={platform}
                appearance={appearance}
                className="app-root"
            >
                {data && children}
            </AppRoot>)
        }
        </body>
        </html>
    );
}
