"use client"

import {subPageConst} from "@/const/subPageConst";
import ActivityList from "@/app/main/activity/activityList";

export default function Activity({subpage, setCurrentTab, setSubpage, setPageData, setSelectedExpense}: {
    subpage: number,
    setCurrentTab: Function,
    setSubpage: Function,
    setPageData: Function,
    setSelectedExpense: Function
}) {
    return (
        <>
            {subpage === subPageConst.ActivityList &&
                <ActivityList
                    setCurrentTab={setCurrentTab}
                    setSubpage={setSubpage}
                    setPageData={setPageData}
                    setSelectedExpense={setSelectedExpense}
                />}
        </>
    );
}