import {MASTER_USER_ID} from "@/API/APIConstants";
// import {initData} from "@telegram-apps/sdk";
import {isTMA} from "@telegram-apps/bridge";
import { retrieveLaunchParams } from "@telegram-apps/sdk";

const { initDataRaw, initData } = retrieveLaunchParams();

console.log("initDataRaw = ", initDataRaw);
console.log("initData = ", initData);

// @ts-ignore
// if (isTMA("simple")) {
//     initData.restore();
// }

export default function getCurrentUserId() {
    // @ts-ignore
    const user = initData?.user;
    console.log("user = ", user);

    return user?.id || MASTER_USER_ID;
}