"use client"

import {useCallback, useEffect, useRef, useState} from "react";
import {
    Cell,
    Divider,
    Placeholder,
} from "@telegram-apps/telegram-ui";
import {AutoSizer, InfiniteLoader, List} from "react-virtualized";
import {useTranslation} from "react-i18next";
import useMe from "@/services/useMe";
import {formatDateTime} from "@/utils/formatDateTime";
import Header from "@/app/components/header/header";
import Logo from "@/app/components/header/logo";
import Main from "@/app/components/main/main";
import getActivities from "@/services/getActivities";
import Activity, {ACTIVITY_TYPE, ACTIVITY_TYPE_TO_TEXT} from "@/entities/Activity";
import getExpense from "@/services/getExpense";
import {Expense} from "@/entities";
import {useStore} from "@/app/store";
import {useRouter} from "next/navigation";
import {expenseDetails} from "@/const/urls";
import Avatar from "@/app/components/avatar/Avatar";
import {vibration} from "@/utils/vibration";
import SkeletonCell from "@/app/components/skeletons/skeletonCell";
import {defaultPageSize} from "@/const/defaultPageSize";
import useContentHeight from "@/hooks/useContentHeight";
import Loader from "@/app/components/loader/loader";
import PullToRefresh from "@/app/components/pullToRefresh/pullToRefresh";
import {listAccessibilityProps} from "@/app/components/listAccessibilityProps";

