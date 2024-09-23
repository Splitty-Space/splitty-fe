"use client"

import React, {FC, memo} from "react";
import classNames from "classnames";
import {FixedLayout} from "@telegram-apps/telegram-ui";
import "./header.css";

function Header({
                    className,
                    layoutClassName,
                    subHeaderClassName,
                    LeftComponent,
                    CentralComponent,
                    RightComponent,
                    AfterComponent
                }: {
    className?: string,
    layoutClassName?: string,
    subHeaderClassName?: string,
    LeftComponent?: FC,
    CentralComponent?: FC,
    RightComponent?: FC,
    AfterComponent?: FC,
}) {
    return (
        <header className={classNames("h-20", className)}>
            <FixedLayout vertical="top" className={classNames("header_layout p-4 z-10", layoutClassName)}>
                <div className={classNames("flex shrink items-center justify-between mb-3", subHeaderClassName)}>
                    {LeftComponent && <LeftComponent/>}

                    {CentralComponent && <CentralComponent/>}

                    {RightComponent && <RightComponent/>}
                </div>

                {AfterComponent && <AfterComponent/>}
            </FixedLayout>
        </header>
    );
}

export default memo(Header);