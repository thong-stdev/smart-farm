// Types - Activity

export type ActivityType = 'INCOME' | 'EXPENSE' | 'PLANTING' | 'GENERAL';

export interface Activity {
    id: string;
    type: ActivityType;
    amount?: number;
    description?: string;
    date: string;
    userId: string;
    categoryId?: string;
    plotId?: string;
    cropCycleId?: string;
    productId?: string;
    quantity?: number;
    unit?: string;
    unitPrice?: number;
    createdAt: string;
    deletedAt?: string;

    // Relations
    plot?: {
        id: string;
        name: string;
    };
    cropCycle?: {
        id: string;
        cropType?: string;
    };
    category?: {
        id: string;
        name: string;
    };
    product?: {
        id: string;
        name: string;
    };
    images?: ActivityImage[];
}

export interface ActivityImage {
    id: string;
    activityId: string;
    imageUrl: string;
    createdAt: string;
}

export interface CreateActivityDto {
    type: ActivityType;
    amount?: number;
    description?: string;
    date?: string | Date;
    plotId?: string;
    cropCycleId?: string;
    categoryId?: string;
    customCategoryName?: string;
    cropVarietyId?: string;
    productId?: string;
    customProductName?: string;
    quantity?: number;
    unit?: string;
    unitPrice?: number;
    images?: string[];
}

export interface ActivitySummary {
    income: {
        total: number;
        count: number;
    };
    expense: {
        total: number;
        count: number;
    };
    planting: {
        count: number;
    };
    profit: number;
}

export interface UpdateActivityDto {
    type?: ActivityType;
    amount?: number;
    description?: string;
    date?: string | Date;
    plotId?: string;
    cropCycleId?: string;
    categoryId?: string;
    customCategoryName?: string;
    cropVarietyId?: string;
    productId?: string;
    customProductName?: string;
    quantity?: number;
    unit?: string;
    unitPrice?: number;
    images?: string[];
}

export interface ActivityFilterDto {
    type?: ActivityType;
    plotId?: string;
    cropCycleId?: string;
    startDate?: Date;
    endDate?: Date;
    page?: number;
    limit?: number;
}
