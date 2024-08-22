export default interface PaginationResponse<T> {
    page: number;
    per_page: string;
    data: T[];
    total: number;
    count: number;
}
