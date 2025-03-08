import {MASTER_USER_ID} from "@/API/APIConstants";
import {isTMA} from "@telegram-apps/bridge";
import {initData} from "@telegram-apps/sdk";

export default function getCurrentUserId() {
    // @ts-ignore
    if (global?.window && window && isTMA("simple")) {
        initData.restore();
        const user = initData.user();

        return user?.id;
    }

    return MASTER_USER_ID; // TODO Dev env
}