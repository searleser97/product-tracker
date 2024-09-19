export type SiteHandlerResult = {
    isAvailable: boolean;
    data?: any;
    autoBuyPromise?: Promise<AutoBuyResult>;
};

export type AutoBuyResult = {
    result: "succeeded" | "failed"
};