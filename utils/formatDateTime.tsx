import {EN} from "@/const/languages";

export function formatDateTime(date: Date, language: string) {
    return new Intl.DateTimeFormat("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
        hour: "numeric",
        minute: "numeric",
        hour12: language.toUpperCase() === EN,
    }).format(new Date(date))
}