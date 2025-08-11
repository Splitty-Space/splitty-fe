import {useEffect} from "react";
import axios from "axios";
import {retrieveRawInitData} from "@telegram-apps/sdk";
import {SERVER_URL} from "@/API/APIConstants";
import {useStore} from "@/app/store";

const useAuth = () => {
    let token = useStore((state) => state.token);
    const setToken = useStore((state) => state.setToken);

    useEffect(() => {
        const initDataRaw = retrieveRawInitData();

        axios.post(
            `${SERVER_URL}/auth`,
            {init_data_raw: initDataRaw},
        )
            .then(res => {
                console.log("auth = ", res);
                if (res.data.access_token) {
                    token = res.data.access_token;
                    setToken(token);
                }
            })
            .catch(err => console.error("Auth error:", err));
    }, []);

    return token;
};

export default useAuth;
