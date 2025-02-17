import {MASTER_USER_ID} from "@/API/APIConstants";
import {isTMA} from "@telegram-apps/bridge";
import {initData} from "@telegram-apps/sdk";

export default function getCurrentUserId() {
    console.log("global?.window ", global?.window);

    // @ts-ignore
    if (global?.window && window && isTMA("simple")) {
        console.log("initData = ", initData);

        const user = initData.user();
        console.log("user = ", user);

        return user?.id || MASTER_USER_ID;
    }

    return MASTER_USER_ID; // TODO Dev env
}