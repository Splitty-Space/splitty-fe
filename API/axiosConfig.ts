import {configure} from "axios-hooks";
import {apiClient} from "./client";
import {AxiosHooksCache} from "./axiosHooksCache";

// A cache whose keys ignore the AbortSignal axios-hooks adds to every request; see AxiosHooksCache.
configure({axios: apiClient, cache: new AxiosHooksCache(), defaultOptions: {ssr: false}});
