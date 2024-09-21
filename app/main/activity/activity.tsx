import useExpenses from "@/services/useExpenses";

export default function Activity() {
    const {data, loading, error, refetch} = useExpenses({
        page: 1,
        limit: 10,
        friend_id: 1
    });

    console.log("data = ", data);

    return <></>
}