import {createContext} from "react";
import {DEFAULT_PLATFORM} from "@/const/platform";
import {DEFAULT_THEME} from "@/const/theme";

export const AppRootContext = createContext({
    platform: DEFAULT_PLATFORM,
    appearance: DEFAULT_THEME
});