import {isTMA} from "@telegram-apps/bridge";
import {initData} from "@telegram-apps/sdk";

export default function getCurrentUserId() {
    if (typeof window !== "undefined" && isTMA()) {
        initData.restore();
        const user = initData.user();

        return user?.id;
    }

    return null;
}
