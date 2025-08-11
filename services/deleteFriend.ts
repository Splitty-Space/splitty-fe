import axios from "axios"
import {SERVER_URL} from "@/API/APIConstants";
import getCurrentUserId from "@/utils/getCurrentUserId";
import {useStore} from "@/app/store";

export const deleteFriend = async (friend_id?: number) => {
    const token = useStore.getState().token;

    await axios.post(`${SERVER_URL}/deleteFriend`, {
            user_id: getCurrentUserId(),
            friend_id,
        },
        {
            headers: {
                Authorization: `Bearer ${token}`,
            },
        }).catch((error) => {
        console.error({error})
    })
}
