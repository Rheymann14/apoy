import { Head } from '@inertiajs/react';
import {
    ChevronLeft,
    ChevronRight,
    Package,
    Pencil,
    Plus,
    Search,
    Trash2,
} from 'lucide-react';
import { useMemo, useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import AppLayout from '@/layouts/app-layout';
import { dashboard, inventory } from '@/routes';
import type { BreadcrumbItem } from '@/types';

type InventoryStatus = 'In Stock' | 'Low Stock' | 'Out of Stock';

type InventoryItem = {
    id: number;
    ingredientName: string;
    code: string;
    category: string;
    quantity: number;
    unit: string;
    location: string;
    status: InventoryStatus;
};

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Dashboard',
        href: dashboard(),
    },
    {
        title: 'Inventory',
        href: inventory(),
    },
];

const inventoryItems: InventoryItem[] = [
    {
        id: 1,
        ingredientName: 'Tomato (Roma)',
        code: 'PRD-1001',
        category: 'Produce',
        quantity: 18,
        unit: 'kg',
        location: 'Walk-in Cooler',
        status: 'In Stock',
    },
    {
        id: 2,
        ingredientName: 'Yellow Onion',
        code: 'PRD-1002',
        category: 'Produce',
        quantity: 6,
        unit: 'kg',
        location: 'Walk-in Cooler',
        status: 'Low Stock',
    },
    {
        id: 3,
        ingredientName: 'Garlic',
        code: 'PRD-1003',
        category: 'Produce',
        quantity: 4,
        unit: 'kg',
        location: 'Prep Station Bin',
        status: 'Low Stock',
    },
    {
        id: 4,
        ingredientName: 'Chicken Breast',
        code: 'MET-2001',
        category: 'Meat',
        quantity: 25,
        unit: 'kg',
        location: 'Freezer A',
        status: 'In Stock',
    },
    {
        id: 5,
        ingredientName: 'Ground Beef',
        code: 'MET-2002',
        category: 'Meat',
        quantity: 5,
        unit: 'kg',
        location: 'Freezer B',
        status: 'Low Stock',
    },
    {
        id: 6,
        ingredientName: 'Salmon Fillet',
        code: 'SEA-3001',
        category: 'Seafood',
        quantity: 0,
        unit: 'kg',
        location: 'Freezer A',
        status: 'Out of Stock',
    },
    {
        id: 7,
        ingredientName: 'Mozzarella Cheese',
        code: 'DAY-4001',
        category: 'Dairy',
        quantity: 12,
        unit: 'kg',
        location: 'Walk-in Cooler',
        status: 'In Stock',
    },
    {
        id: 8,
        ingredientName: 'Heavy Cream',
        code: 'DAY-4002',
        category: 'Dairy',
        quantity: 3,
        unit: 'L',
        location: 'Walk-in Cooler',
        status: 'Low Stock',
    },
    {
        id: 9,
        ingredientName: 'Olive Oil (EVOO)',
        code: 'DRY-5001',
        category: 'Dry Goods',
        quantity: 20,
        unit: 'L',
        location: 'Dry Storage',
        status: 'In Stock',
    },
    {
        id: 10,
        ingredientName: 'Basmati Rice',
        code: 'DRY-5002',
        category: 'Dry Goods',
        quantity: 35,
        unit: 'kg',
        location: 'Dry Storage',
        status: 'In Stock',
    },
    {
        id: 11,
        ingredientName: 'Ground Black Pepper',
        code: 'SPC-6001',
        category: 'Spices',
        quantity: 2,
        unit: 'kg',
        location: 'Spice Rack',
        status: 'In Stock',
    },
    {
        id: 12,
        ingredientName: 'Soy Sauce',
        code: 'CNS-7001',
        category: 'Condiments',
        quantity: 2,
        unit: 'L',
        location: 'Sauce Station',
        status: 'Low Stock',
    },
];

const ITEMS_PER_PAGE = 5;

