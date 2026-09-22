import axios from "axios";
import {SERVER_URL} from "./APIConstants";

export const apiClient = axios.create({
    baseURL: SERVER_URL,
    timeout: 20000,
    headers: {"Content-Type": "application/json"},
});
