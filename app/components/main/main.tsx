"use client"

import React, {forwardRef, memo} from "react";
import classNames from "classnames";
import {viewport} from "@telegram-apps/sdk";

interface MainProps {
    id?: string,
    style?: object,
    className?: string,
    center?: boolean,
    children: React.ReactNode,
}

const Main = forwardRef<HTMLDivElement, MainProps>(({
                                                        id,
                                                        style,
                                                        className,
                                                        center,
                                                        children
                                                    }, ref) => {
    return (
        <main
            id={id}
            ref={ref}
            style={style ? style : {height: "100%"}}
            className={classNames("pt-20 pb-20 overflow-auto", {
                "flex items-center justify-center": center,
                "pt-24": viewport.isFullscreen(),
            }, className)}
        >
            {children}
        </main>
    );
});

Main.displayName = "Main";

export default memo(Main);