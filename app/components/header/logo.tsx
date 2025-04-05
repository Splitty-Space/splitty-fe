import {useContext} from "react";
import {DARK} from "@/const/theme";
import {AppRootContext} from "@/app/AppRootContext";
import {Logo as Logo_} from "@/Icons/logo/logo";

export default function Logo({...restProps}) {
    const appRootContext = useContext(AppRootContext);

    return (
        <Logo_ alt="Logo" fill={appRootContext.appearance === DARK ? "white" : "black"} {...restProps} />
    );
}