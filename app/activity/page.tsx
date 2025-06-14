"use client"

import React, {useCallback, useEffect, useState} from "react";
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

export default function ActivityPage() {
    const {t} = useTranslation();

    const setPageData = useStore((state) => state.setPageData);
    const setSelectedExpense = useStore((state) => state.setSelectedExpense);
    const setIsCantShowDeletedExpenseSnackbarShown = useStore((state) => state.setIsCantShowDeletedExpenseSnackbarShown);

    const {data: me} = useMe();

    const pageSize = defaultPageSize;
    const [rowCount, setRowCount] = useState(pageSize);
    const [activities, setActivities] = useState<Activity[]>([]);
    const [isLoaded, setIsLoaded] = useState(false);
    const [isLoadingExpense, setIsLoadingExpense] = useState(false);

    const [refContainer, height] = useContentHeight();

    const loadPage = (page: number) => {
        console.log("loadPage = ", loadPage);
        console.log("page = ", page);
        setIsLoaded(false);

        const controller = new AbortController();

        getActivities({
            page,
            pageSize,
            signal: controller.signal
        }).then(({data}) => {
            setIsLoaded(true);
            setRowCount(data.meta.total_records);
            setActivities(prevState => page === 1 ? data.data : [...prevState, ...data.data]);
        }).catch((error) => {
            console.error({error})
        });

        return () => {
            controller.abort();
        }
    };

    useEffect(() => {
        console.log("loadPage useEffect");
        loadPage(1);
    }, []);

    const isRowLoaded = ({index}: { index: number }) => {
        return activities && !!activities[index];
    };

    const loadMoreRows = ({startIndex}: { startIndex: number }) => {
        console.log("loadMoreRows = ", startIndex);

        if (!Number.isInteger(startIndex / pageSize)) {
            return;
        }

        loadPage(startIndex / pageSize + 1);
    };

    const router = useRouter();

    const onCellClick = useCallback((expense: Expense) => () => {
        console.log("onCellClick = ", onCellClick);
        if (!isLoadingExpense && !expense.isDeleted) {
            setIsLoadingExpense(true);
            getExpense({expense_id: expense.id}).then(({data}) => {
                setSelectedExpense({...data});
                setPageData({isFromActivity: true});
                router.push(expenseDetails);
            });
        } else {
            setIsCantShowDeletedExpenseSnackbarShown(true);
            vibration("rigid");
        }
    }, [isLoadingExpense, setSelectedExpense, setPageData, router, setIsCantShowDeletedExpenseSnackbarShown]);

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
            <div key={key} style={style}>
                <Cell
                    className="friends-list_shrink-0"
                    subtitle={formatDateTime(created_at, me.language)}
                    before={<Avatar size={48} user_id={user?.id}/>}
                    onClick={onCellClick(expense)}
                >
                    {activity_type !== ACTIVITY_TYPE.PAYMENT_CREATED ?
                        `${user.name} ` + t(`activity.${ACTIVITY_TYPE_TO_TEXT[activity_type]}`) + ` "${expense.description}"` :
                        expense.expense_users.find(expense_user => expense_user.lent_amount === 0)?.user.id === me.id ?
                            `${expense.expense_users.find(expense_user => expense_user.debt_amount === 0)?.user.name} ${t("settleUp.PaidYou")}` :
                            `${t("settleUp.YouPaid")} ${expense.expense_users.find(expense_user => expense_user.lent_amount === 0)?.user.name}`
                    }
                </Cell>
                <Divider className="ml-20 border-2"/>
            </div>
        );
    };

    const onRefresh = () => {
        console.log("onRefresh = ", onRefresh);
        loadPage(1);
        return Promise.resolve();
    };

    console.log("isLoaded = ", isLoaded);
    console.log("isLoadingExpense = ", isLoadingExpense);
    console.log("activities = ", activities);

    return (
        <>
            <Header
                CentralComponent={Logo}
                subHeaderClassName="justify-content-center"
            />

            <Main
                ref={refContainer}
                center={!isLoaded || isLoadingExpense || activities?.length === 0}
            >
                {!isLoaded || isLoadingExpense ?
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