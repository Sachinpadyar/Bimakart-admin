// @ts-nocheck
import {
    LayoutDashboard,
    FileText,
    List
} from "lucide-react";
import ProductListing from './ProductListing/ProductListing';
import Fileds from './Fileds/Fileds';

export interface MenuItemConfig {
    id: string;
    label: string;
    icon: React.ReactNode;
    path: string;
    component: React.ComponentType;
}

export const dashboardMenuItems: MenuItemConfig[] = [
    {
        id: "product-listing",
        label: "Product Listing",
        icon: <FileText size={20} />,
        path: "/dashboard/product-listing",
        component: ProductListing
    },
    {
        id: "form-fields",
        label: "Form Fields",
        icon: <List size={20} />,
        path: "/dashboard/fields",
        component: Fileds
    },
];
