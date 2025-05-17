import {useEffect, useState} from "react";
import {retrieveRawInitData} from "@telegram-apps/sdk";
import axios from "axios";
import {SERVER_URL} from "@/API/APIConstants";

const useAuth = () => {
    const [token, setToken] = useState(null);

    useEffect(() => {
        // Получаем «сырые» данные и подпись от Telegram
        const initDataRaw = retrieveRawInitData();
        // Отправляем их на бэкенд для верификации
        axios.post(
            `${SERVER_URL}/login`,
            {},
            {headers: {Authorization: `Telegram ${initDataRaw}`}}
        )
            .then(res => {
                console.log("res = ", res);
                setToken(res.data.access_token);
            })
            .catch(err => console.error("Auth error:", err));
    }, []);

    return token;
};

export default useAuth;