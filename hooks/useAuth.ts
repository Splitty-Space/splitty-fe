import {useEffect, useState} from "react";
import {retrieveRawInitData} from "@telegram-apps/sdk";
import axios from "axios";
import {SERVER_URL} from "@/API/APIConstants";

const useAuth = () => {
    const [token, setToken] = useState(null);

    useEffect(() => {
        const initDataRaw = retrieveRawInitData();

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
