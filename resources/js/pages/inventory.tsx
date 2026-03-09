import { Head, Link, router, usePage } from '@inertiajs/react';
import {
    Check,
    ChevronDown,
    ChevronLeft,
    ChevronRight,
    ChevronUp,
    ChevronsUpDown,
    History,
    Loader2,
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
import {
    Tooltip,
    TooltipContent,
    TooltipTrigger,
} from '@/components/ui/tooltip';
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
    created_by_name: string | null;
};

type IngredientForm = {
    name: string;
    categoryId: string;
    quantity: string;
    unitId: string;
    storageId: string;
    status: InventoryStatus;
};

type SortField =
    | 'name'
    | 'code'
    | 'category'
    | 'quantity'
    | 'unit'
    | 'storage'
    | 'status';
type SortDirection = 'asc' | 'desc';

type PaginatedIngredients = {
    data: InventoryItem[];
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
    from: number | null;
    to: number | null;
};

type Filters = {
    search: string;
    sort: SortField | null;
    direction: SortDirection;
    per_page: number;
};

type InventoryPageProps = {
    categories: InventoryOption[];
    units: InventoryOption[];
    storages: InventoryOption[];
    ingredients: PaginatedIngredients;
    filters: Filters;
};

type DeleteDialogTarget = {
    id: number;
    name: string;
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

const deriveStatusFromQuantity = (quantity: number): InventoryStatus => {
    if (quantity === 0) {
        return 'Out of Stock';
    }

    if (quantity <= 5) {
        return 'Low Stock';
    }

    return 'In Stock';
};

const toNormalizedQuantity = (value: string): number => {
    const parsed = Number.parseInt(value, 10);
    return Number.isFinite(parsed) ? Math.max(0, parsed) : 0;
};

const defaultForm: IngredientForm = {
    name: '',
    categoryId: '',
    quantity: '0',
    unitId: '',
    storageId: '',
    status: deriveStatusFromQuantity(0),
};

const toIngredientForm = (item: InventoryItem): IngredientForm => ({
    name: item.name,
    categoryId: String(item.category_id),
    quantity: String(item.quantity),
    unitId: String(item.unit_id),
    storageId: String(item.storage_id),
    status: item.status,
});

const normalizeName = (value: string) => value.trim().replace(/\s+/g, ' ');

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
                    <span
                        className={cn(
                            !selectedOption && 'text-muted-foreground',
                        )}
                    >
                        {selectedOption?.name || placeholder}
                    </span>
                    <ChevronsUpDown className="size-4 opacity-50" />
                </Button>

                {isOpen ? (
                    <div className="absolute z-20 mt-1 w-full rounded-md border bg-popover text-popover-foreground shadow-md">
                        <div className="border-b p-2">
                            <Input
                                value={search}
                                onChange={(event) =>
                                    setSearch(event.target.value)
                                }
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
                                        className="flex w-full items-center justify-between rounded-sm px-2 py-1.5 text-left text-sm hover:bg-accent hover:text-accent-foreground"
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
    filters,
}: InventoryPageProps) {
    const { auth } = usePage().props;
    const isAdmin = auth.user.role_slug === 'admin';
    const [search, setSearch] = useState(filters.search ?? '');
    const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
    const [addForm, setAddForm] = useState<IngredientForm>(defaultForm);
    const [isAdding, setIsAdding] = useState(false);
    const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
    const [editItemId, setEditItemId] = useState<number | null>(null);
    const [editForm, setEditForm] = useState<IngredientForm>(defaultForm);
    const [isEditing, setIsEditing] = useState(false);
    const [deletingItemId, setDeletingItemId] = useState<number | null>(null);
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
    const [deleteTarget, setDeleteTarget] = useState<DeleteDialogTarget | null>(
        null,
    );

    useEffect(() => {
        setSearch(filters.search ?? '');
    }, [filters.search]);

    const requestInventory = (
        params: Partial<{
            search: string | undefined;
            sort: SortField | undefined;
            direction: SortDirection | undefined;
            per_page: number;
            page: number;
        }>,
    ) => {
        router.get(
            '/inventory',
            {
                search: filters.search || undefined,
                sort: filters.sort || undefined,
                direction: filters.sort ? filters.direction : undefined,
                per_page: filters.per_page,
                ...params,
            },
            {
                preserveScroll: true,
                preserveState: true,
                replace: true,
            },
        );
    };

    useEffect(() => {
        const normalizedSearch = search.trim();
        if (normalizedSearch === filters.search) {
            return;
        }

        const timeoutId = window.setTimeout(() => {
            requestInventory({
                search: normalizedSearch || undefined,
                page: 1,
            });
        }, 300);

        return () => window.clearTimeout(timeoutId);
    }, [filters.search, search]);

    const handleEntriesPerPageChange = (
        event: ChangeEvent<HTMLSelectElement>,
    ) => {
        requestInventory({
            per_page: Number.parseInt(event.target.value, 10),
            page: 1,
        });
    };

    const handleSort = (field: SortField) => {
        if (filters.sort === field) {
            requestInventory({
                sort: field,
                direction: filters.direction === 'asc' ? 'desc' : 'asc',
                page: 1,
            });
            return;
        }

        requestInventory({
            sort: field,
            direction: 'asc',
            page: 1,
        });
    };

    const renderSortIcon = (field: SortField) => {
        if (filters.sort !== field) {
            return <ChevronsUpDown className="size-3.5 opacity-45" />;
        }

        if (filters.direction === 'asc') {
            return <ChevronUp className="size-3.5" />;
        }

        return <ChevronDown className="size-3.5" />;
    };

    const handleAddDialogOpenChange = (open: boolean) => {
        setIsAddDialogOpen(open);
        if (!open) {
            setAddForm(defaultForm);
        }
    };

    const handleEditDialogOpenChange = (open: boolean) => {
        setIsEditDialogOpen(open);
        if (!open) {
            setEditItemId(null);
            setEditForm(defaultForm);
        }
    };

    const handleAddFieldChange =
        (field: keyof IngredientForm) =>
        (event: ChangeEvent<HTMLInputElement>) => {
            setAddForm((current) => ({
                ...current,
                [field]: event.target.value,
            }));
        };

    const handleEditFieldChange =
        (field: keyof IngredientForm) =>
        (event: ChangeEvent<HTMLInputElement>) => {
            setEditForm((current) => ({
                ...current,
                [field]: event.target.value,
            }));
        };

    const handleAddQuantityChange = (event: ChangeEvent<HTMLInputElement>) => {
        const value = event.target.value.trim();

        if (/^\d*$/.test(value)) {
            const normalizedQuantity = toNormalizedQuantity(value);
            setAddForm((current) => ({
                ...current,
                quantity: value,
                status: deriveStatusFromQuantity(normalizedQuantity),
            }));
        }
    };

    const handleEditQuantityChange = (event: ChangeEvent<HTMLInputElement>) => {
        const value = event.target.value.trim();

        if (/^\d*$/.test(value)) {
            const normalizedQuantity = toNormalizedQuantity(value);
            setEditForm((current) => ({
                ...current,
                quantity: value,
                status: deriveStatusFromQuantity(normalizedQuantity),
            }));
        }
    };

    const handleAddIngredient = (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();

        const normalizedQuantity = toNormalizedQuantity(addForm.quantity);
        const status = deriveStatusFromQuantity(normalizedQuantity);

        setIsAdding(true);
        router.post(
            '/inventory/ingredients',
            {
                name: normalizeName(addForm.name),
                category_id: Number.parseInt(addForm.categoryId, 10),
                quantity: normalizedQuantity,
                unit_id: Number.parseInt(addForm.unitId, 10),
                storage_id: Number.parseInt(addForm.storageId, 10),
                status,
            },
            {
                preserveScroll: true,
                onSuccess: () => {
                    toast.success('Ingredient added successfully.');
                    handleAddDialogOpenChange(false);
                },
                onError: (errors) => toast.error(getFirstErrorMessage(errors)),
                onFinish: () => setIsAdding(false),
            },
        );
    };

    const openEditDialog = (item: InventoryItem) => {
        setEditItemId(item.id);
        setEditForm(toIngredientForm(item));
        setIsEditDialogOpen(true);
    };

    const handleEditIngredient = (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();

        if (editItemId === null) {
            return;
        }

        const normalizedQuantity = toNormalizedQuantity(editForm.quantity);
        const status = deriveStatusFromQuantity(normalizedQuantity);

        setIsEditing(true);
        router.put(
            `/inventory/ingredients/${editItemId}`,
            {
                name: normalizeName(editForm.name),
                category_id: Number.parseInt(editForm.categoryId, 10),
                quantity: normalizedQuantity,
                unit_id: Number.parseInt(editForm.unitId, 10),
                storage_id: Number.parseInt(editForm.storageId, 10),
                status,
            },
            {
                preserveScroll: true,
                onSuccess: () => {
                    toast.success('Ingredient updated successfully.');
                    handleEditDialogOpenChange(false);
                },
                onError: (errors) => toast.error(getFirstErrorMessage(errors)),
                onFinish: () => setIsEditing(false),
            },
        );
    };

    const openDeleteDialog = (item: InventoryItem) => {
        if (!isAdmin) {
            return;
        }

        setDeleteTarget({ id: item.id, name: item.name });
        setIsDeleteDialogOpen(true);
    };

    const closeDeleteDialog = () => {
        setIsDeleteDialogOpen(false);
        setDeleteTarget(null);
    };

    const handleDeleteIngredient = () => {
        if (!isAdmin || !deleteTarget) {
            return;
        }

        setDeletingItemId(deleteTarget.id);
        router.delete(`/inventory/ingredients/${deleteTarget.id}`, {
            preserveScroll: true,
            onSuccess: () => {
                toast.success('Ingredient deleted successfully.');
                closeDeleteDialog();
            },
            onError: (errors) => toast.error(getFirstErrorMessage(errors)),
            onFinish: () => setDeletingItemId(null),
        });
    };

    const goToPage = (page: number) => {
        requestInventory({ page });
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
    const hasNoResults = ingredients.data.length === 0;
    const emptyMessage =
        filters.search.trim() !== ''
            ? 'No ingredient matched your search.'
            : 'No ingredients found.';

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
                            Track ingredient stock levels, and manage storage
                            records quickly.
                        </p>
                    </div>
                    <Dialog
                        open={isAddDialogOpen}
                        onOpenChange={handleAddDialogOpenChange}
                    >
                        <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row">
                            <Button
                                asChild
                                variant="outline"
                                className="w-full gap-2 sm:w-auto"
                            >
                                <Link href="/inventory/changes">
                                    <History className="size-4" />
                                    View Changes
                                </Link>
                            </Button>
                            <DialogTrigger asChild>
                                <Button className="w-full gap-2 sm:w-auto">
                                    <Plus className="size-4" />
                                    Add Ingredient
                                </Button>
                            </DialogTrigger>
                        </div>
                        <DialogContent
                            className="sm:max-w-2xl"
                            onInteractOutside={(event) =>
                                event.preventDefault()
                            }
                        >
                            <DialogHeader>
                                <DialogTitle>Add Ingredient</DialogTitle>
                                <DialogDescription>
                                    Create a new ingredient record for kitchen
                                    inventory.
                                </DialogDescription>
                            </DialogHeader>

                            <form
                                onSubmit={handleAddIngredient}
                                className="space-y-4"
                            >
                                <div className="grid gap-4 sm:grid-cols-2">
                                    <div className="space-y-2 sm:col-span-2">
                                        <Label htmlFor="ingredient-name">
                                            Name
                                        </Label>
                                        <Input
                                            id="ingredient-name"
                                            value={addForm.name}
                                            onChange={handleAddFieldChange(
                                                'name',
                                            )}
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

                                    <div className="space-y-2 sm:col-span-2">
                                        <Label>Status</Label>
                                        <div className="flex h-10 items-center rounded-md border border-border/70 px-3">
                                            {getStatusBadge(addForm.status)}
                                        </div>
                                        <p className="text-xs text-muted-foreground">
                                            Automatic based on quantity: 0 = Out
                                            of Stock, 1-5 = Low Stock, 6+ = In
                                            Stock.
                                        </p>
                                    </div>
                                </div>

                                <DialogFooter>
                                    <Button
                                        type="button"
                                        variant="outline"
                                        onClick={() =>
                                            handleAddDialogOpenChange(false)
                                        }
                                        disabled={isAdding}
                                    >
                                        Cancel
                                    </Button>
                                    <Button
                                        type="submit"
                                        disabled={isAddDisabled || isAdding}
                                    >
                                        {isAdding ? (
                                            <>
                                                <Loader2 className="mr-2 size-4 animate-spin" />
                                                Saving ingredient...
                                            </>
                                        ) : (
                                            'Save Ingredient'
                                        )}
                                    </Button>
                                </DialogFooter>
                            </form>
                        </DialogContent>
                    </Dialog>
                    <Dialog
                        open={isEditDialogOpen}
                        onOpenChange={handleEditDialogOpenChange}
                    >
                        <DialogContent
                            className="sm:max-w-2xl"
                            onInteractOutside={(event) =>
                                event.preventDefault()
                            }
                        >
                            <DialogHeader>
                                <DialogTitle>Edit Ingredient</DialogTitle>
                                <DialogDescription>
                                    Update this ingredient record for kitchen
                                    inventory.
                                </DialogDescription>
                            </DialogHeader>

                            <form
                                onSubmit={handleEditIngredient}
                                className="space-y-4"
                            >
                                <div className="grid gap-4 sm:grid-cols-2">
                                    <div className="space-y-2 sm:col-span-2">
                                        <Label htmlFor="edit-ingredient-name">
                                            Name
                                        </Label>
                                        <Input
                                            id="edit-ingredient-name"
                                            value={editForm.name}
                                            onChange={handleEditFieldChange(
                                                'name',
                                            )}
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

                                    <div className="space-y-2 sm:col-span-2">
                                        <Label>Status</Label>
                                        <div className="flex h-10 items-center rounded-md border border-border/70 px-3">
                                            {getStatusBadge(editForm.status)}
                                        </div>
                                        <p className="text-xs text-muted-foreground">
                                            Automatic based on quantity: 0 = Out
                                            of Stock, 1-5 = Low Stock, 6+ = In
                                            Stock.
                                        </p>
                                    </div>
                                </div>

                                <DialogFooter>
                                    <Button
                                        type="button"
                                        variant="outline"
                                        onClick={() =>
                                            handleEditDialogOpenChange(false)
                                        }
                                        disabled={isEditing}
                                    >
                                        Cancel
                                    </Button>
                                    <Button
                                        type="submit"
                                        disabled={isEditDisabled || isEditing}
                                    >
                                        {isEditing ? (
                                            <>
                                                <Loader2 className="mr-2 size-4 animate-spin" />
                                                Saving changes...
                                            </>
                                        ) : (
                                            'Save Changes'
                                        )}
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
                                    setSearch(event.target.value)
                                }
                                placeholder="Search by name, code, category, storage..."
                                className="pl-9"
                            />
                        </div>
                        <div className="flex items-center gap-2 self-end sm:self-auto">
                            <Label
                                htmlFor="entries-per-page"
                                className="text-sm text-muted-foreground"
                            >
                                Show entries
                            </Label>
                            <select
                                id="entries-per-page"
                                value={String(filters.per_page)}
                                onChange={handleEntriesPerPageChange}
                                className="inline-flex h-9 w-20 rounded-md border border-input bg-background px-3 text-sm shadow-xs ring-offset-background focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:outline-hidden"
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
                                        <button
                                            type="button"
                                            className="inline-flex items-center gap-1"
                                            onClick={() => handleSort('name')}
                                        >
                                            Name
                                            {renderSortIcon('name')}
                                        </button>
                                    </th>
                                    <th className="px-4 py-3 font-medium">
                                        <button
                                            type="button"
                                            className="inline-flex items-center gap-1"
                                            onClick={() => handleSort('code')}
                                        >
                                            Code
                                            {renderSortIcon('code')}
                                        </button>
                                    </th>
                                    <th className="px-4 py-3 font-medium">
                                        <button
                                            type="button"
                                            className="inline-flex items-center gap-1"
                                            onClick={() =>
                                                handleSort('category')
                                            }
                                        >
                                            Category
                                            {renderSortIcon('category')}
                                        </button>
                                    </th>
                                    <th className="px-4 py-3 font-medium">
                                        <button
                                            type="button"
                                            className="inline-flex items-center gap-1"
                                            onClick={() =>
                                                handleSort('quantity')
                                            }
                                        >
                                            Qty
                                            {renderSortIcon('quantity')}
                                        </button>
                                    </th>
                                    <th className="px-4 py-3 font-medium">
                                        <button
                                            type="button"
                                            className="inline-flex items-center gap-1"
                                            onClick={() => handleSort('unit')}
                                        >
                                            Unit
                                            {renderSortIcon('unit')}
                                        </button>
                                    </th>
                                    <th className="px-4 py-3 font-medium">
                                        <button
                                            type="button"
                                            className="inline-flex items-center gap-1"
                                            onClick={() =>
                                                handleSort('storage')
                                            }
                                        >
                                            Storage
                                            {renderSortIcon('storage')}
                                        </button>
                                    </th>
                                    <th className="px-4 py-3 font-medium">
                                        <button
                                            type="button"
                                            className="inline-flex items-center gap-1"
                                            onClick={() => handleSort('status')}
                                        >
                                            Status
                                            {renderSortIcon('status')}
                                        </button>
                                    </th>
                                    <th className="px-4 py-3 font-medium">
                                        Added by
                                    </th>
                                    <th className="px-4 py-3 text-right font-medium">
                                        Action
                                    </th>
                                </tr>
                            </thead>
                            <tbody>
                                {hasNoResults ? (
                                    <tr>
                                        <td
                                            colSpan={10}
                                            className="px-4 py-8 text-center text-muted-foreground"
                                        >
                                            {emptyMessage}
                                        </td>
                                    </tr>
                                ) : (
                                    ingredients.data.map((item, index) => (
                                        <tr
                                            key={item.id}
                                            className="border-t border-border/70"
                                        >
                                            <td className="px-4 py-3 text-muted-foreground">
                                                {(ingredients.from ?? 1) +
                                                    index}
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
                                            <td className="px-4 py-3 text-muted-foreground">
                                                {item.created_by_name ??
                                                    'System'}
                                            </td>
                                            <td className="px-4 py-3">
                                                <div className="flex items-center justify-end gap-2">
                                                    <Tooltip>
                                                        <TooltipTrigger asChild>
                                                            <Button
                                                                type="button"
                                                                variant="ghost"
                                                                size="icon"
                                                                className="size-8"
                                                                aria-label={`Edit ${item.name}`}
                                                                onClick={() =>
                                                                    openEditDialog(
                                                                        item,
                                                                    )
                                                                }
                                                            >
                                                                <Pencil className="size-4" />
                                                            </Button>
                                                        </TooltipTrigger>
                                                        <TooltipContent>
                                                            Edit
                                                        </TooltipContent>
                                                    </Tooltip>
                                                    {isAdmin ? (
                                                        <Tooltip>
                                                            <TooltipTrigger asChild>
                                                                <Button
                                                                    type="button"
                                                                    variant="ghost"
                                                                    size="icon"
                                                                    className="size-8 text-destructive hover:text-destructive"
                                                                    aria-label={`Delete ${item.name}`}
                                                                    onClick={() =>
                                                                        openDeleteDialog(
                                                                            item,
                                                                        )
                                                                    }
                                                                    disabled={
                                                                        deletingItemId ===
                                                                        item.id
                                                                    }
                                                                >
                                                                    <Trash2 className="size-4" />
                                                                </Button>
                                                            </TooltipTrigger>
                                                            <TooltipContent>
                                                                Delete
                                                            </TooltipContent>
                                                        </Tooltip>
                                                    ) : null}
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>

                    <div className="space-y-3 md:hidden">
                        {hasNoResults ? (
                            <div className="rounded-lg border border-border/70 p-5 text-center text-sm text-muted-foreground">
                                {emptyMessage}
                            </div>
                        ) : (
                            ingredients.data.map((item, index) => (
                                <div
                                    key={item.id}
                                    className="rounded-lg border border-border/70 bg-background/70 p-4"
                                >
                                    <div className="flex items-start justify-between gap-3">
                                        <div>
                                            <p className="font-medium">
                                                #{' '}
                                                {(ingredients.from ?? 1) +
                                                    index}{' '}
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
                                        <p className="col-span-2">
                                            Added by:{' '}
                                            {item.created_by_name ?? 'System'}
                                        </p>
                                    </div>
                                    <div className="mt-4 flex justify-end gap-2">
                                        <Tooltip>
                                            <TooltipTrigger asChild>
                                                <Button
                                                    type="button"
                                                    variant="outline"
                                                    size="sm"
                                                    className="gap-1"
                                                    onClick={() =>
                                                        openEditDialog(item)
                                                    }
                                                >
                                                    <Pencil className="size-3.5" />
                                                    Edit
                                                </Button>
                                            </TooltipTrigger>
                                            <TooltipContent>
                                                Edit
                                            </TooltipContent>
                                        </Tooltip>
                                        {isAdmin ? (
                                            <Tooltip>
                                                <TooltipTrigger asChild>
                                                    <Button
                                                        type="button"
                                                        variant="outline"
                                                        size="sm"
                                                        className="gap-1 text-destructive hover:text-destructive"
                                                        onClick={() =>
                                                            openDeleteDialog(
                                                                item,
                                                            )
                                                        }
                                                        disabled={
                                                            deletingItemId ===
                                                            item.id
                                                        }
                                                    >
                                                        <Trash2 className="size-3.5" />
                                                        Delete
                                                    </Button>
                                                </TooltipTrigger>
                                                <TooltipContent>
                                                    Delete
                                                </TooltipContent>
                                            </Tooltip>
                                        ) : null}
                                    </div>
                                </div>
                            ))
                        )}
                    </div>

                    <div className="flex flex-col gap-3 border-t border-border/70 pt-4 sm:flex-row sm:items-center sm:justify-between">
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <Package className="size-4" />
                            Showing {ingredients.from ?? 0}-{ingredients.to ?? 0}{' '}
                            of {ingredients.total} ingredients
                        </div>

                        <div className="flex items-center gap-2 self-end sm:self-auto">
                            <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() =>
                                    goToPage(ingredients.current_page - 1)
                                }
                                disabled={ingredients.current_page <= 1}
                            >
                                <ChevronLeft className="size-4" />
                                Prev
                            </Button>
                            <span className="text-sm text-muted-foreground">
                                Page {ingredients.current_page} of{' '}
                                {ingredients.last_page}
                            </span>
                            <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() =>
                                    goToPage(ingredients.current_page + 1)
                                }
                                disabled={
                                    ingredients.current_page >=
                                    ingredients.last_page
                                }
                            >
                                Next
                                <ChevronRight className="size-4" />
                            </Button>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {isAdmin ? (
                <Dialog
                    open={isDeleteDialogOpen}
                    onOpenChange={(open) => {
                        if (!open) {
                            closeDeleteDialog();
                        }
                    }}
                >
                    <DialogContent className="sm:max-w-md">
                        <DialogHeader>
                            <DialogTitle>Delete Ingredient</DialogTitle>
                            <DialogDescription>
                                {deleteTarget
                                    ? `Would you like to delete ${deleteTarget.name}?`
                                    : 'Would you like to delete this ingredient?'}
                            </DialogDescription>
                        </DialogHeader>
                        <DialogFooter>
                            <Button
                                type="button"
                                variant="outline"
                                onClick={closeDeleteDialog}
                                disabled={deletingItemId !== null}
                            >
                                Cancel
                            </Button>
                            <Button
                                type="button"
                                variant="destructive"
                                onClick={handleDeleteIngredient}
                                disabled={deletingItemId !== null || !deleteTarget}
                            >
                                {deletingItemId !== null ? (
                                    <>
                                        <Loader2 className="mr-2 size-4 animate-spin" />
                                        Deleting...
                                    </>
                                ) : (
                                    'Delete'
                                )}
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            ) : null}
        </AppLayout>
    );
}
