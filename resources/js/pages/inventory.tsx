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
    itemName: string;
    sku: string;
    category: string;
    quantity: number;
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
        itemName: 'Dell XPS 13',
        sku: 'LTP-1001',
        category: 'Laptop',
        quantity: 24,
        location: 'Shelf A1',
        status: 'In Stock',
    },
    {
        id: 2,
        itemName: 'MacBook Pro 14',
        sku: 'LTP-1002',
        category: 'Laptop',
        quantity: 9,
        location: 'Shelf A1',
        status: 'Low Stock',
    },
    {
        id: 3,
        itemName: 'Logitech MX Keys',
        sku: 'KEY-2001',
        category: 'Peripherals',
        quantity: 40,
        location: 'Shelf B3',
        status: 'In Stock',
    },
    {
        id: 4,
        itemName: 'Logitech MX Master 3',
        sku: 'MSE-2004',
        category: 'Peripherals',
        quantity: 34,
        location: 'Shelf B3',
        status: 'In Stock',
    },
    {
        id: 5,
        itemName: '27in Monitor',
        sku: 'MON-3011',
        category: 'Display',
        quantity: 6,
        location: 'Shelf C2',
        status: 'Low Stock',
    },
    {
        id: 6,
        itemName: 'USB-C Docking Hub',
        sku: 'DOC-4110',
        category: 'Accessories',
        quantity: 18,
        location: 'Shelf D1',
        status: 'In Stock',
    },
    {
        id: 7,
        itemName: 'HDMI Cable 2m',
        sku: 'CBL-5200',
        category: 'Accessories',
        quantity: 51,
        location: 'Shelf D2',
        status: 'In Stock',
    },
    {
        id: 8,
        itemName: 'Wireless Headset',
        sku: 'AUD-6100',
        category: 'Audio',
        quantity: 0,
        location: 'Shelf E1',
        status: 'Out of Stock',
    },
    {
        id: 9,
        itemName: 'Webcam 1080p',
        sku: 'CAM-7004',
        category: 'Video',
        quantity: 13,
        location: 'Shelf E2',
        status: 'In Stock',
    },
    {
        id: 10,
        itemName: 'Network Switch 24-port',
        sku: 'NET-8100',
        category: 'Networking',
        quantity: 3,
        location: 'Rack R1',
        status: 'Low Stock',
    },
    {
        id: 11,
        itemName: 'Patch Panel',
        sku: 'NET-8125',
        category: 'Networking',
        quantity: 16,
        location: 'Rack R2',
        status: 'In Stock',
    },
    {
        id: 12,
        itemName: 'Surge Protector',
        sku: 'PWR-9001',
        category: 'Power',
        quantity: 28,
        location: 'Shelf F1',
        status: 'In Stock',
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
            [item.itemName, item.sku, item.category, item.location, item.status]
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
            <Head title="Inventory" />

            <Card className="border-border/70 bg-card/90">
                <CardHeader className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <CardTitle className="text-2xl tracking-tight">
                            Inventory
                        </CardTitle>
                        <p className="mt-1 text-sm text-muted-foreground">
                            Track stock levels, search items, and manage records
                            quickly.
                        </p>
                    </div>
                    <Button className="w-full gap-2 sm:w-auto">
                        <Plus className="size-4" />
                        Add Item
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
                            placeholder="Search by item, SKU, category, location..."
                            className="pl-9"
                        />
                    </div>

                    <div className="hidden overflow-x-auto rounded-lg border border-border/70 md:block">
                        <table className="min-w-full text-sm">
                            <thead className="bg-muted/40 text-left">
                                <tr>
                                    <th className="px-4 py-3 font-medium">
                                        Item
                                    </th>
                                    <th className="px-4 py-3 font-medium">
                                        SKU
                                    </th>
                                    <th className="px-4 py-3 font-medium">
                                        Category
                                    </th>
                                    <th className="px-4 py-3 font-medium">
                                        Qty
                                    </th>
                                    <th className="px-4 py-3 font-medium">
                                        Location
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
                                            colSpan={7}
                                            className="px-4 py-8 text-center text-muted-foreground"
                                        >
                                            No inventory item matched your
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
                                                {item.itemName}
                                            </td>
                                            <td className="px-4 py-3 text-muted-foreground">
                                                {item.sku}
                                            </td>
                                            <td className="px-4 py-3 text-muted-foreground">
                                                {item.category}
                                            </td>
                                            <td className="px-4 py-3">
                                                {item.quantity}
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
                                                        aria-label={`Edit ${item.itemName}`}
                                                    >
                                                        <Pencil className="size-4" />
                                                    </Button>
                                                    <Button
                                                        type="button"
                                                        variant="ghost"
                                                        size="icon"
                                                        className="size-8 text-destructive hover:text-destructive"
                                                        aria-label={`Delete ${item.itemName}`}
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
                                No inventory item matched your search.
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
                                                {item.itemName}
                                            </p>
                                            <p className="text-xs text-muted-foreground">
                                                {item.sku}
                                            </p>
                                        </div>
                                        {getStatusBadge(item.status)}
                                    </div>
                                    <div className="mt-3 grid grid-cols-2 gap-2 text-xs text-muted-foreground">
                                        <p>Category: {item.category}</p>
                                        <p>Qty: {item.quantity}</p>
                                        <p>Location: {item.location}</p>
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
                            {filteredItems.length} items
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
