import useAxios from "axios-hooks";
import getCurrentUserId from "@/utils/getCurrentUserId";

const useUpdateUserSettings = () => {
    const [{data, loading, error}, refetch] = useAxios({
        url: "/settings",
        method: "PUT",
    }, {manual: true});

    const updateUserSettings = ({defaultCurrency, language}: { defaultCurrency?: string, language?: string }) =>
        refetch({
            data: {
                user_id: getCurrentUserId(),
                default_currency: defaultCurrency,
                language: language?.toLowerCase(),
            }
        });

    return {updateUserSettings, data, loading, error};
}

export default useUpdateUserSettings;