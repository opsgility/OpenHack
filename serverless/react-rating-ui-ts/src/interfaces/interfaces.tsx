export interface IDropdownOption {
    value: string;
    label: string;
}

export interface IRating {
    userId: string;
    productId: string;
    locationName: string;
    rating: number;
    userNotes: string;
}
