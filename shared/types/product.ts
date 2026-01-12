export interface CreateProductDto {
    name: string;
    categoryId?: string;
    typeId?: string;
    brandId?: string;
    price?: number;
    description?: string;
    imageUrl?: string;
}

export interface UpdateProductDto {
    name?: string;
    categoryId?: string;
    typeId?: string;
    brandId?: string;
    price?: number;
    description?: string;
    imageUrl?: string;
}

export interface Product {
    id: string;
    name: string;
    price?: number;
    imageUrl?: string;
    category?: { id: string; name: string };
    type?: { id: string; name: string };
    brand?: { id: string; name: string };
}
