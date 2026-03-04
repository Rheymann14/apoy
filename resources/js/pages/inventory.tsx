import { Head, router } from '@inertiajs/react';
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
import { toast } from 'sonner';
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

type InventoryOption = {
    id: number;
    name: string;
};

type InventoryItem = {
    id: number;
    name: string;
    code: string;
    category_id: number;
    category: string;
    quantity: number;
    unit_id: number;
    unit: string;
    storage_id: number;
    storage: string;
    status: InventoryStatus;
};

type IngredientForm = {
    name: string;
    categoryId: string;
    quantity: string;
    unitId: string;
    storageId: string;
    status: InventoryStatus;
};

type InventoryPageProps = {
    categories: InventoryOption[];
    units: InventoryOption[];
    storages: InventoryOption[];
    ingredients: InventoryItem[];
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

const entriesPerPageOptions = [10, 50, 100] as const;
const statusOptions: InventoryStatus[] = ['In Stock', 'Low Stock', 'Out of Stock'];
const defaultForm: IngredientForm = {
    name: '',
    categoryId: '',
    quantity: '0',
    unitId: '',
    storageId: '',
    status: 'In Stock',
};

const toIngredientForm = (item: InventoryItem): IngredientForm => ({
    name: item.name,
    categoryId: String(item.category_id),
    quantity: String(item.quantity),
    unitId: String(item.unit_id),
    storageId: String(item.storage_id),
    status: item.status,
});

const normalizeName = (value: string) =>
    value.trim().replace(/\s+/g, ' ');

const getFirstErrorMessage = (errors: unknown) => {
    if (!errors || typeof errors !== 'object') {
        return 'Validation error. Please check your input.';
    }

    for (const value of Object.values(errors as Record<string, unknown>)) {
        if (typeof value === 'string' && value.trim()) {
            return value;
        }

        if (Array.isArray(value)) {
            const first = value.find(
                (entry): entry is string =>
                    typeof entry === 'string' && entry.trim().length > 0,
            );

            if (first) {
                return first;
            }
        }
    }

    return 'Validation error. Please check your input.';
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

type SearchableOptionFieldProps = {
    id: string;
    label: string;
    value: string;
    options: InventoryOption[];
    placeholder: string;
    searchPlaceholder: string;
    emptyLabel: string;
    onValueChange: (value: string) => void;
};

function SearchableOptionField({
    id,
    label,
    value,
    options,
    placeholder,
    searchPlaceholder,
    emptyLabel,
    onValueChange,
}: SearchableOptionFieldProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [search, setSearch] = useState('');
    const menuRef = useRef<HTMLDivElement | null>(null);

    useEffect(() => {
        if (!isOpen) {
            return;
        }

        const onPointerDown = (event: MouseEvent) => {
            if (
                menuRef.current &&
                !menuRef.current.contains(event.target as Node)
            ) {
                setIsOpen(false);
            }
        };

        document.addEventListener('mousedown', onPointerDown);
        return () => document.removeEventListener('mousedown', onPointerDown);
    }, [isOpen]);

    const selectedOption = options.find(
        (option) => String(option.id) === value,
    );
    const filteredOptions = useMemo(() => {
        const normalizedSearch = search.trim().toLowerCase();
        if (!normalizedSearch) {
            return options;
        }

        return options.filter((option) =>
            option.name.toLowerCase().includes(normalizedSearch),
        );
    }, [options, search]);

    return (
        <div className="space-y-2">
            <Label htmlFor={id}>{label}</Label>
            <div ref={menuRef} className="relative">
                <Button
                    id={id}
                    type="button"
                    variant="outline"
                    className="w-full justify-between font-normal"
                    onClick={() => setIsOpen((open) => !open)}
                >
                    <span className={cn(!selectedOption && 'text-muted-foreground')}>
                        {selectedOption?.name || placeholder}
                    </span>
                    <ChevronsUpDown className="size-4 opacity-50" />
                </Button>

                {isOpen ? (
                    <div className="bg-popover text-popover-foreground absolute z-20 mt-1 w-full rounded-md border shadow-md">
                        <div className="border-b p-2">
                            <Input
                                value={search}
                                onChange={(event) => setSearch(event.target.value)}
                                placeholder={searchPlaceholder}
                                className="h-8"
                            />
                        </div>
                        <div className="max-h-44 overflow-y-auto p-1">
                            {filteredOptions.length === 0 ? (
                                <p className="px-2 py-1.5 text-sm text-muted-foreground">
                                    {emptyLabel}
                                </p>
                            ) : (
                                filteredOptions.map((option) => (
                                    <button
                                        key={option.id}
                                        type="button"
                                        className="hover:bg-accent hover:text-accent-foreground flex w-full items-center justify-between rounded-sm px-2 py-1.5 text-left text-sm"
                                        onClick={() => {
                                            onValueChange(String(option.id));
                                            setSearch('');
                                            setIsOpen(false);
                                        }}
                                    >
                                        {option.name}
                                        <Check
                                            className={cn(
                                                'size-4',
                                                value === String(option.id)
                                                    ? 'opacity-100'
                                                    : 'opacity-0',
                                            )}
                                        />
                                    </button>
                                ))
                            )}
                        </div>
                    </div>
                ) : null}
            </div>
        </div>
    );
}

export default function Inventory({
    categories,
    units,
    storages,
    ingredients,
}: InventoryPageProps) {
    const [items, setItems] = useState<InventoryItem[]>(ingredients);
    const [search, setSearch] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [entriesPerPage, setEntriesPerPage] = useState<number>(10);
    const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
    const [addForm, setAddForm] = useState<IngredientForm>(defaultForm);
    const [isAdding, setIsAdding] = useState(false);
    const [isAddStatusMenuOpen, setIsAddStatusMenuOpen] = useState(false);
    const [addStatusSearch, setAddStatusSearch] = useState('');
    const addStatusMenuRef = useRef<HTMLDivElement | null>(null);
    const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
    const [editItemId, setEditItemId] = useState<number | null>(null);
    const [editForm, setEditForm] = useState<IngredientForm>(defaultForm);
    const [isEditing, setIsEditing] = useState(false);
    const [isEditStatusMenuOpen, setIsEditStatusMenuOpen] = useState(false);
    const [editStatusSearch, setEditStatusSearch] = useState('');
    const editStatusMenuRef = useRef<HTMLDivElement | null>(null);
    const [deletingItemId, setDeletingItemId] = useState<number | null>(null);

    useEffect(() => {
        setItems(ingredients);
    }, [ingredients]);

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

        setIsAdding(true);
        router.post('/inventory/ingredients', {
            name: normalizeName(addForm.name),
            category_id: Number.parseInt(addForm.categoryId, 10),
            quantity: normalizedQuantity,
            unit_id: Number.parseInt(addForm.unitId, 10),
            storage_id: Number.parseInt(addForm.storageId, 10),
            status: addForm.status,
        }, {
            preserveScroll: true,
            onSuccess: () => {
                toast.success('Ingredient added successfully.');
                setCurrentPage(1);
                handleAddDialogOpenChange(false);
            },
            onError: (errors) => toast.error(getFirstErrorMessage(errors)),
            onFinish: () => setIsAdding(false),
        });
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

        setIsEditing(true);
        router.put(`/inventory/ingredients/${editItemId}`, {
            name: normalizeName(editForm.name),
            category_id: Number.parseInt(editForm.categoryId, 10),
            quantity: normalizedQuantity,
            unit_id: Number.parseInt(editForm.unitId, 10),
            storage_id: Number.parseInt(editForm.storageId, 10),
            status: editForm.status,
        }, {
            preserveScroll: true,
            onSuccess: () => {
                toast.success('Ingredient updated successfully.');
                handleEditDialogOpenChange(false);
            },
            onError: (errors) => toast.error(getFirstErrorMessage(errors)),
            onFinish: () => setIsEditing(false),
        });
    };

    const handleDeleteIngredient = (item: InventoryItem) => {
        setDeletingItemId(item.id);
        router.delete(`/inventory/ingredients/${item.id}`, {
            preserveScroll: true,
            onSuccess: () => toast.success('Ingredient deleted successfully.'),
            onError: (errors) => toast.error(getFirstErrorMessage(errors)),
            onFinish: () => setDeletingItemId(null),
        });
    };

    const isAddDisabled =
        !normalizeName(addForm.name) ||
        !addForm.categoryId ||
        !addForm.quantity.trim() ||
        !addForm.unitId ||
        !addForm.storageId;
    const isEditDisabled =
        editItemId === null ||
        !normalizeName(editForm.name) ||
        !editForm.categoryId ||
        !editForm.quantity.trim() ||
        !editForm.unitId ||
        !editForm.storageId;

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

                                    <SearchableOptionField
                                        id="ingredient-category"
                                        label="Category"
                                        value={addForm.categoryId}
                                        options={categories}
                                        placeholder="Select category"
                                        searchPlaceholder="Search category..."
                                        emptyLabel="No category found."
                                        onValueChange={(value) =>
                                            setAddForm((current) => ({
                                                ...current,
                                                categoryId: value,
                                            }))
                                        }
                                    />

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

                                    <SearchableOptionField
                                        id="ingredient-unit"
                                        label="Unit"
                                        value={addForm.unitId}
                                        options={units}
                                        placeholder="Select unit"
                                        searchPlaceholder="Search unit..."
                                        emptyLabel="No unit found."
                                        onValueChange={(value) =>
                                            setAddForm((current) => ({
                                                ...current,
                                                unitId: value,
                                            }))
                                        }
                                    />

                                    <SearchableOptionField
                                        id="ingredient-storage"
                                        label="Storage"
                                        value={addForm.storageId}
                                        options={storages}
                                        placeholder="Select storage"
                                        searchPlaceholder="Search storage..."
                                        emptyLabel="No storage found."
                                        onValueChange={(value) =>
                                            setAddForm((current) => ({
                                                ...current,
                                                storageId: value,
                                            }))
                                        }
                                    />

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
                                    <Button type="submit" disabled={isAddDisabled || isAdding}>
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

                                    <SearchableOptionField
                                        id="edit-ingredient-category"
                                        label="Category"
                                        value={editForm.categoryId}
                                        options={categories}
                                        placeholder="Select category"
                                        searchPlaceholder="Search category..."
                                        emptyLabel="No category found."
                                        onValueChange={(value) =>
                                            setEditForm((current) => ({
                                                ...current,
                                                categoryId: value,
                                            }))
                                        }
                                    />

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

                                    <SearchableOptionField
                                        id="edit-ingredient-unit"
                                        label="Unit"
                                        value={editForm.unitId}
                                        options={units}
                                        placeholder="Select unit"
                                        searchPlaceholder="Search unit..."
                                        emptyLabel="No unit found."
                                        onValueChange={(value) =>
                                            setEditForm((current) => ({
                                                ...current,
                                                unitId: value,
                                            }))
                                        }
                                    />

                                    <SearchableOptionField
                                        id="edit-ingredient-storage"
                                        label="Storage"
                                        value={editForm.storageId}
                                        options={storages}
                                        placeholder="Select storage"
                                        searchPlaceholder="Search storage..."
                                        emptyLabel="No storage found."
                                        onValueChange={(value) =>
                                            setEditForm((current) => ({
                                                ...current,
                                                storageId: value,
                                            }))
                                        }
                                    />

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
                                    <Button type="submit" disabled={isEditDisabled || isEditing}>
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
                                                        onClick={() => handleDeleteIngredient(item)}
                                                        disabled={deletingItemId === item.id}
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
                                            onClick={() => handleDeleteIngredient(item)}
                                            disabled={deletingItemId === item.id}
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