export default function ActivityPage() {
    const {t} = useTranslation();

    const setPageData = useStore((state) => state.setPageData);
    const setSelectedExpense = useStore((state) => state.setSelectedExpense);
    const setIsCantShowDeletedExpenseSnackbarShown = useStore((state) => state.setIsCantShowDeletedExpenseSnackbarShown);

    const {data: me, loading: loadingMe} = useMe();
    const authToken = useStore((state) => state.token);
    const showError = useStore((state) => state.setIsRequestErrorSnackbarShown);
    const listController = useRef<AbortController | null>(null);
    const pendingPages = useRef(new Map<number, Promise<void>>());
    const expenseController = useRef<AbortController | null>(null);

    const pageSize = defaultPageSize;
    const [rowCount, setRowCount] = useState(pageSize);
    const [activities, setActivities] = useState<Activity[]>([]);
    const [isLoaded, setIsLoaded] = useState(false);
    const [isReloadInProgress, setIsReloadInProgress] = useState(false);
    const [isLoadingExpense, setIsLoadingExpense] = useState(false);

    const [refContainer, height] = useContentHeight();

    const loadPage = useCallback((page: number) => {
        const controller = listController.current;
        if (!authToken || !controller || controller.signal.aborted) return Promise.resolve();
        const pending = pendingPages.current.get(page);
        if (pending) return pending;
        const request = getActivities({page, pageSize, signal: controller.signal})
            .then(({data}) => {
                if (controller.signal.aborted) return;
                setIsLoaded(true);
                setRowCount(data.meta.total_records);
                setActivities(previous => {
                    const next = page === 1 ? [] : [...previous];
                    data.data.forEach((item: Activity, index: number) => {
                        next[(page - 1) * pageSize + index] = item;
                    });
                    return next;
                });
            }).catch(() => {
                if (!controller.signal.aborted) showError(true);
            }).finally(() => {
                if (!controller.signal.aborted) {
                    pendingPages.current.delete(page);
                    setIsLoaded(true);
                    if (page === 1) setIsReloadInProgress(false);
                }
            });
        pendingPages.current.set(page, request);
        return request;
    }, [authToken, pageSize, showError]);

    useEffect(() => {
        listController.current = new AbortController();
        pendingPages.current.clear();
        setActivities([]);
        setIsLoaded(false);
        void loadPage(1);
        return () => listController.current?.abort();
    }, [loadPage]);

    useEffect(() => () => expenseController.current?.abort(), []);

    const isRowLoaded = ({index}: { index: number }) => !!activities[index];
    const loadMoreRows = ({startIndex}: { startIndex: number }) => loadPage(Math.floor(startIndex / pageSize) + 1);

    const router = useRouter();

    const onCellClick = useCallback((expense: Expense) => () => {
        if (expenseController.current) return;
        if (expense.isDeleted) {
            setIsCantShowDeletedExpenseSnackbarShown(true);
            vibration("rigid");
            return;
        }
        const controller = new AbortController();
        expenseController.current = controller;
        setIsLoadingExpense(true);
        getExpense({expense_id: expense.id, signal: controller.signal}).then(({data}) => {
            if (controller.signal.aborted) return;
            setSelectedExpense(data);
            setPageData({isFromActivity: true});
            router.push(expenseDetails);
        }).catch(() => {
            if (!controller.signal.aborted) showError(true);
        }).finally(() => {
            if (!controller.signal.aborted) {
                expenseController.current = null;
                setIsLoadingExpense(false);
            }
        });
    }, [setSelectedExpense, setPageData, router, setIsCantShowDeletedExpenseSnackbarShown, showError]);

    const rowRenderer = ({index, key, style}: { index: number, key: string, style: object }) => {
        const activity = activities[index];
        if (!activity) {
            return (<SkeletonCell key={key} style={style} me={me}/>);
        }

        const {
            activity_type,
            user,
            expense,
            created_at,
        } = activity;

        return (
            <div key={key} style={style} role="listitem">
                <Cell
                    className="friends-list_shrink-0"
                    subtitle={formatDateTime(created_at, me?.language ?? "en")}
                    before={<Avatar size={48} user_id={user?.id}/>}
                    onClick={onCellClick(expense)}
                >
                    {activity_type !== ACTIVITY_TYPE.PAYMENT_CREATED ?
                        `${user.name} ` + t(`activity.${ACTIVITY_TYPE_TO_TEXT[activity_type]}`) + ` "${expense.description}"` :
                        expense.expense_users.find(expense_user => expense_user.lent_amount === 0)?.user.id === me?.id ?
                            `${expense.expense_users.find(expense_user => expense_user.debt_amount === 0)?.user.name} ${t("settleUp.PaidYou")}` :
                            `${t("settleUp.YouPaid")} ${expense.expense_users.find(expense_user => expense_user.lent_amount === 0)?.user.name}`
                    }
                </Cell>
                <Divider className="ml-20 border-2"/>
            </div>
        );
    };

    const onRefresh = () => {
        setIsReloadInProgress(true);
        listController.current?.abort();
        listController.current = new AbortController();
        pendingPages.current.clear();
        return loadPage(1);
    };

    return (
        <>
            <Header
                CentralComponent={Logo}
                subHeaderClassName="justify-content-center"
            />

            <Main
                ref={refContainer}
                center={loadingMe || !isLoaded || isReloadInProgress || isLoadingExpense || activities?.length === 0}
            >
                {loadingMe || !isLoaded || isReloadInProgress || isLoadingExpense ?
                    <Loader/> :
                    activities?.length > 0 ?
                        <PullToRefresh onRefresh={onRefresh}>
                            {/* @ts-ignore */}
                            <InfiniteLoader
                                isRowLoaded={isRowLoaded}
                                // @ts-ignore
                                loadMoreRows={loadMoreRows}
                                rowCount={rowCount}
                            >
                                { // @ts-ignore
                                    ({onRowsRendered, registerChild}) => (
                                        // @ts-ignore
                                        <AutoSizer>
                                            {({width}) => (
                                                // @ts-ignore
                                                <List
                                                    {...listAccessibilityProps}
                                                    ref={registerChild}
                                                    width={width}
                                                    height={height}
                                                    rowHeight={68}
                                                    rowCount={rowCount}
                                                    rowRenderer={rowRenderer}
                                                    onRowsRendered={onRowsRendered}
                                                />
                                            )}
                                        </AutoSizer>
                                    )}
                            </InfiniteLoader>
                        </PullToRefresh>
                        :
                        <Placeholder header={t("activity.NoActivityYet")}/>
                }
            </Main>
        </>
    );
}
