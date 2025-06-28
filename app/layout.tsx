"use client"

import {usePathname, useRouter} from "next/navigation";
import React, {useCallback, useEffect, useMemo, useState} from "react";
import i18next from "i18next";
import "@/i18n";
import Head from "next/head";
import {AppRoot, Snackbar} from "@telegram-apps/telegram-ui";
import "@telegram-apps/telegram-ui/dist/styles.css";
import classNames from "classnames";
import "@/API/axiosConfig";
import useMe from "@/services/useMe";
import {DARK, DEFAULT_THEME, THEME_TYPE} from "@/const/theme";
import {ANDROID, DEFAULT_PLATFORM, IOS, PLATFORM_TYPE} from "@/const/platform";
import {AppRootContext} from "./AppRootContext";
import {backButton, closingBehavior, miniApp, swipeBehavior, viewport, postEvent} from "@telegram-apps/sdk";
import {retrieveLaunchParams} from "@telegram-apps/bridge";
import {LocalizationProvider} from "@mui/x-date-pickers";
import {createTheme, ThemeProvider} from "@mui/material/styles";
import {AdapterDayjs} from "@mui/x-date-pickers/AdapterDayjs";
import Footer from "@/app/components/footer/footer";
import {useStore} from "@/app/store";
import useFriends from "@/services/useFriends";
import {Icon28Bin, Icon28Check, Icon28Warning} from "@/Icons";
import {useTranslation} from "react-i18next";
import {account, activity, expenseParticipants, friendsList, groups, urls} from "@/const/urls";
import {DEFAULT_SNACKBAR_DURATION} from "@/const/defaultSnackbarDuration";
import "./globals.css";

import dynamic from "next/dynamic"

