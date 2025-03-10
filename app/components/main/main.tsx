"use client"

import React, {forwardRef, memo} from "react";
import classNames from "classnames";
import {viewport} from "@telegram-apps/sdk";

interface MainProps {
    style?: object,
    className?: string,
    center?: boolean,
    children: React.ReactNode,
}

const Main = forwardRef<HTMLDivElement, MainProps>(({
                                                        style,
                                                        className,
                                                        center,
                                                        children
                                                    }, ref) => {
    return (
        <main
            ref={ref}
            style={style ? style : {height: "calc(100% - 4rem)"}}
            className={classNames("mt-16 pb-20 overflow-auto", {
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