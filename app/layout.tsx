"use client"

import {usePathname, useRouter} from "next/navigation";
import React, {useEffect, useState} from "react";
import i18next from "i18next";
import "@/i18n";
import {AppRoot, Snackbar} from "@telegram-apps/telegram-ui";
import "@telegram-apps/telegram-ui/dist/styles.css";
import classNames from "classnames";
import "@/API/axiosConfig";
import useMe from "@/services/useMe";
import {DARK, DEFAULT_THEME, THEME_TYPE} from "@/const/theme";
import {ANDROID, DEFAULT_PLATFORM, IOS, PLATFORM_TYPE} from "@/const/platform";
import {AppRootContext} from "./AppRootContext";
import {backButton, miniApp, closingBehavior, swipeBehavior, viewport} from "@telegram-apps/sdk";
import {retrieveLaunchParams} from "@telegram-apps/bridge";
import {LocalizationProvider} from "@mui/x-date-pickers";
import {ThemeProvider, createTheme} from "@mui/material/styles";
import {AdapterDayjs} from "@mui/x-date-pickers/AdapterDayjs";
import Footer from "@/app/components/footer/footer";
import {useStore} from "@/app/store";
import useFriends from "@/services/useFriends";
import {Icon28Bin} from "@/Icons";
import {useTranslation} from "react-i18next";
import {account, activity, expenseParticipants, friendsList, groups} from "@/const/urls";
import "./globals.css";

// import type {Metadata} from "next";
// export const metadata: Metadata = {
//     title: "Splitty",
//     description: "",
// };

const darkTheme = createTheme({
    palette: {
        mode: DARK,
    },
});

