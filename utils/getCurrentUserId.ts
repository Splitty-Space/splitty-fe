import {MASTER_USER_ID} from "@/API/APIConstants";
import {initData} from "@telegram-apps/sdk";

// initData.restore();
const user = initData.user();

console.log("user = ", user);

export default function getCurrentUserId() {
    return user?.id || MASTER_USER_ID;
}