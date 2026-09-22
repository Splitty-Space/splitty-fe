import {configure} from "axios-hooks";
import {apiClient} from "./client";

// Use axios-hooks' own bounded cache to avoid incompatible LRU major versions.
configure({axios: apiClient, defaultOptions: {ssr: false}});
