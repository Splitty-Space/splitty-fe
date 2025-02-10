"use client"

import React, {FC, forwardRef, memo, ReactElement} from "react";
import classNames from "classnames";
import {FixedLayout} from "@telegram-apps/telegram-ui";
import "./header.css";

interface HeaderProps {
    className?: string,
    layoutClassName?: string,
    subHeaderClassName?: string,
    LeftComponent?: FC,
    CentralComponent?: FC,
    RightComponent?: FC,
    AfterComponent?: ReactElement,
}

const Header = forwardRef<HTMLDivElement, HeaderProps>(({
                                                            className,
                                                            layoutClassName,
                                                            subHeaderClassName,
                                                            LeftComponent,
                                                            CentralComponent,
                                                            RightComponent,
                                                            AfterComponent
                                                        }, ref) => {
    return (
        <header ref={ref} className={classNames("h-16 fixed top-0 left-0 w-full", className)}>
            <FixedLayout vertical="top" className={classNames("header_layout p-4 z-10 pt-3", layoutClassName)}>
                <div className={classNames("flex shrink items-center justify-between mb-3", subHeaderClassName)}>
                    {LeftComponent && <LeftComponent/>}

                    {CentralComponent && <CentralComponent/>}

                    {RightComponent && <RightComponent/>}
                </div>

                {AfterComponent && <>{AfterComponent}</>}
            </FixedLayout>
        </header>
    );
});

Header.displayName = "Header";

export default memo(Header);