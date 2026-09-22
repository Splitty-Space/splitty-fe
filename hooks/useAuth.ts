import {useEffect} from "react";
import {init, retrieveRawInitData} from "@telegram-apps/sdk";
import {apiClient} from "@/API/client";
import {useStore} from "@/app/store";

const useAuth = () => {
    const token = useStore((state) => state.token);
    const setToken = useStore((state) => state.setToken);
    const showError = useStore((state) => state.setIsRequestErrorSnackbarShown);

    useEffect(() => {
        const controller = new AbortController();
        let cleanup: VoidFunction | undefined;
        const authenticate = async () => {
            try {
                cleanup = init();
                const initDataRaw = retrieveRawInitData();
                if (!initDataRaw) throw new Error("Missing Telegram initialization data");
                const {data} = await apiClient.post<{token: string}>("/auth", {
                    init_data_raw: initDataRaw,
                }, {signal: controller.signal});
                if (!data.token) throw new Error("Missing authentication token");
                if (!controller.signal.aborted) setToken(data.token);
            } catch {
                if (!controller.signal.aborted) showError(true);
            }
        };
        void authenticate();
        return () => {
            controller.abort();
            cleanup?.();
        };
    }, [setToken, showError]);
    return token;
};

export default useAuth;
