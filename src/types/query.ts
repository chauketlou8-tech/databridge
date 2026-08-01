export type Query = {
    operation: string;
    type?: string;
    data?: Record<string, unknown>;
};