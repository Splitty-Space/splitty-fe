"use client"

import React, {FC, memo, ReactElement} from "react";
import classNames from "classnames";
import {FixedLayout} from "@telegram-apps/telegram-ui";
import "./header.css";

function Header({
                    className,
                    subHeaderClassName,
                    LeftComponent,
                    CentralComponent,
                    RightComponent,
                    AfterComponent
                }: {
    className?: string,
    subHeaderClassName?: string,
    LeftComponent?: FC,
    CentralComponent?: FC,
    RightComponent?: FC,
    AfterComponent?: ReactElement,
}) {
    return (
        <header className={classNames("h-20", className)}>
            <FixedLayout vertical="top" className="header_layout p-4 z-10">
                <div className={classNames("flex shrink items-center justify-between mb-3", subHeaderClassName)}>
                    {LeftComponent && <LeftComponent/>}

                    {CentralComponent && <CentralComponent/>}

                    {RightComponent && <RightComponent/>}
                </div>

                {AfterComponent && <>{AfterComponent}</>}
            </FixedLayout>
        </header>
    );
}

export default memo(Header);