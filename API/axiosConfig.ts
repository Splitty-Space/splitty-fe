import Axios from "axios";
import {configure} from "axios-hooks";
import {LRUCache} from "lru-cache"
import {SERVER_URL} from "./APIConstants";

const axios = Axios.create({
    baseURL: SERVER_URL,
    timeout: 20000, // 20 seconds
    headers: {"Content-Type": "application/json"},
});

const cache = new LRUCache<string, any>({max: 100});

configure({axios, cache});