const Tour = dynamic(
    // @ts-ignore
    () => import("reactour"),
    {ssr: false}
);

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
                    await promise;
                } catch (err) {
                    console.log("miniApp.mountError() = ", miniApp.mountError());
                }
            }
        }

        mountMiniApp().then(() => {
            if (miniApp.setBackgroundColor.isAvailable()) {
                miniApp.setBackgroundColor("#000000");
            }

            if (miniApp.setHeaderColor.isAvailable()) {
                miniApp.setHeaderColor("#000000");
            }
        });
    }, []);

    useEffect(() => {
        postEvent("web_app_toggle_orientation_lock", {locked: true});
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

    useEffect(() => {
        urls.forEach((route) => {
            router.prefetch(route);
        });
    }, [router]);

    const {t} = useTranslation();

    const searchValue = useStore((state) => state.searchValue);
    const setSearchValue = useStore((state) => state.setSearchValue);
    const selectedUserId = useStore((state) => state.selectedUserId);
    const setSelectedUserId = useStore((state) => state.setSelectedUserId);
    const setSelectedFriends = useStore((state) => state.setSelectedFriends);
    const setSelectedExpense = useStore((state) => state.setSelectedExpense);
    const isTourOpen = useStore((state) => state.isTourOpen);
    const setIsTourOpen = useStore((state) => state.setIsTourOpen);
    const isDeleteFriendSnackbarShown = useStore((state) => state.isDeleteFriendSnackbarShown);
    const setIsDeleteFriendSnackbarShown = useStore((state) => state.setIsDeleteFriendSnackbarShown);
    const isDeleteExpenseSnackbarShown = useStore((state) => state.isDeleteExpenseSnackbarShown);
    const setIsDeleteExpenseSnackbarShown = useStore((state) => state.setIsDeleteExpenseSnackbarShown);
    const isCreateExpenseSnackbarShown = useStore((state) => state.isCreateExpenseSnackbarShown);
    const setIsCreateExpenseSnackbarShown = useStore((state) => state.setIsCreateExpenseSnackbarShown);
    const isUpdateExpenseSnackbarShown = useStore((state) => state.isUpdateExpenseSnackbarShown);
    const setIsUpdateExpenseSnackbarShown = useStore((state) => state.setIsUpdateExpenseSnackbarShown);
    const isCantShowDeletedExpenseSnackbarShown = useStore((state) => state.isCantShowDeletedExpenseSnackbarShown);
    const setIsCantShowDeletedExpenseSnackbarShown = useStore((state) => state.setIsCantShowDeletedExpenseSnackbarShown);
    const isFriendRequestSentSnackbarShown = useStore((state) => state.isFriendRequestSentSnackbarShown);
    const setIsFriendRequestSentSnackbarShown = useStore((state) => state.setIsFriendRequestSentSnackbarShown);
    const isGroupComingSoonSnackbarShown = useStore((state) => state.isGroupComingSoonSnackbarShown);
    const setIsGroupComingSoonSnackbarShown = useStore((state) => state.setIsGroupComingSoonSnackbarShown);

    const {data} = useFriends(searchValue);
    const friends = data?.data;

    const onCloseFriendDeleted = useCallback(() => setIsDeleteFriendSnackbarShown(false), [setIsDeleteFriendSnackbarShown]);
    const onCloseExpenseCreated = useCallback(() => setIsCreateExpenseSnackbarShown(false), [setIsCreateExpenseSnackbarShown]);
    const onCloseExpenseUpdated = useCallback(() => setIsUpdateExpenseSnackbarShown(false), [setIsUpdateExpenseSnackbarShown]);
    const onCloseExpenseDeleted = useCallback(() => setIsDeleteExpenseSnackbarShown(false), [setIsDeleteExpenseSnackbarShown]);
    const onCloseCantShowDeletedExpense = useCallback(() => setIsCantShowDeletedExpenseSnackbarShown(false), [setIsCantShowDeletedExpenseSnackbarShown]);
    const onCloseFriendRequestSent = useCallback(() => setIsFriendRequestSentSnackbarShown(false), [setIsFriendRequestSentSnackbarShown]);
    const onCloseGroupComingSoon = useCallback(() => setIsGroupComingSoonSnackbarShown(false), [setIsGroupComingSoonSnackbarShown]);

    const closeTour = useCallback(() => {
        setIsTourOpen(false);
    }, [setIsTourOpen]);


    const tourConfig = useMemo(() => [
        {
            selector: "#share-button",
            content: "Add friend button"
        },
        {
            selector: "#plus-icon",
            content: "Add new Expense button",
            action: () => {
                router.push(expenseParticipants);
            }
        },
        {
            selector: "#expense-participants-main",
            content: "Pick friends that will be participate in the expense"
        },
        {
            selector: "#expense-participants-next-button",
            content: "Click next button"
        }
    ], [router]);

    return (
        <html lang="en">
        <Head>
            <title>Splitty</title>

            <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, minimum-scale=1.0, user-scalable=no, shrink-to-fit=no"/>
        </Head>

        <body className={classNames("overscroll-none overflow-hidden h-screen", {
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

                            <Tour
                                // @ts-ignore
                                steps={tourConfig}
                                isOpen={isTourOpen}
                                onRequestClose={closeTour}
                                // rounded={5}
                                // maskClassName="mask"
                                // className="helper"
                                // accentColor={accentColor}
                                // onAfterOpen={this.disableBody}
                                // onBeforeClose={this.enableBody}
                            />

                            {isDeleteFriendSnackbarShown && (
                                <Snackbar
                                    className="mb-20"
                                    before={<Icon28Bin/>}
                                    onClose={onCloseFriendDeleted}
                                    duration={DEFAULT_SNACKBAR_DURATION}
                                >
                                    {t("friendSettings.FriendDeleted")}
                                </Snackbar>
                            )}

                            {isCreateExpenseSnackbarShown && (
                                <Snackbar
                                    className="mb-20"
                                    before={<Icon28Check/>}
                                    onClose={onCloseExpenseCreated}
                                    duration={DEFAULT_SNACKBAR_DURATION}
                                >
                                    {t("expenseDetails.ExpenseCreated")}
                                </Snackbar>
                            )}

                            {isUpdateExpenseSnackbarShown && (
                                <Snackbar
                                    className="mb-20"
                                    before={<Icon28Check/>}
                                    onClose={onCloseExpenseUpdated}
                                    duration={DEFAULT_SNACKBAR_DURATION}
                                >
                                    {t("expenseDetails.ExpenseUpdated")}
                                </Snackbar>
                            )}

                            {isDeleteExpenseSnackbarShown && (
                                <Snackbar
                                    className="mb-20"
                                    before={<Icon28Bin/>}
                                    onClose={onCloseExpenseDeleted}
                                    duration={DEFAULT_SNACKBAR_DURATION}
                                >
                                    {t("expenseDetails.ExpenseDeleted")}
                                </Snackbar>
                            )}

                            {isCantShowDeletedExpenseSnackbarShown && (
                                <Snackbar
                                    className="mb-20"
                                    before={<Icon28Warning/>}
                                    onClose={onCloseCantShowDeletedExpense}
                                    duration={DEFAULT_SNACKBAR_DURATION}
                                >
                                    {t("expenseDetails.CantShowDeletedExpense")}
                                </Snackbar>
                            )}

                            {isGroupComingSoonSnackbarShown && (
                                <Snackbar
                                    className="mb-20"
                                    before={<Icon28Warning/>}
                                    onClose={onCloseGroupComingSoon}
                                    duration={DEFAULT_SNACKBAR_DURATION}
                                >
                                    {t("expenseDetails.ComingSoon")}
                                </Snackbar>
                            )}

                            {isFriendRequestSentSnackbarShown && (
                                <Snackbar
                                    className="mb-20"
                                    before={<Icon28Check/>}
                                    onClose={onCloseFriendRequestSent}
                                    duration={DEFAULT_SNACKBAR_DURATION}
                                >
                                    {t("expenseDetails.FriendRequestSent")}
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
