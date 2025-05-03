import {useCallback, useState} from "react";

export default function useRefreshToken(): [string, () => void] {
    const [token, setToken] = useState(crypto.randomUUID());

    const refreshToken = useCallback(() => {
        setToken(crypto.randomUUID());
    }, []);

    return [token, refreshToken];
};