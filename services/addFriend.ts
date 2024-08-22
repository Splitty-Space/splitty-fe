import axios from "axios"
import {SERVER_URL} from "@/API/APIConstants";
import getCurrentUserId from "@/utils/getCurrentUserId";

export const addFriend = async (userId?: number) => {
    await axios.post(`${SERVER_URL}/addFriend`, {
        user_id: getCurrentUserId(),
        friend_id: userId,
    }).catch((error) => {
        console.error({error})
    })
}
