import {useEffect, useState} from "react";
import {retrieveRawInitData, parseInitDataQuery} from "@telegram-apps/sdk";
import axios from "axios";
import {SERVER_URL} from "@/API/APIConstants";

const useAuth = () => {
    const [token, setToken] = useState(null);

    useEffect(() => {
        const initDataRaw = retrieveRawInitData();
        const parsedData = parseInitDataQuery(initDataRaw as string);

        console.log("parsedData", parsedData);

        axios.post(
            `${SERVER_URL}/auth`,
            {auth: parsedData},
        )
            .then(res => {
                console.log("res = ", res);
                // setToken(res.data.access_token);
            })
            .catch(err => console.error("Auth error:", err));
    }, []);

    return token;
};

export default useAuth;