const getStatusBadge = (status: InventoryStatus) => {
    if (status === 'Out of Stock') {
        return (
            <Badge variant="destructive" className="rounded-full">
                {status}
            </Badge>
        );
    }

    if (status === 'Low Stock') {
        return (
            <Badge variant="secondary" className="rounded-full">
                {status}
            </Badge>
        );
    }

    return (
        <Badge variant="default" className="rounded-full">
            {status}
        </Badge>
    );
};

export default function Inventory() {
    const [search, setSearch] = useState('');
    const [currentPage, setCurrentPage] = useState(1);

    const filteredItems = useMemo(() => {
        const normalizedQuery = search.trim().toLowerCase();

        if (!normalizedQuery) {
            return inventoryItems;
        }

        return inventoryItems.filter((item) =>
            [
                item.ingredientName,
                item.code,
                item.category,
                item.unit,
                item.location,
                item.status,
            ]
                .join(' ')
                .toLowerCase()
                .includes(normalizedQuery),
        );
    }, [search]);

    const totalPages = Math.max(
        1,
        Math.ceil(filteredItems.length / ITEMS_PER_PAGE),
    );

    const paginatedItems = useMemo(() => {
        const start = (currentPage - 1) * ITEMS_PER_PAGE;
        return filteredItems.slice(start, start + ITEMS_PER_PAGE);
    }, [currentPage, filteredItems]);

    const startItem =
        filteredItems.length === 0 ? 0 : (currentPage - 1) * ITEMS_PER_PAGE + 1;
    const endItem = Math.min(
        currentPage * ITEMS_PER_PAGE,
        filteredItems.length,
    );

    const handleSearchChange = (value: string) => {
        setSearch(value);
        setCurrentPage(1);
    };

    const goToPreviousPage = () => {
        setCurrentPage((page) => Math.max(1, page - 1));
    };

    const goToNextPage = () => {
        setCurrentPage((page) => Math.min(totalPages, page + 1));
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Ingredient Inventory" />

            <Card className="border-border/70 bg-card/90">
                <CardHeader className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <CardTitle className="text-2xl tracking-tight">
                            Ingredient Inventory
                        </CardTitle>
                        <p className="mt-1 text-sm text-muted-foreground">
                            Track ingredient stock levels, search pantry items,
                            and manage kitchen records quickly.
                        </p>
                    </div>
                    <Button className="w-full gap-2 sm:w-auto">
                        <Plus className="size-4" />
                        Add 
                    </Button>
                </CardHeader>

                <CardContent className="space-y-4">
                    <div className="relative max-w-md">
                        <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
                        <Input
                            value={search}
                            onChange={(event) =>
                                handleSearchChange(event.target.value)
                            }
                            placeholder="Search by ingredient, code, category, storage..."
                            className="pl-9"
                        />
                    </div>

                    <div className="hidden overflow-x-auto rounded-lg border border-border/70 md:block">
                        <table className="min-w-full text-sm">
                            <thead className="bg-muted/40 text-left">
                                <tr>
                                    <th className="px-4 py-3 font-medium">
                                        Ingredient
                                    </th>
                                    <th className="px-4 py-3 font-medium">
                                        Code
                                    </th>
                                    <th className="px-4 py-3 font-medium">
                                        Category
                                    </th>
                                    <th className="px-4 py-3 font-medium">
                                        Qty
                                    </th>
                                    <th className="px-4 py-3 font-medium">
                                        Unit
                                    </th>
                                    <th className="px-4 py-3 font-medium">
                                        Storage
                                    </th>
                                    <th className="px-4 py-3 font-medium">
                                        Status
                                    </th>
                                    <th className="px-4 py-3 text-right font-medium">
                                        Action
                                    </th>
                                </tr>
                            </thead>
                            <tbody>
                                {paginatedItems.length === 0 ? (
                                    <tr>
                                        <td
                                            colSpan={8}
                                            className="px-4 py-8 text-center text-muted-foreground"
                                        >
                                            No ingredient matched your
                                            search.
                                        </td>
                                    </tr>
                                ) : (
                                    paginatedItems.map((item) => (
                                        <tr
                                            key={item.id}
                                            className="border-t border-border/70"
                                        >
                                            <td className="px-4 py-3 font-medium">
                                                {item.ingredientName}
                                            </td>
                                            <td className="px-4 py-3 text-muted-foreground">
                                                {item.code}
                                            </td>
                                            <td className="px-4 py-3 text-muted-foreground">
                                                {item.category}
                                            </td>
                                            <td className="px-4 py-3">
                                                {item.quantity}
                                            </td>
                                            <td className="px-4 py-3 text-muted-foreground">
                                                {item.unit}
                                            </td>
                                            <td className="px-4 py-3 text-muted-foreground">
                                                {item.location}
                                            </td>
                                            <td className="px-4 py-3">
                                                {getStatusBadge(item.status)}
                                            </td>
                                            <td className="px-4 py-3">
                                                <div className="flex items-center justify-end gap-2">
                                                    <Button
                                                        type="button"
                                                        variant="ghost"
                                                        size="icon"
                                                        className="size-8"
                                                        aria-label={`Edit ${item.ingredientName}`}
                                                    >
                                                        <Pencil className="size-4" />
                                                    </Button>
                                                    <Button
                                                        type="button"
                                                        variant="ghost"
                                                        size="icon"
                                                        className="size-8 text-destructive hover:text-destructive"
                                                        aria-label={`Delete ${item.ingredientName}`}
                                                    >
                                                        <Trash2 className="size-4" />
                                                    </Button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>

                    <div className="space-y-3 md:hidden">
                        {paginatedItems.length === 0 ? (
                            <div className="rounded-lg border border-border/70 p-5 text-center text-sm text-muted-foreground">
                                No ingredient matched your search.
                            </div>
                        ) : (
                            paginatedItems.map((item) => (
                                <div
                                    key={item.id}
                                    className="rounded-lg border border-border/70 bg-background/70 p-4"
                                >
                                    <div className="flex items-start justify-between gap-3">
                                        <div>
                                            <p className="font-medium">
                                                {item.ingredientName}
                                            </p>
                                            <p className="text-xs text-muted-foreground">
                                                {item.code}
                                            </p>
                                        </div>
                                        {getStatusBadge(item.status)}
                                    </div>
                                    <div className="mt-3 grid grid-cols-2 gap-2 text-xs text-muted-foreground">
                                        <p>Category: {item.category}</p>
                                        <p>Qty: {item.quantity}</p>
                                        <p>Unit: {item.unit}</p>
                                        <p>Storage: {item.location}</p>
                                    </div>
                                    <div className="mt-4 flex justify-end gap-2">
                                        <Button
                                            type="button"
                                            variant="outline"
                                            size="sm"
                                            className="gap-1"
                                        >
                                            <Pencil className="size-3.5" />
                                            Edit
                                        </Button>
                                        <Button
                                            type="button"
                                            variant="outline"
                                            size="sm"
                                            className="gap-1 text-destructive hover:text-destructive"
                                        >
                                            <Trash2 className="size-3.5" />
                                            Delete
                                        </Button>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>

                    <div className="flex flex-col gap-3 border-t border-border/70 pt-4 sm:flex-row sm:items-center sm:justify-between">
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <Package className="size-4" />
                            Showing {startItem}-{endItem} of{' '}
                            {filteredItems.length} ingredients
                        </div>

                        <div className="flex items-center gap-2 self-end sm:self-auto">
                            <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={goToPreviousPage}
                                disabled={currentPage <= 1}
                            >
                                <ChevronLeft className="size-4" />
                                Prev
                            </Button>
                            <span className="text-sm text-muted-foreground">
                                Page {currentPage} of {totalPages}
                            </span>
                            <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={goToNextPage}
                                disabled={currentPage >= totalPages}
                            >
                                Next
                                <ChevronRight className="size-4" />
                            </Button>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </AppLayout>
    );
}
