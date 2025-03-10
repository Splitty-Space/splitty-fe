import {useContext} from "react";
import {DARK} from "@/const/theme";
import {AppRootContext} from "@/app/AppRootContext";
import LogoBlackMode from "@/public/logo_black_mode.png";
import LogoWhiteMode from "@/public/logo_white_mode.png";

export default function Logo() {
    const appRootContext = useContext(AppRootContext);

    return (
        <img
            alt="Logo"
            className="h-16 m--12"
            src={appRootContext.appearance === DARK ? LogoBlackMode.src : LogoWhiteMode.src}
        />
    );
}