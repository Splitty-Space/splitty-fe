"use client"

// The module enables the Telegram mock only in the development browser.
import "@/utils/mockTelegramEnv";
import {usePathname, useRouter} from "next/navigation";
import React, {useCallback, useEffect, useMemo, useRef, useState} from "react";
import i18next from "i18next";
import "@/i18n";
import dynamic from "next/dynamic"
import {AppRoot, Snackbar} from "@telegram-apps/telegram-ui";
import "@telegram-apps/telegram-ui/dist/styles.css";
import "@/API/axiosConfig";
import useMe from "@/services/useMe";
import {DARK, DEFAULT_THEME, THEME_TYPE} from "@/const/theme";
import {DEFAULT_PLATFORM, IOS, PLATFORM_TYPE} from "@/const/platform";
import {AppRootContext} from "./AppRootContext";
import {backButton, closingBehavior, miniApp, swipeBehavior, viewport, postEvent} from "@telegram-apps/sdk";
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
    groups
} from "@/const/urls";
import {DEFAULT_SNACKBAR_DURATION} from "@/const/defaultSnackbarDuration";
import {addFriend} from "@/services/addFriend";
import {TUTORIAL_USER_ID} from "@/const/tutorialUserId";
import {generateTestExpense, generateTestExpenseWithSplit} from "@/utils/generateTestExpense";
import useUpdateUserSettings from "@/services/useUpdateUserSettings";
import "./globals.css";
import useAuth from "@/hooks/useAuth";
import {isTMA} from "@telegram-apps/bridge";


const Tour = dynamic(
    () => import("@/app/components/tour/tour"),
    {ssr: false}
);

// Wait for the full mount promise to settle before starting another mount.
// The SDK clears its concurrency guard asynchronously after cancellation.
let viewportMountTask: Promise<void> = Promise.resolve();

export default function ClientLayout({children}: Readonly<{
    children: React.ReactNode;
}>) {
    useAuth();

    const isRequestErrorSnackbarShown = useStore((state) => state.isRequestErrorSnackbarShown);
    const setIsRequestErrorSnackbarShown = useStore((state) => state.setIsRequestErrorSnackbarShown);
    const [platform, setPlatform] = useState<PLATFORM_TYPE>(DEFAULT_PLATFORM);
    const [appearance, setAppearance] = useState<THEME_TYPE>(DEFAULT_THEME);

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

    const {data: me, refetch: refetchMe} = useMe();

    useEffect(() => {
        if (me) {
            void i18next.changeLanguage(me.language).catch(() => setIsRequestErrorSnackbarShown(true));

            setIsTourOpen(!me.isGuideShown);
        } else {
            // Omitting the language invokes the browser language detector.
            void i18next.changeLanguage().catch(() => setIsRequestErrorSnackbarShown(true));
        }
    }, [me, setIsTourOpen, setIsRequestErrorSnackbarShown]);

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
        let disposed = false;

        viewportMountTask = viewportMountTask.then(async () => {
            if (!disposed && viewport.mount.isAvailable()) {
                try {
                    await viewport.mount();

                    if (!disposed && viewport.expand.isAvailable()) {
                        viewport.expand();
                    }
                } catch (err) {
                    // Cleanup cancels a pending mount, including during Strict Mode replay.
                    if (!disposed) {
                        console.error("Viewport initialization failed:", err);
                    }
                }
            }
        });

        return () => {
            disposed = true;
            viewport.unmount();
        };
    }, []);

    useEffect(() => {
        if (!miniApp.mountSync.isAvailable()) {
            return;
        }

        try {
            miniApp.mountSync();

            if (miniApp.setBackgroundColor.isAvailable()) {
                miniApp.setBackgroundColor("#000000");
            }

            if (miniApp.setHeaderColor.isAvailable()) {
                miniApp.setHeaderColor("#000000");
            }
        } catch (err) {
            console.error("Mini app initialization failed:", err);
        }

        return () => {
            miniApp.unmount();
        };
    }, []);

    useEffect(() => {
        if (isTMA()) {
            postEvent("web_app_toggle_orientation_lock", {locked: true});
        }
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

    const {data, refetchFriends} = useFriends(searchValue);
    const friends = data?.data;

    const onCloseFriendDeleted = useCallback(() => setIsDeleteFriendSnackbarShown(false), [setIsDeleteFriendSnackbarShown]);
    const onCloseExpenseCreated = useCallback(() => setIsCreateExpenseSnackbarShown(false), [setIsCreateExpenseSnackbarShown]);
    const onCloseExpenseUpdated = useCallback(() => setIsUpdateExpenseSnackbarShown(false), [setIsUpdateExpenseSnackbarShown]);
    const onCloseExpenseDeleted = useCallback(() => setIsDeleteExpenseSnackbarShown(false), [setIsDeleteExpenseSnackbarShown]);
    const onCloseCantShowDeletedExpense = useCallback(() => setIsCantShowDeletedExpenseSnackbarShown(false), [setIsCantShowDeletedExpenseSnackbarShown]);
    const onCloseFriendRequestSent = useCallback(() => setIsFriendRequestSentSnackbarShown(false), [setIsFriendRequestSentSnackbarShown]);
    const onCloseGroupComingSoon = useCallback(() => setIsGroupComingSoonSnackbarShown(false), [setIsGroupComingSoonSnackbarShown]);

    const {updateUserSettings} = useUpdateUserSettings();

    // The tutorial expense is saved once per tour, however often its save step is re-entered.
    const isTutorialSaveRequested = useRef(false);

    const closeTour = useCallback(() => {
        setIsTourOpen(false);
        setIsForceExpenseSaveEnabled(false);
        isTutorialSaveRequested.current = false;

        updateUserSettings({
            isGuideShown: true
        }).then(() => refetchMe()).catch(() => setIsRequestErrorSnackbarShown(true));
    }, [refetchMe, setIsTourOpen, setIsForceExpenseSaveEnabled, updateUserSettings, setIsRequestErrorSnackbarShown]);

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
                    addFriend(TUTORIAL_USER_ID)
                        .then(() => refetchFriends())
                        .catch(() => setIsRequestErrorSnackbarShown(true));
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
                if (!isTutorialSaveRequested.current) {
                    isTutorialSaveRequested.current = true;
                    setIsForceExpenseSaveEnabled(true);
                }
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
    ], [isTestFriendAlreadyExist, me, refetchFriends, router, setIsForceExpenseSaveEnabled, setSelectedExpense, setSelectedUserId, setIsRequestErrorSnackbarShown, t, testFriend]);

    return <>
        {platform && appearance && (
            <AppRootContext.Provider value={{platform, appearance}}>
                        <AppRoot
                            platform={platform}
                            appearance={appearance}
                            className="app-root"
                        >
                            {children}

                            {isRequestErrorSnackbarShown && (
                                <Snackbar
                                    className="mb-20"
                                    before={<Icon28Warning/>}
                                    onClose={() => setIsRequestErrorSnackbarShown(false)}
                                    duration={6000}
                                >
                                    {t("common.RequestFailed")}
                                </Snackbar>
                            )}

                            <Footer
                                friends={friends}
                                selectedUserId={selectedUserId}
                                setSelectedUserId={setSelectedUserId}
                                setSelectedFriends={setSelectedFriends}
                                setSearchValue={setSearchValue}
                                setSelectedExpense={setSelectedExpense}
                            />

                            <Tour
                                steps={tourConfig}
                                isOpen={isTourOpen}
                                onRequestClose={closeTour}
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
            </AppRootContext.Provider>)
        }
    </>;
}
