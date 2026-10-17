import {SEARCH_PARAMS} from "@/const/searchParams";

export const withSearchParams = (url: string, params: Partial<Record<SEARCH_PARAMS, string | number>>) =>
    `${url}?${new URLSearchParams(Object.entries(params).map(([key, value]) => [key, String(value)]))}`;
