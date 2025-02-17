import {MASTER_USER_ID} from "@/API/APIConstants";
import {initData} from "@telegram-apps/sdk";
import {isTMA} from "@telegram-apps/bridge";

// @ts-ignore
if (isTMA("simple")) {
    initData.restore();
}

export default function getCurrentUserId() {
    const user = initData.user();
    console.log("user = ", user);

    return user?.id || MASTER_USER_ID;
}