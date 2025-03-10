import {isTMA} from "@telegram-apps/bridge";
import {initData} from "@telegram-apps/sdk";

export default function getCurrentUserId() {
    // @ts-ignore
    if (global?.window && window && isTMA("simple")) {
        initData.restore();
        const user = initData.user();

        return user?.id;
    }

    return null;
}