import React from "react";
import Loader from "@/app/components/loader/loader";
import SimplePullToRefresh from "react-simple-pull-to-refresh";
import {vibration} from "@/utils/vibration";

const PullToRefresh = ({onRefresh, children}: { onRefresh: Function, children: React.ReactNode }) => {
    const _onRefresh = () => {
        vibration();
        return onRefresh();
    };

    return (
        <SimplePullToRefresh
            // @ts-ignore
            onRefresh={_onRefresh}
            pullingContent={<></>}
            refreshingContent={
                <div className="flex flex-col items-center mt-4">
                    <Loader/>
                </div>
            }
        >
            {/* @ts-ignore */}
            {children}
        </SimplePullToRefresh>
    );
};

export default PullToRefresh;