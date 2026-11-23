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
                if (!initDataRaw) {
                    console.error("Telegram authentication failed: no init data.");
                    showError(true);
                    return;
                }
                const {data} = await apiClient.post<{token: string}>("/auth", {
                    init_data_raw: initDataRaw,
                }, {signal: controller.signal});
                if (controller.signal.aborted) return;
                if (!data.token) {
                    showError(true);
                    return;
                }
                setToken(data.token);
            } catch (err) {
                // Leaving the page aborts the request; that is not a failure.
                if (controller.signal.aborted) return;
                // Outside Telegram the SDK throws here because there are no launch
                // parameters; see utils/mockTelegramEnv.ts.
                console.error("Telegram authentication failed:", err);
                showError(true);
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
