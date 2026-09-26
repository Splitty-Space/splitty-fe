"use client";

import type {ReactNode} from "react";
import {useTranslation} from "react-i18next";
import {LocalizationProvider} from "@mui/x-date-pickers/LocalizationProvider";
import {AdapterDayjs} from "@mui/x-date-pickers/AdapterDayjs";
import {createTheme, ThemeProvider} from "@mui/material/styles";
import "dayjs/locale/ru";
import "dayjs/locale/uk";

const darkTheme = createTheme({palette: {mode: "dark"}});

export default function DatePickerProviders({children}: {children: ReactNode}) {
    const {i18n} = useTranslation();
    const language = i18n.language === "ua" ? "uk" : i18n.language;

    return (
        <LocalizationProvider dateAdapter={AdapterDayjs} adapterLocale={language}>
            <ThemeProvider theme={darkTheme}>{children}</ThemeProvider>
        </LocalizationProvider>
    );
}
