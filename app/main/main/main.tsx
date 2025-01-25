"use client"

import React, {forwardRef, memo} from "react";
import classNames from "classnames";


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
            style={style ? style : {height: "calc(100% - 8rem)"}}
            className={classNames("mt-20 overflow-scroll", {
                "flex items-center justify-center": center
            }, className)}
        >
            {children}
        </main>
    );
});

Main.displayName = "Main";

export default memo(Main);