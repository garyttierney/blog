export interface PostMeta {
    title: string;
    categories: string[];
    timestamp: number;
    body: string;
    summary?: string;
    date?: Date;
    readingTime?: any;
}