import {MASTER_USER_ID} from "@/API/APIConstants";
import {isTMA} from "@telegram-apps/bridge";
import {retrieveLaunchParams} from "@telegram-apps/sdk";

export default function getCurrentUserId() {
    // @ts-ignore

    console.log("global?.window ", global?.window);

    // @ts-ignore
    if (global?.window && window && isTMA("simple")) {
        const {initDataRaw, initData} = retrieveLaunchParams();
        console.log("initDataRaw = ", initDataRaw);
        console.log("initData = ", initData);

        // @ts-ignore
        const user = initData?.user;
        console.log("user = ", user);

        return user?.id || MASTER_USER_ID;
    }

    return MASTER_USER_ID; // TODO Dev env
}