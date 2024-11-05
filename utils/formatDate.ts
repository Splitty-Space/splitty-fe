import {EN} from "@/const/languages";

export function formatDate(date: Date, language: string) {
    return new Intl.DateTimeFormat("en-US", {
        year: "numeric",
        month: "numeric",
        day: "numeric",
        hour: "numeric",
        minute: "numeric",
        hour12: language.toUpperCase() === EN,
    }).format(new Date(date))
}