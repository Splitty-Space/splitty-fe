import Axios from "axios";
import {configure} from "axios-hooks";
import {LRUCache} from "lru-cache"
import {SERVER_URL} from "./APIConstants";

const axios = Axios.create({
    baseURL: SERVER_URL
});

const cache = new LRUCache({max: 10});

// @ts-ignore
configure({axios, cache});