export interface UpdateUserDto {
    displayName?: string;
    firstName?: string;
    lastName?: string;
    address?: string;
    pictureUrl?: string;
}

export interface UpdateSettingsDto {
    language?: string;
    timezone?: string;
    unit?: string;
}

export interface User {
    id: string;
    email: string;
    displayName?: string;
    pictureUrl?: string;
    createdAt: string;
}
