"use client"

import {usePathname, useRouter} from "next/navigation";
import React, {useCallback, useEffect, useMemo, useState} from "react";
import i18next from "i18next";
import "@/i18n";
import Head from "next/head";
import dynamic from "next/dynamic"
import {AppRoot, Snackbar} from "@telegram-apps/telegram-ui";
import "@telegram-apps/telegram-ui/dist/styles.css";
import classNames from "classnames";
import "@/API/axiosConfig";
import useMe from "@/services/useMe";
import {DARK, DEFAULT_THEME, THEME_TYPE} from "@/const/theme";
import {DEFAULT_PLATFORM, IOS, PLATFORM_TYPE} from "@/const/platform";
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
import {
    account,
    activity,
    addExpense,
    expenseDetails,
    expenseParticipants,
    friend,
    friendsList,
    groups,
    urls
} from "@/const/urls";
import {DEFAULT_SNACKBAR_DURATION} from "@/const/defaultSnackbarDuration";
import {addFriend} from "@/services/addFriend";
import {TUTORIAL_USER_ID} from "@/const/tutorialUserId";
import {generateTestExpense, generateTestExpenseWithSplit} from "@/utils/generateTestExpense";
import "./globals.css";


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
    const setIsForceExpenseSaveEnabled = useStore((state) => state.setIsForceExpenseSaveEnabled);

    const {data, refetchFriends} = useFriends(searchValue);
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

    const testFriend = friends?.find((friend) => friend.id === TUTORIAL_USER_ID);
    const isTestFriendAlreadyExist = testFriend;

    const tourConfig = useMemo(() => [
        {
            selector: "#logo",
            content: t("tour.Welcome"),
            action: () => {
                router.push(friendsList);
            }
        },
        {
            selector: "#share-button",
            content: t("tour.Share"),
            action: () => {
                if (!isTestFriendAlreadyExist) {
                    console.log("addFriend");
                    addFriend(TUTORIAL_USER_ID)
                        .then(() => refetchFriends())
                        .catch((err) => {
                            console.error("addFriend error: ", err);
                        });
                }
            }
        },
        {
            selector: `#friend_${TUTORIAL_USER_ID}`,
            content: t("tour.TestFriend"),
            action: () => {
                router.push(friendsList);
            }
        },
        {
            content: t("tour.FriendPage"),
            action: () => {
                setSelectedUserId(TUTORIAL_USER_ID);
                router.push(friend);
            }
        },
        {
            selector: "#plus-icon",
            content: t("tour.Plus"),
            action: () => {
                router.push(friend);
            }
        },
        {
            selector: "#expense-add-name-and-money",
            content: t("tour.Expense"),
            action: () => {
                router.push(addExpense);

                if (testFriend) {
                    setSelectedExpense(generateTestExpense(me, testFriend, t));
                }
            }
        },
        {
            selector: "#expense-add-date-and-switches",
            content: t("tour.ExpenseSplit"),
            action: () => {
                router.push(addExpense);

                if (testFriend) {
                    setSelectedExpense(generateTestExpenseWithSplit(me, testFriend, t));
                }
            }
        },
        {
            selector: "#expense-add-paid-by",
            content: t("tour.ExpensePaidBy"),
        },
        {
            selector: "#expense-add-split-equally",
            content: t("tour.ExpenseSplitEqually"),
        },
        {
            selector: "#expense-add-save-button",
            content: t("tour.Save"),
            action: () => {
                if (testFriend) {
                    setSelectedExpense(generateTestExpenseWithSplit(me, testFriend, t));
                }
                router.push(addExpense);
            }
        },
        {
            selector: "#expense-details",
            content: t("tour.NewExpenseAdded"),
            action: () => {
                setIsForceExpenseSaveEnabled(true);
                router.push(expenseDetails);
            }
        },
        {
            selector: "#plus-icon",
            content: t("tour.SeveralFriends"),
            action: () => {
                router.push(friendsList);
                setIsForceExpenseSaveEnabled(false);
            }
        },
        {
            selector: "#expense-participants-main",
            content: t("tour.SelectFriends"),
            action: () => {
                router.push(expenseParticipants);
            }
        },
        {
            selector: "#activity-icon",
            content: t("tour.Activity"),
            action: () => {
                router.push(activity);
            }
        },
        {
            selector: "#account-icon",
            content: t("tour.Account"),
            action: () => {
                router.push(account);
            }
        },
    ], [isTestFriendAlreadyExist, me, refetchFriends, router, setIsForceExpenseSaveEnabled, setSelectedExpense, setSelectedUserId, t, testFriend]);

    return (
        <html lang="en">
        <Head>
            <title>Splitty</title>

            <meta name="viewport" content="width=device-width, initial-scale=1, user-scalable=no, viewport-fit=cover"/>
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
                                closeWithMask={false}
                                showNavigation={false}
                                disableInteraction

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
