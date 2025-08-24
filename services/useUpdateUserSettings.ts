import useAxios from "axios-hooks";
import getCurrentUserId from "@/utils/getCurrentUserId";
import {useStore} from "@/app/store";

const useUpdateUserSettings = () => {
    const token = useStore.getState().token;

    const [{data, loading, error}, refetch] = useAxios({
        url: "/settings",
        method: "PUT",
        headers: {
            Authorization: `Bearer ${token}`,
        },
    }, {manual: true});

    const updateUserSettings = ({defaultCurrency, language, isGuideShown}: {
        defaultCurrency?: string,
        language?: string,
        isGuideShown?: boolean
    }) =>
        refetch({
            data: {
                user_id: getCurrentUserId(),
                default_currency: defaultCurrency,
                language: language?.toLowerCase(),
                isGuideShown: isGuideShown,
            }
        });

    return {updateUserSettings, data, loading, error};
}

export default useUpdateUserSettings;