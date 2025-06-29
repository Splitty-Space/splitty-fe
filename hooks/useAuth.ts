import {useEffect, useState} from "react";
import { useLaunchParams } from "@telegram-apps/sdk-react";
import axios from "axios";
import {SERVER_URL} from "@/API/APIConstants";

const useAuth = () => {
    const [token, setToken] = useState(null);
    const { initDataRaw } = useLaunchParams() || {};

    useEffect(() => {
        axios.post(
            `${SERVER_URL}/auth`,
            {init_data_raw: initDataRaw},
        )
            .then(res => {
                console.log("res = ", res);
                if (res.data.access_token) {
                    setToken(res.data.access_token);
                }
            })
            .catch(err => console.error("Auth error:", err));
    }, []);

    return token;
};

export default useAuth;
