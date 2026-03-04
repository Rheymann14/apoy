import { Head } from '@inertiajs/react';
import {
    Check,
    ChevronLeft,
    ChevronRight,
    ChevronsUpDown,
    Package,
    Pencil,
    Plus,
    Search,
    Trash2,
} from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';
import type { ChangeEvent, FormEvent } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import AppLayout from '@/layouts/app-layout';
import { cn } from '@/lib/utils';
import { dashboard, inventory } from '@/routes';
import type { BreadcrumbItem } from '@/types';

type InventoryStatus = 'In Stock' | 'Low Stock' | 'Out of Stock';

type InventoryItem = {
    id: number;
    name: string;
    code: string;
    category: string;
    quantity: number;
    unit: string;
    storage: string;
    status: InventoryStatus;
};

type IngredientForm = {
    name: string;
    category: string;
    quantity: string;
    unit: string;
    storage: string;
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

const initialInventoryItems: InventoryItem[] = [
    {
        id: 1,
        name: 'Tomato (Roma)',
        code: 'PRD-1001',
        category: 'Produce',
        quantity: 18,
        unit: 'kg',
        storage: 'Walk-in Cooler',
        status: 'In Stock',
    },
    {
        id: 2,
        name: 'Yellow Onion',
        code: 'PRD-1002',
        category: 'Produce',
        quantity: 6,
        unit: 'kg',
        storage: 'Walk-in Cooler',
        status: 'Low Stock',
    },
    {
        id: 3,
        name: 'Garlic',
        code: 'PRD-1003',
        category: 'Produce',
        quantity: 4,
        unit: 'kg',
        storage: 'Prep Station Bin',
        status: 'Low Stock',
    },
    {
        id: 4,
        name: 'Chicken Breast',
        code: 'MET-2001',
        category: 'Meat',
        quantity: 25,
        unit: 'kg',
        storage: 'Freezer A',
        status: 'In Stock',
    },
    {
        id: 5,
        name: 'Ground Beef',
        code: 'MET-2002',
        category: 'Meat',
        quantity: 5,
        unit: 'kg',
        storage: 'Freezer B',
        status: 'Low Stock',
    },
    {
        id: 6,
        name: 'Salmon Fillet',
        code: 'SEA-3001',
        category: 'Seafood',
        quantity: 0,
        unit: 'kg',
        storage: 'Freezer A',
        status: 'Out of Stock',
    },
    {
        id: 7,
        name: 'Mozzarella Cheese',
        code: 'DAY-4001',
        category: 'Dairy',
        quantity: 12,
        unit: 'kg',
        storage: 'Walk-in Cooler',
        status: 'In Stock',
    },
    {
        id: 8,
        name: 'Heavy Cream',
        code: 'DAY-4002',
        category: 'Dairy',
        quantity: 3,
        unit: 'L',
        storage: 'Walk-in Cooler',
        status: 'Low Stock',
    },
    {
        id: 9,
        name: 'Olive Oil (EVOO)',
        code: 'DRY-5001',
        category: 'Dry Goods',
        quantity: 20,
        unit: 'L',
        storage: 'Dry Storage',
        status: 'In Stock',
    },
    {
        id: 10,
        name: 'Basmati Rice',
        code: 'DRY-5002',
        category: 'Dry Goods',
        quantity: 35,
        unit: 'kg',
        storage: 'Dry Storage',
        status: 'In Stock',
    },
    {
        id: 11,
        name: 'Ground Black Pepper',
        code: 'SPC-6001',
        category: 'Spices',
        quantity: 2,
        unit: 'kg',
        storage: 'Spice Rack',
        status: 'In Stock',
    },
    {
        id: 12,
        name: 'Soy Sauce',
        code: 'CNS-7001',
        category: 'Condiments',
        quantity: 2,
        unit: 'L',
        storage: 'Sauce Station',
        status: 'Low Stock',
    },
];

const entriesPerPageOptions = [10, 50, 100] as const;
const statusOptions: InventoryStatus[] = ['In Stock', 'Low Stock', 'Out of Stock'];
const defaultForm: IngredientForm = {
    name: '',
    category: '',
    quantity: '0',
    unit: '',
    storage: '',
    status: 'In Stock',
};

const toIngredientForm = (item: InventoryItem): IngredientForm => ({
    name: item.name,
    category: item.category,
    quantity: String(item.quantity),
    unit: item.unit,
    storage: item.storage,
    status: item.status,
});

const buildIngredientCode = (category: string, id: number) => {
    const prefix = category
        .toUpperCase()
        .replace(/[^A-Z]/g, '')
        .slice(0, 3)
        .padEnd(3, 'X');

    return `${prefix}-${String(id).padStart(4, '0')}`;
};

const getStatusBadge = (status: InventoryStatus) => {
    if (status === 'Out of Stock') {
        return (
            <Badge
                variant="outline"
                className="rounded-full border-red-300 bg-red-100 text-red-800 dark:border-red-500/60 dark:bg-red-500/20 dark:text-red-200"
            >
                {status}
            </Badge>
        );
    }

    if (status === 'Low Stock') {
        return (
            <Badge
                variant="outline"
                className="rounded-full border-amber-300 bg-amber-100 text-amber-800 dark:border-amber-500/60 dark:bg-amber-500/20 dark:text-amber-200"
            >
                {status}
            </Badge>
        );
    }

    return (
        <Badge
            variant="outline"
            className="rounded-full border-green-300 bg-green-100 text-green-800 dark:border-green-500/60 dark:bg-green-500/20 dark:text-green-200"
        >
            {status}
        </Badge>
    );
};

export default function Inventory() {
    const [items, setItems] = useState(initialInventoryItems);
    const [search, setSearch] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [entriesPerPage, setEntriesPerPage] = useState<number>(10);
    const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
    const [addForm, setAddForm] = useState<IngredientForm>(defaultForm);
    const [isAddStatusMenuOpen, setIsAddStatusMenuOpen] = useState(false);
    const [addStatusSearch, setAddStatusSearch] = useState('');
    const addStatusMenuRef = useRef<HTMLDivElement | null>(null);
    const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
    const [editItemId, setEditItemId] = useState<number | null>(null);
    const [editForm, setEditForm] = useState<IngredientForm>(defaultForm);
    const [isEditStatusMenuOpen, setIsEditStatusMenuOpen] = useState(false);
    const [editStatusSearch, setEditStatusSearch] = useState('');
    const editStatusMenuRef = useRef<HTMLDivElement | null>(null);

    useEffect(() => {
        const onPointerDown = (event: MouseEvent) => {
            if (
                isAddStatusMenuOpen &&
                addStatusMenuRef.current &&
                !addStatusMenuRef.current.contains(event.target as Node)
            ) {
                setIsAddStatusMenuOpen(false);
            }

            if (
                isEditStatusMenuOpen &&
                editStatusMenuRef.current &&
                !editStatusMenuRef.current.contains(event.target as Node)
            ) {
                setIsEditStatusMenuOpen(false);
            }
        };

        if (isAddStatusMenuOpen || isEditStatusMenuOpen) {
            document.addEventListener('mousedown', onPointerDown);
        }

        return () => {
            document.removeEventListener('mousedown', onPointerDown);
        };
    }, [isAddStatusMenuOpen, isEditStatusMenuOpen]);

    const filteredItems = useMemo(() => {
        const normalizedQuery = search.trim().toLowerCase();

        if (!normalizedQuery) {
            return items;
        }

        return items.filter((item) =>
            [
                item.name,
                item.code,
                item.category,
                item.quantity,
                item.unit,
                item.storage,
                item.status,
            ]
                .join(' ')
                .toLowerCase()
                .includes(normalizedQuery),
        );
    }, [items, search]);

    const totalPages = Math.max(
        1,
        Math.ceil(filteredItems.length / entriesPerPage),
    );

    const paginatedItems = useMemo(() => {
        const start = (currentPage - 1) * entriesPerPage;
        return filteredItems.slice(start, start + entriesPerPage);
    }, [currentPage, entriesPerPage, filteredItems]);

    const startItem =
        filteredItems.length === 0 ? 0 : (currentPage - 1) * entriesPerPage + 1;
    const endItem = Math.min(
        currentPage * entriesPerPage,
        filteredItems.length,
    );
    const filteredAddStatuses = statusOptions.filter((status) =>
        status.toLowerCase().includes(addStatusSearch.trim().toLowerCase()),
    );
    const filteredEditStatuses = statusOptions.filter((status) =>
        status.toLowerCase().includes(editStatusSearch.trim().toLowerCase()),
    );

    const handleSearchChange = (value: string) => {
        setSearch(value);
        setCurrentPage(1);
    };

    const handleEntriesPerPageChange = (
        event: ChangeEvent<HTMLSelectElement>,
    ) => {
        setEntriesPerPage(Number.parseInt(event.target.value, 10));
        setCurrentPage(1);
    };

    const handleAddDialogOpenChange = (open: boolean) => {
        setIsAddDialogOpen(open);
        if (!open) {
            setIsAddStatusMenuOpen(false);
            setAddStatusSearch('');
            setAddForm(defaultForm);
        }
    };

    const handleEditDialogOpenChange = (open: boolean) => {
        setIsEditDialogOpen(open);
        if (!open) {
            setEditItemId(null);
            setIsEditStatusMenuOpen(false);
            setEditStatusSearch('');
            setEditForm(defaultForm);
        }
    };

    const handleAddFieldChange =
        (field: keyof IngredientForm) =>
        (event: ChangeEvent<HTMLInputElement>) => {
            setAddForm((current) => ({ ...current, [field]: event.target.value }));
        };

    const handleEditFieldChange =
        (field: keyof IngredientForm) =>
        (event: ChangeEvent<HTMLInputElement>) => {
            setEditForm((current) => ({ ...current, [field]: event.target.value }));
        };

    const handleAddQuantityChange = (event: ChangeEvent<HTMLInputElement>) => {
        const value = event.target.value.trim();

        if (/^\d*$/.test(value)) {
            setAddForm((current) => ({ ...current, quantity: value }));
        }
    };

    const handleEditQuantityChange = (event: ChangeEvent<HTMLInputElement>) => {
        const value = event.target.value.trim();

        if (/^\d*$/.test(value)) {
            setEditForm((current) => ({ ...current, quantity: value }));
        }
    };

    const handleAddStatusSelect = (status: InventoryStatus) => {
        setAddForm((current) => ({ ...current, status }));
        setAddStatusSearch('');
        setIsAddStatusMenuOpen(false);
    };

    const handleEditStatusSelect = (status: InventoryStatus) => {
        setEditForm((current) => ({ ...current, status }));
        setEditStatusSearch('');
        setIsEditStatusMenuOpen(false);
    };

    const handleAddIngredient = (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();

        const quantity = Number.parseInt(addForm.quantity, 10);
        const normalizedQuantity = Number.isFinite(quantity)
            ? Math.max(0, quantity)
            : 0;
        const nextId = items.reduce((maxId, item) => Math.max(maxId, item.id), 0) + 1;
        const category = addForm.category.trim();

        const newItem: InventoryItem = {
            id: nextId,
            name: addForm.name.trim(),
            code: buildIngredientCode(category, nextId),
            category,
            quantity: normalizedQuantity,
            unit: addForm.unit.trim(),
            storage: addForm.storage.trim(),
            status: addForm.status,
        };

        setItems((current) => [newItem, ...current]);
        setCurrentPage(1);
        handleAddDialogOpenChange(false);
    };

    const openEditDialog = (item: InventoryItem) => {
        setEditItemId(item.id);
        setEditForm(toIngredientForm(item));
        setIsEditStatusMenuOpen(false);
        setEditStatusSearch('');
        setIsEditDialogOpen(true);
    };

    const handleEditIngredient = (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();

        if (editItemId === null) {
            return;
        }

        const quantity = Number.parseInt(editForm.quantity, 10);
        const normalizedQuantity = Number.isFinite(quantity)
            ? Math.max(0, quantity)
            : 0;

        setItems((current) =>
            current.map((item) => {
                if (item.id !== editItemId) {
                    return item;
                }

                return {
                    ...item,
                    name: editForm.name.trim(),
                    category: editForm.category.trim(),
                    quantity: normalizedQuantity,
                    unit: editForm.unit.trim(),
                    storage: editForm.storage.trim(),
                    status: editForm.status,
                };
            }),
        );
        handleEditDialogOpenChange(false);
    };

    const isAddDisabled =
        !addForm.name.trim() ||
        !addForm.category.trim() ||
        !addForm.quantity.trim() ||
        !addForm.unit.trim() ||
        !addForm.storage.trim();
    const isEditDisabled =
        editItemId === null ||
        !editForm.name.trim() ||
        !editForm.category.trim() ||
        !editForm.quantity.trim() ||
        !editForm.unit.trim() ||
        !editForm.storage.trim();

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
                            Track ingredient stock levels,
                            and manage storage records quickly.
                        </p>
                    </div>
                    <Dialog open={isAddDialogOpen} onOpenChange={handleAddDialogOpenChange}>
                        <DialogTrigger asChild>
                            <Button className="w-full gap-2 sm:w-auto">
                                <Plus className="size-4" />
                                Add Ingredient
                            </Button>
                        </DialogTrigger>
                        <DialogContent
                            className="sm:max-w-2xl"
                            onInteractOutside={(event) => event.preventDefault()}
                        >
                            <DialogHeader>
                                <DialogTitle>Add Ingredient</DialogTitle>
                                <DialogDescription>
                                    Create a new ingredient record for kitchen
                                    inventory.
                                </DialogDescription>
                            </DialogHeader>

                            <form onSubmit={handleAddIngredient} className="space-y-4">
                                <div className="grid gap-4 sm:grid-cols-2">
                                    <div className="space-y-2 sm:col-span-2">
                                        <Label htmlFor="ingredient-name">Name</Label>
                                        <Input
                                            id="ingredient-name"
                                            value={addForm.name}
                                            onChange={handleAddFieldChange('name')}
                                            placeholder="e.g. Basil Leaves"
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="ingredient-category">
                                            Category
                                        </Label>
                                        <Input
                                            id="ingredient-category"
                                            value={addForm.category}
                                            onChange={handleAddFieldChange('category')}
                                            placeholder="e.g. Produce"
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="ingredient-quantity">
                                            Quantity
                                        </Label>
                                        <Input
                                            id="ingredient-quantity"
                                            type="number"
                                            min="0"
                                            step="1"
                                            value={addForm.quantity}
                                            onChange={handleAddQuantityChange}
                                            placeholder="0"
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="ingredient-unit">Unit</Label>
                                        <Input
                                            id="ingredient-unit"
                                            value={addForm.unit}
                                            onChange={handleAddFieldChange('unit')}
                                            placeholder="e.g. kg, L, pack"
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="ingredient-storage">
                                            Storage
                                        </Label>
                                        <Input
                                            id="ingredient-storage"
                                            value={addForm.storage}
                                            onChange={handleAddFieldChange('storage')}
                                            placeholder="e.g. Walk-in Cooler"
                                        />
                                    </div>

                                    <div className="relative space-y-2 sm:col-span-2" ref={addStatusMenuRef}>
                                        <Label htmlFor="ingredient-status">
                                            Status
                                        </Label>
                                        <Button
                                            id="ingredient-status"
                                            type="button"
                                            variant="outline"
                                            className="w-full justify-between font-normal"
                                            onClick={() =>
                                                setIsAddStatusMenuOpen((open) => !open)
                                            }
                                        >
                                            <span
                                                className={cn(
                                                    !addForm.status &&
                                                        'text-muted-foreground',
                                                )}
                                            >
                                                {addForm.status || 'Select status'}
                                            </span>
                                            <ChevronsUpDown className="size-4 opacity-50" />
                                        </Button>

                                        {isAddStatusMenuOpen ? (
                                            <div className="bg-popover text-popover-foreground absolute z-20 mt-1 w-full rounded-md border shadow-md">
                                                <div className="border-b p-2">
                                                    <Input
                                                        value={addStatusSearch}
                                                        onChange={(event) =>
                                                            setAddStatusSearch(
                                                                event.target.value,
                                                            )
                                                        }
                                                        placeholder="Search status..."
                                                        className="h-8"
                                                    />
                                                </div>
                                                <div className="max-h-44 overflow-y-auto p-1">
                                                    {filteredAddStatuses.length === 0 ? (
                                                        <p className="px-2 py-1.5 text-sm text-muted-foreground">
                                                            No status found.
                                                        </p>
                                                    ) : (
                                                        filteredAddStatuses.map(
                                                            (status) => (
                                                                <button
                                                                    key={status}
                                                                    type="button"
                                                                    className="hover:bg-accent hover:text-accent-foreground flex w-full items-center justify-between rounded-sm px-2 py-1.5 text-left text-sm"
                                                                    onClick={() =>
                                                                        handleAddStatusSelect(
                                                                            status,
                                                                        )
                                                                    }
                                                                >
                                                                    {status}
                                                                    <Check
                                                                        className={cn(
                                                                            'size-4',
                                                                            addForm.status ===
                                                                                status
                                                                                ? 'opacity-100'
                                                                                : 'opacity-0',
                                                                        )}
                                                                    />
                                                                </button>
                                                            ),
                                                        )
                                                    )}
                                                </div>
                                            </div>
                                        ) : null}
                                    </div>
                                </div>

                                <DialogFooter>
                                    <Button
                                        type="button"
                                        variant="outline"
                                        onClick={() =>
                                            handleAddDialogOpenChange(false)
                                        }
                                    >
                                        Cancel
                                    </Button>
                                    <Button type="submit" disabled={isAddDisabled}>
                                        Save Ingredient
                                    </Button>
                                </DialogFooter>
                            </form>
                        </DialogContent>
                    </Dialog>
                    <Dialog open={isEditDialogOpen} onOpenChange={handleEditDialogOpenChange}>
                        <DialogContent
                            className="sm:max-w-2xl"
                            onInteractOutside={(event) => event.preventDefault()}
                        >
                            <DialogHeader>
                                <DialogTitle>Edit Ingredient</DialogTitle>
                                <DialogDescription>
                                    Update this ingredient record for kitchen
                                    inventory.
                                </DialogDescription>
                            </DialogHeader>

                            <form onSubmit={handleEditIngredient} className="space-y-4">
                                <div className="grid gap-4 sm:grid-cols-2">
                                    <div className="space-y-2 sm:col-span-2">
                                        <Label htmlFor="edit-ingredient-name">Name</Label>
                                        <Input
                                            id="edit-ingredient-name"
                                            value={editForm.name}
                                            onChange={handleEditFieldChange('name')}
                                            placeholder="e.g. Basil Leaves"
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="edit-ingredient-category">
                                            Category
                                        </Label>
                                        <Input
                                            id="edit-ingredient-category"
                                            value={editForm.category}
                                            onChange={handleEditFieldChange('category')}
                                            placeholder="e.g. Produce"
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="edit-ingredient-quantity">
                                            Quantity
                                        </Label>
                                        <Input
                                            id="edit-ingredient-quantity"
                                            type="number"
                                            min="0"
                                            step="1"
                                            value={editForm.quantity}
                                            onChange={handleEditQuantityChange}
                                            placeholder="0"
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="edit-ingredient-unit">Unit</Label>
                                        <Input
                                            id="edit-ingredient-unit"
                                            value={editForm.unit}
                                            onChange={handleEditFieldChange('unit')}
                                            placeholder="e.g. kg, L, pack"
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="edit-ingredient-storage">
                                            Storage
                                        </Label>
                                        <Input
                                            id="edit-ingredient-storage"
                                            value={editForm.storage}
                                            onChange={handleEditFieldChange('storage')}
                                            placeholder="e.g. Walk-in Cooler"
                                        />
                                    </div>

                                    <div className="relative space-y-2 sm:col-span-2" ref={editStatusMenuRef}>
                                        <Label htmlFor="edit-ingredient-status">
                                            Status
                                        </Label>
                                        <Button
                                            id="edit-ingredient-status"
                                            type="button"
                                            variant="outline"
                                            className="w-full justify-between font-normal"
                                            onClick={() =>
                                                setIsEditStatusMenuOpen((open) => !open)
                                            }
                                        >
                                            <span
                                                className={cn(
                                                    !editForm.status &&
                                                        'text-muted-foreground',
                                                )}
                                            >
                                                {editForm.status || 'Select status'}
                                            </span>
                                            <ChevronsUpDown className="size-4 opacity-50" />
                                        </Button>

                                        {isEditStatusMenuOpen ? (
                                            <div className="bg-popover text-popover-foreground absolute z-20 mt-1 w-full rounded-md border shadow-md">
                                                <div className="border-b p-2">
                                                    <Input
                                                        value={editStatusSearch}
                                                        onChange={(event) =>
                                                            setEditStatusSearch(
                                                                event.target.value,
                                                            )
                                                        }
                                                        placeholder="Search status..."
                                                        className="h-8"
                                                    />
                                                </div>
                                                <div className="max-h-44 overflow-y-auto p-1">
                                                    {filteredEditStatuses.length === 0 ? (
                                                        <p className="px-2 py-1.5 text-sm text-muted-foreground">
                                                            No status found.
                                                        </p>
                                                    ) : (
                                                        filteredEditStatuses.map(
                                                            (status) => (
                                                                <button
                                                                    key={status}
                                                                    type="button"
                                                                    className="hover:bg-accent hover:text-accent-foreground flex w-full items-center justify-between rounded-sm px-2 py-1.5 text-left text-sm"
                                                                    onClick={() =>
                                                                        handleEditStatusSelect(
                                                                            status,
                                                                        )
                                                                    }
                                                                >
                                                                    {status}
                                                                    <Check
                                                                        className={cn(
                                                                            'size-4',
                                                                            editForm.status ===
                                                                                status
                                                                                ? 'opacity-100'
                                                                                : 'opacity-0',
                                                                        )}
                                                                    />
                                                                </button>
                                                            ),
                                                        )
                                                    )}
                                                </div>
                                            </div>
                                        ) : null}
                                    </div>
                                </div>

                                <DialogFooter>
                                    <Button
                                        type="button"
                                        variant="outline"
                                        onClick={() =>
                                            handleEditDialogOpenChange(false)
                                        }
                                    >
                                        Cancel
                                    </Button>
                                    <Button type="submit" disabled={isEditDisabled}>
                                        Save Changes
                                    </Button>
                                </DialogFooter>
                            </form>
                        </DialogContent>
                    </Dialog>
                </CardHeader>

                <CardContent className="space-y-4">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                        <div className="relative w-full max-w-md">
                            <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
                            <Input
                                value={search}
                                onChange={(event) =>
                                    handleSearchChange(event.target.value)
                                }
                                placeholder="Search by name, code, category, storage..."
                                className="pl-9"
                            />
                        </div>
                        <div className="flex items-center gap-2 self-end sm:self-auto">
                            <Label htmlFor="entries-per-page" className="text-sm text-muted-foreground">
                                Show entries
                            </Label>
                            <select
                                id="entries-per-page"
                                value={entriesPerPage}
                                onChange={handleEntriesPerPageChange}
                                className="border-input bg-background ring-offset-background focus-visible:ring-ring inline-flex h-9 w-20 rounded-md border px-3 text-sm shadow-xs focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-hidden"
                            >
                                {entriesPerPageOptions.map((option) => (
                                    <option key={option} value={option}>
                                        {option}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>

                    <div className="hidden overflow-x-auto rounded-lg border border-border/70 md:block">
                        <table className="min-w-full text-sm">
                            <thead className="bg-muted/40 text-left">
                                <tr>
                                    <th className="px-4 py-3 font-medium">
                                        Seq
                                    </th>
                                    <th className="px-4 py-3 font-medium">
                                        Name
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
                                            colSpan={9}
                                            className="px-4 py-8 text-center text-muted-foreground"
                                        >
                                            No ingredient matched your
                                            search.
                                        </td>
                                    </tr>
                                ) : (
                                    paginatedItems.map((item, index) => (
                                        <tr
                                            key={item.id}
                                            className="border-t border-border/70"
                                        >
                                            <td className="px-4 py-3 text-muted-foreground">
                                                {(currentPage - 1) * entriesPerPage +
                                                    index +
                                                    1}
                                            </td>
                                            <td className="px-4 py-3 font-medium">
                                                {item.name}
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
                                                {item.storage}
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
                                                        aria-label={`Edit ${item.name}`}
                                                        onClick={() => openEditDialog(item)}
                                                    >
                                                        <Pencil className="size-4" />
                                                    </Button>
                                                    <Button
                                                        type="button"
                                                        variant="ghost"
                                                        size="icon"
                                                        className="size-8 text-destructive hover:text-destructive"
                                                        aria-label={`Delete ${item.name}`}
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
                            paginatedItems.map((item, index) => (
                                <div
                                    key={item.id}
                                    className="rounded-lg border border-border/70 bg-background/70 p-4"
                                >
                                    <div className="flex items-start justify-between gap-3">
                                        <div>
                                            <p className="font-medium">
                                                #{' '}
                                                {(currentPage - 1) *
                                                    entriesPerPage +
                                                    index +
                                                    1}{' '}
                                                {item.name}
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
                                        <p>Storage: {item.storage}</p>
                                    </div>
                                    <div className="mt-4 flex justify-end gap-2">
                                        <Button
                                            type="button"
                                            variant="outline"
                                            size="sm"
                                            className="gap-1"
                                            onClick={() => openEditDialog(item)}
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
