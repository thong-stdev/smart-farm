// Types - Plot

export type PlotStatus = 'NORMAL' | 'INACTIVE' | 'ARCHIVED';

export interface Plot {
    id: string;
    name: string;
    size: number;
    status: PlotStatus;
    image?: string;
    lat?: number;
    lng?: number;
    userId: string;
    createdAt: string;
    updatedAt: string;
    deletedAt?: string;

    // Relations
    _count?: {
        cropCycles: number;
        activities: number;
    };
    cropCycles?: CropCycle[];
    members?: FarmMember[];
}

export interface CreatePlotDto {
    name: string;
    size: number;
    lat?: number;
    lng?: number;
    image?: string;
}

export interface UpdatePlotDto {
    name?: string;
    size?: number;
    status?: PlotStatus;
    lat?: number;
    lng?: number;
    image?: string;
}

// Crop Cycle
export type CropCycleStatus = 'ACTIVE' | 'COMPLETED';

export interface CropCycle {
    id: string;
    plotId: string;
    cropType?: string;
    cropVarietyId?: string;
    startDate: string;
    endDate?: string;
    status: CropCycleStatus;
    yield?: number;
    note?: string;
    planId?: string;
    createdAt: string;
    updatedAt: string;
    deletedAt?: string;

    // Relations
    plot?: Plot;
    cropVariety?: {
        id: string;
        name: string;
        duration?: number;
    };
    plan?: {
        id: string;
        name: string;
    };
    _count?: {
        activities: number;
    };
}

export interface CreateCropCycleDto {
    plotId: string;
    cropType?: string;
    cropVarietyId?: string;
    startDate?: string;
    note?: string;
    planId?: string;
}

// Farm Member
export type FarmRole = 'OWNER' | 'EDITOR' | 'VIEWER';

export interface FarmMember {
    id: string;
    plotId: string;
    userId: string;
    role: FarmRole;
    createdAt: string;
    user?: {
        id: string;
        displayName?: string;
        pictureUrl?: string;
    };
}
