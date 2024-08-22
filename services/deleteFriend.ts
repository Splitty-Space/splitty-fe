import axios from "axios"
import {SERVER_URL} from "@/API/APIConstants";
import getCurrentUserId from "@/utils/getCurrentUserId";

export const deleteFriend = async (friend_id?: number) => {
    await axios.post(`${SERVER_URL}/deleteFriend`, {
        user_id: getCurrentUserId(),
        friend_id,
    }).catch((error) => {
        console.error({error})
    })
}