export default function RootLayout({children}: Readonly<{
    children: React.ReactNode;
}>) {
    const [platform, setPlatform] = useState<PLATFORM_TYPE>(DEFAULT_PLATFORM);
    const [appearance, setAppearance] = useState<THEME_TYPE>(DEFAULT_THEME);

    const {data: me} = useMe();

    useEffect(() => {
        if (me) {
            i18next.changeLanguage(me.language);
        }
    }, [me]);

    useEffect(() => {
        setAppearance(DARK);
        setPlatform(IOS);
    }, []);

    useEffect(() => {
        if (closingBehavior.mount.isAvailable()) {
            closingBehavior.mount();

            if (closingBehavior.enableConfirmation.isAvailable()) {
                closingBehavior.enableConfirmation();
            }
        }

        if (swipeBehavior.mount.isAvailable()) {
            swipeBehavior.mount();

            if (swipeBehavior.disableVertical.isAvailable()) {
                swipeBehavior.disableVertical();
            }
        }

        return () => {
            closingBehavior.unmount();
            swipeBehavior.unmount();
        };
    }, []);

    useEffect(() => {
        const mountViewport = async () => {
            if (viewport.mount.isAvailable()) {
                try {
                    const promise = viewport.mount();
                    await promise;
                } catch (err) {
                    console.log("viewport.mountError() = ", viewport.mountError());
                }
            }
        };

        const enableFullscreen = async () => {
            if (viewport.requestFullscreen.isAvailable()) {
                await viewport.requestFullscreen();
            }
        };

        const expandScreen = () => {
            if (viewport.expand.isAvailable()) {
                viewport.expand();
            }
        };

        mountViewport().then(() => {
            function checkIfTelegramScriptReady() {
                setTimeout(() => {
                    const launchParams = retrieveLaunchParams();
                    if (launchParams) {
                        const platform = launchParams.tgWebAppPlatform;

                        if (platform === IOS || platform === ANDROID) {
                            // enableFullscreen(); // TODO
                        }

                        expandScreen();
                    } else {
                        checkIfTelegramScriptReady();
                    }
                }, 100);
            }

            checkIfTelegramScriptReady();
        });

        return () => {
            viewport.unmount();
        };
    }, []);

    useEffect(() => {
        const mountMiniApp = async () => {
            if (miniApp.mount.isAvailable()) {
                try {
                    const promise = miniApp.mount();
                    console.log("miniApp.isMounting() = ", miniApp.isMounting());

                    await promise;

                    console.log("miniApp.isMounting() = ", miniApp.isMounting());
                    console.log("miniApp.isMounted() = ", miniApp.isMounted());
                } catch (err) {
                    console.log("miniApp.mountError() = ", miniApp.mountError());
                    console.log("miniApp.isMounting() = ", miniApp.isMounting());
                    console.log("miniApp.isMounted() = ", miniApp.isMounted());
                }
            }
        }

        mountMiniApp().then(() => {
            if (miniApp.setBackgroundColor.isAvailable()) {
                miniApp.setBackgroundColor("#1c1c1d");

                console.log("miniApp.backgroundColor() = ", miniApp.backgroundColor());
            }

            if (miniApp.setHeaderColor.isAvailable()) {
                miniApp.setHeaderColor("#1c1c1d");
                miniApp.headerColor();

                console.log("miniApp.headerColor() = ", miniApp.headerColor());
            }
        });
    }, []);

    const router = useRouter();
    const pathname = usePathname();

    useEffect(() => {
        if (backButton.mount.isAvailable()) {
            backButton.mount();
        }
        return () => {
            backButton.unmount();
        };
    }, []);

    useEffect(() => {
        let offClick: VoidFunction;

        if (pathname === friendsList ||
            pathname === groups ||
            pathname === expenseParticipants ||
            pathname === activity ||
            pathname === account) {
            if (backButton.hide.isAvailable()) {
                backButton.hide();
            }
        } else {
            if (backButton.show.isAvailable()) {
                backButton.show();

                if (backButton.onClick.isAvailable()) {
                    function listener() {
                        router.back();
                    }

                    offClick = backButton.onClick(listener);
                }
            }
        }

        return () => {
            offClick && offClick();
        };
    }, [router, pathname]);

    const {t} = useTranslation();

    const searchValue = useStore((state) => state.searchValue);
    const setSearchValue = useStore((state) => state.setSearchValue);
    const selectedUserId = useStore((state) => state.selectedUserId);
    const setSelectedUserId = useStore((state) => state.setSelectedUserId);
    const setSelectedFriends = useStore((state) => state.setSelectedFriends);
    const setSelectedExpense = useStore((state) => state.setSelectedExpense);
    const isDeleteFriendSnackbarShown = useStore((state) => state.isDeleteFriendSnackbarShown);
    const setIsDeleteFriendSnackbarShown = useStore((state) => state.setIsDeleteFriendSnackbarShown);
    const isDeleteExpenseSnackbarShown = useStore((state) => state.isDeleteExpenseSnackbarShown);
    const setIsDeleteExpenseSnackbarShown = useStore((state) => state.setIsDeleteExpenseSnackbarShown);

    const {data} = useFriends(searchValue)
    const friends = data?.data;

    return (
        <html lang="en">
        {/*<Script src="https://telegram.org/js/telegram-web-app.js"/>*/}

        <body className={classNames("overflow-hidden h-screen", {
            "body_dark": appearance === DARK
        })}>
        {platform && appearance && (
            <AppRootContext.Provider value={{platform, appearance}}>
                <LocalizationProvider dateAdapter={AdapterDayjs}
                                      adapterLocale={i18next?.language === "ua" ? "uk" : i18next?.language}>
                    <ThemeProvider theme={darkTheme}>
                        <AppRoot
                            platform={platform}
                            appearance={appearance}
                            className="app-root"
                        >
                            {children}

                            <Footer
                                friends={friends}
                                selectedUserId={selectedUserId}
                                setSelectedUserId={setSelectedUserId}
                                setSelectedFriends={setSelectedFriends}
                                setSearchValue={setSearchValue}
                                setSelectedExpense={setSelectedExpense}
                            />

                            {isDeleteFriendSnackbarShown && (
                                <Snackbar
                                    className="mb-20"
                                    before={<Icon28Bin/>}
                                    onClose={() => setIsDeleteFriendSnackbarShown(false)}
                                >
                                    {t("friendSettings.FriendDeleted")}
                                </Snackbar>
                            )}

                            {isDeleteExpenseSnackbarShown && (
                                <Snackbar
                                    className="mb-20"
                                    before={<Icon28Bin/>}
                                    onClose={() => setIsDeleteExpenseSnackbarShown(false)}
                                >
                                    {t("expenseDetails.ExpenseDeleted")}
                                </Snackbar>
                            )}
                        </AppRoot>
                    </ThemeProvider>
                </LocalizationProvider>
            </AppRootContext.Provider>)
        }
        </body>
        </html>
    );
}
