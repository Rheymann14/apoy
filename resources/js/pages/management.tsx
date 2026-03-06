import { Head, router } from '@inertiajs/react';
import {
    Building2,
    Loader2,
    Pencil,
    Plus,
    RotateCcw,
    Ruler,
    Tags,
    Trash2,
    UserCog,
} from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import type { ChangeEvent, FormEvent } from 'react';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import AppLayout from '@/layouts/app-layout';
import { cn } from '@/lib/utils';
import { dashboard } from '@/routes';
import type { BreadcrumbItem } from '@/types';

type ManagementTab = 'account' | 'category' | 'unit' | 'storage';

type RoleOption = {
    id: number;
    name: string;
    slug: string;
};

type AccountUser = {
    id: number;
    name: string;
    email: string;
    role: string;
    role_slug: string;
};

type LocalManagementItem = {
    id: number;
    name: string;
    created_by: number | null;
    created_by_name: string | null;
};

type AccountForm = {
    name: string;
    email: string;
    role: string;
};

type DeleteDialogTarget = {
    type: ManagementTab;
    id: number;
    name: string;
};

type PaginatedData<T> = {
    data: T[];
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
    from: number | null;
    to: number | null;
};

type ManagementFilters = {
    active_tab: ManagementTab;
    account_search: string;
    account_per_page: number;
    category_search: string;
    category_per_page: number;
    unit_search: string;
    unit_per_page: number;
    storage_search: string;
    storage_per_page: number;
};

type ManagementPageProps = {
    roles: RoleOption[];
    users: PaginatedData<AccountUser>;
    categories: PaginatedData<LocalManagementItem>;
    units: PaginatedData<LocalManagementItem>;
    storages: PaginatedData<LocalManagementItem>;
    filters: ManagementFilters;
};

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Dashboard',
        href: dashboard(),
    },
    {
        title: 'Management',
        href: '/management',
    },
];

const tabs: {
    value: ManagementTab;
    label: string;
    description: string;
    inputLabel: string;
    searchPlaceholder: string;
}[] = [
    {
        value: 'account',
        label: 'Account',
        description: 'Manage user records and role access.',
        inputLabel: 'Account name',
        searchPlaceholder: 'Search name, email, or role...',
    },
    {
        value: 'category',
        label: 'Category',
        description: 'Define ingredient categories used in inventory.',
        inputLabel: 'Category name',
        searchPlaceholder: 'Search category or added by...',
    },
    {
        value: 'unit',
        label: 'Unit',
        description: 'Maintain measurement units for item quantities.',
        inputLabel: 'Unit name',
        searchPlaceholder: 'Search unit or added by...',
    },
    {
        value: 'storage',
        label: 'Storage',
        description: 'Configure storage areas and stock locations.',
        inputLabel: 'Storage name',
        searchPlaceholder: 'Search storage or added by...',
    },
];

const tabIcons = {
    account: UserCog,
    category: Tags,
    unit: Ruler,
    storage: Building2,
} as const;

const entriesPerPageOptions = [10, 50, 100] as const;

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

const getRoleBadgeClassName = (roleSlug: string) => {
    if (roleSlug === 'admin') {
        return 'rounded-full border-blue-300 bg-blue-100 text-blue-800 dark:border-blue-500/60 dark:bg-blue-500/20 dark:text-blue-200';
    }

    return 'rounded-full border-emerald-300 bg-emerald-100 text-emerald-800 dark:border-emerald-500/60 dark:bg-emerald-500/20 dark:text-emerald-200';
};

export default function Management({
    roles,
    users,
    categories,
    units,
    storages,
    filters,
}: ManagementPageProps) {
    const activeTab = filters.active_tab;
    const activeTabData = tabs.find((tab) => tab.value === activeTab) ?? tabs[0];
    const ActiveIcon = tabIcons[activeTab];
    const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
    const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
    const [addLocalValue, setAddLocalValue] = useState('');
    const [editLocalValue, setEditLocalValue] = useState('');
    const [editLocalTarget, setEditLocalTarget] = useState<{
        tab: Exclude<ManagementTab, 'account'>;
        id: number;
    } | null>(null);
    const [addAccountForm, setAddAccountForm] = useState<AccountForm>({
        name: '',
        email: '',
        role: 'employee',
    });
    const [editAccountForm, setEditAccountForm] = useState<AccountForm>({
        name: '',
        email: '',
        role: 'employee',
    });
    const [editAccountUserId, setEditAccountUserId] = useState<number | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [resettingUserId, setResettingUserId] = useState<number | null>(null);
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
    const [deleteDialogTarget, setDeleteDialogTarget] =
        useState<DeleteDialogTarget | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);
    const [accountSearch, setAccountSearch] = useState(filters.account_search);
    const [categorySearch, setCategorySearch] = useState(filters.category_search);
    const [unitSearch, setUnitSearch] = useState(filters.unit_search);
    const [storageSearch, setStorageSearch] = useState(filters.storage_search);

    useEffect(() => setAccountSearch(filters.account_search), [filters.account_search]);
    useEffect(() => setCategorySearch(filters.category_search), [filters.category_search]);
    useEffect(() => setUnitSearch(filters.unit_search), [filters.unit_search]);
    useEffect(() => setStorageSearch(filters.storage_search), [filters.storage_search]);

    const defaultRoleSlug = useMemo(() => {
        const employeeRole = roles.find((role) => role.slug === 'employee');
        return employeeRole?.slug ?? roles[0]?.slug ?? 'employee';
    }, [roles]);

    useEffect(() => {
        setAddAccountForm((current) => ({ ...current, role: defaultRoleSlug }));
        setEditAccountForm((current) => ({
            ...current,
            role: current.role || defaultRoleSlug,
        }));
    }, [defaultRoleSlug]);

    const requestManagement = (params: Record<string, string | number | undefined>) => {
        router.get(
            '/management',
            {
                active_tab: filters.active_tab,
                account_search: filters.account_search || undefined,
                account_per_page: filters.account_per_page,
                category_search: filters.category_search || undefined,
                category_per_page: filters.category_per_page,
                unit_search: filters.unit_search || undefined,
                unit_per_page: filters.unit_per_page,
                storage_search: filters.storage_search || undefined,
                storage_per_page: filters.storage_per_page,
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
        if (activeTab !== 'account' || accountSearch.trim() === filters.account_search) {
            return;
        }

        const timeoutId = window.setTimeout(() => {
            requestManagement({
                active_tab: 'account',
                account_search: accountSearch.trim() || undefined,
                account_page: 1,
            });
        }, 300);

        return () => window.clearTimeout(timeoutId);
    }, [accountSearch, activeTab, filters.account_search]);

    useEffect(() => {
        if (activeTab !== 'category' || categorySearch.trim() === filters.category_search) {
            return;
        }

        const timeoutId = window.setTimeout(() => {
            requestManagement({
                active_tab: 'category',
                category_search: categorySearch.trim() || undefined,
                category_page: 1,
            });
        }, 300);

        return () => window.clearTimeout(timeoutId);
    }, [categorySearch, activeTab, filters.category_search]);

    useEffect(() => {
        if (activeTab !== 'unit' || unitSearch.trim() === filters.unit_search) {
            return;
        }

        const timeoutId = window.setTimeout(() => {
            requestManagement({
                active_tab: 'unit',
                unit_search: unitSearch.trim() || undefined,
                unit_page: 1,
            });
        }, 300);

        return () => window.clearTimeout(timeoutId);
    }, [activeTab, filters.unit_search, unitSearch]);

    useEffect(() => {
        if (
            activeTab !== 'storage' ||
            storageSearch.trim() === filters.storage_search
        ) {
            return;
        }

        const timeoutId = window.setTimeout(() => {
            requestManagement({
                active_tab: 'storage',
                storage_search: storageSearch.trim() || undefined,
                storage_page: 1,
            });
        }, 300);

        return () => window.clearTimeout(timeoutId);
    }, [activeTab, filters.storage_search, storageSearch]);

    const activeRecords =
        activeTab === 'account'
            ? users
            : activeTab === 'category'
              ? categories
              : activeTab === 'unit'
                ? units
                : storages;
    const activeLocalRecords =
        activeTab === 'category'
            ? categories
            : activeTab === 'unit'
              ? units
              : storages;
    const activeSearch =
        activeTab === 'account'
            ? accountSearch
            : activeTab === 'category'
              ? categorySearch
              : activeTab === 'unit'
                ? unitSearch
                : storageSearch;
    const activePerPage =
        activeTab === 'account'
            ? filters.account_per_page
            : activeTab === 'category'
              ? filters.category_per_page
              : activeTab === 'unit'
                ? filters.unit_per_page
                : filters.storage_per_page;

    const closeAddDialog = () => {
        setIsAddDialogOpen(false);
        setAddLocalValue('');
        setAddAccountForm({ name: '', email: '', role: defaultRoleSlug });
    };

    const closeEditDialog = () => {
        setIsEditDialogOpen(false);
        setEditLocalValue('');
        setEditLocalTarget(null);
        setEditAccountUserId(null);
        setEditAccountForm({ name: '', email: '', role: defaultRoleSlug });
    };

    const closeDeleteDialog = () => {
        setIsDeleteDialogOpen(false);
        setDeleteDialogTarget(null);
    };

    const handleTabChange = (tab: ManagementTab) => {
        closeAddDialog();
        closeEditDialog();
        requestManagement({
            active_tab: tab,
        });
    };

    const openAddDialog = () => {
        if (activeTab === 'account') {
            setAddAccountForm({ name: '', email: '', role: defaultRoleSlug });
        } else {
            setAddLocalValue('');
        }

        setIsAddDialogOpen(true);
    };

    const openEditLocalDialog = (
        item: LocalManagementItem,
        tab: Exclude<ManagementTab, 'account'>,
    ) => {
        setEditLocalTarget({ tab, id: item.id });
        setEditLocalValue(item.name);
        setIsEditDialogOpen(true);
    };

    const openEditAccountDialog = (user: AccountUser) => {
        setEditAccountUserId(user.id);
        setEditAccountForm({
            name: user.name,
            email: user.email,
            role: user.role_slug || defaultRoleSlug,
        });
        setIsEditDialogOpen(true);
    };

    const handleEntriesPerPageChange = (
        event: ChangeEvent<HTMLSelectElement>,
    ) => {
        const nextPerPage = Number.parseInt(event.target.value, 10);

        if (activeTab === 'account') {
            requestManagement({
                active_tab: 'account',
                account_per_page: nextPerPage,
                account_page: 1,
            });
            return;
        }

        if (activeTab === 'category') {
            requestManagement({
                active_tab: 'category',
                category_per_page: nextPerPage,
                category_page: 1,
            });
            return;
        }

        if (activeTab === 'unit') {
            requestManagement({
                active_tab: 'unit',
                unit_per_page: nextPerPage,
                unit_page: 1,
            });
            return;
        }

        requestManagement({
            active_tab: 'storage',
            storage_per_page: nextPerPage,
            storage_page: 1,
        });
    };

    const goToPage = (page: number) => {
        const pageParam =
            activeTab === 'account'
                ? 'account_page'
                : activeTab === 'category'
                  ? 'category_page'
                  : activeTab === 'unit'
                    ? 'unit_page'
                    : 'storage_page';

        requestManagement({
            active_tab: activeTab,
            [pageParam]: page,
        });
    };

    const handleAdd = (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();

        if (activeTab === 'account') {
            setIsSubmitting(true);
            router.post('/management/users', addAccountForm, {
                preserveScroll: true,
                onSuccess: () => {
                    toast.success('User created. Default password is set to apoy1234.');
                    closeAddDialog();
                },
                onError: (errors) => toast.error(getFirstErrorMessage(errors)),
                onFinish: () => setIsSubmitting(false),
            });
            return;
        }

        const nextName = addLocalValue.trim();
        if (!nextName) {
            return;
        }

        const endpoint =
            activeTab === 'category'
                ? '/management/categories'
                : activeTab === 'unit'
                  ? '/management/units'
                  : '/management/storages';
        const itemLabel =
            activeTab === 'category'
                ? 'Category'
                : activeTab === 'unit'
                  ? 'Unit'
                  : 'Storage';

        setIsSubmitting(true);
        router.post(endpoint, { name: nextName }, {
            preserveScroll: true,
            onSuccess: () => {
                toast.success(`${itemLabel} created successfully.`);
                closeAddDialog();
            },
            onError: (errors) => toast.error(getFirstErrorMessage(errors)),
            onFinish: () => setIsSubmitting(false),
        });
    };

    const handleEdit = (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();

        if (activeTab === 'account') {
            if (editAccountUserId === null) {
                return;
            }

            setIsSubmitting(true);
            router.put(`/management/users/${editAccountUserId}`, editAccountForm, {
                preserveScroll: true,
                onSuccess: () => {
                    toast.success('User updated successfully.');
                    closeEditDialog();
                },
                onError: (errors) => toast.error(getFirstErrorMessage(errors)),
                onFinish: () => setIsSubmitting(false),
            });
            return;
        }

        if (!editLocalTarget) {
            return;
        }

        const nextName = editLocalValue.trim();
        if (!nextName) {
            return;
        }

        const endpoint =
            editLocalTarget.tab === 'category'
                ? `/management/categories/${editLocalTarget.id}`
                : editLocalTarget.tab === 'unit'
                  ? `/management/units/${editLocalTarget.id}`
                  : `/management/storages/${editLocalTarget.id}`;
        const itemLabel =
            editLocalTarget.tab === 'category'
                ? 'Category'
                : editLocalTarget.tab === 'unit'
                  ? 'Unit'
                  : 'Storage';

        setIsSubmitting(true);
        router.put(endpoint, { name: nextName }, {
            preserveScroll: true,
            onSuccess: () => {
                toast.success(`${itemLabel} updated successfully.`);
                closeEditDialog();
            },
            onError: (errors) => toast.error(getFirstErrorMessage(errors)),
            onFinish: () => setIsSubmitting(false),
        });
    };

    const openDeleteDialog = (target: DeleteDialogTarget) => {
        setDeleteDialogTarget(target);
        setIsDeleteDialogOpen(true);
    };

    const handleResetPassword = (id: number) => {
        const toastId = toast.loading('Resetting password...');
        setResettingUserId(id);
        router.put(`/management/users/${id}/reset-password`, {}, {
            preserveScroll: true,
            onSuccess: () =>
                toast.success('Password reset successfully. Default password is apoy1234.', {
                    id: toastId,
                }),
            onError: (errors) =>
                toast.error(getFirstErrorMessage(errors), {
                    id: toastId,
                }),
            onFinish: () => setResettingUserId(null),
        });
    };

    const handleConfirmDelete = () => {
        if (!deleteDialogTarget) {
            return;
        }

        setIsDeleting(true);
        const endpoint =
            deleteDialogTarget.type === 'account'
                ? `/management/users/${deleteDialogTarget.id}`
                : deleteDialogTarget.type === 'category'
                  ? `/management/categories/${deleteDialogTarget.id}`
                  : deleteDialogTarget.type === 'unit'
                    ? `/management/units/${deleteDialogTarget.id}`
                    : `/management/storages/${deleteDialogTarget.id}`;
        const successMessage =
            deleteDialogTarget.type === 'account'
                ? 'User deleted successfully.'
                : deleteDialogTarget.type === 'category'
                  ? 'Category deleted successfully.'
                  : deleteDialogTarget.type === 'unit'
                    ? 'Unit deleted successfully.'
                    : 'Storage deleted successfully.';

        router.delete(endpoint, {
            preserveScroll: true,
            onSuccess: () => {
                toast.success(successMessage);
                closeDeleteDialog();
            },
            onError: (errors) => toast.error(getFirstErrorMessage(errors)),
            onFinish: () => setIsDeleting(false),
        });
    };

    const isAddDisabled =
        activeTab === 'account'
            ? !addAccountForm.name.trim() ||
              !addAccountForm.email.trim() ||
              !addAccountForm.role
            : !addLocalValue.trim();
    const isEditDisabled =
        activeTab === 'account'
            ? editAccountUserId === null ||
              !editAccountForm.name.trim() ||
              !editAccountForm.email.trim() ||
              !editAccountForm.role
            : !editLocalValue.trim() || !editLocalTarget;

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Management" />
            <Card className="border-border/70 bg-card/90">
                <CardHeader>
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                        <div>
                            <CardTitle className="text-2xl tracking-tight">
                                Management
                            </CardTitle>
                            <CardDescription className="mt-1">
                                Configure system records for account, category,
                                unit, and storage.
                            </CardDescription>
                        </div>
                        <Badge variant="secondary" className="rounded-full">
                            Admin
                        </Badge>
                    </div>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="flex flex-wrap gap-2">
                        {tabs.map((tab) => (
                            <Button
                                key={tab.value}
                                type="button"
                                variant={activeTab === tab.value ? 'default' : 'outline'}
                                onClick={() => handleTabChange(tab.value)}
                                className="rounded-full"
                            >
                                {tab.label}
                            </Button>
                        ))}
                    </div>
                    <div className="rounded-lg border border-border/70 bg-background/70 p-5">
                        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                            <div className="flex items-center gap-2">
                                <ActiveIcon className="size-5 text-muted-foreground" />
                                <h2 className="text-lg font-semibold">
                                    {activeTabData.label}
                                </h2>
                            </div>
                            <Button
                                type="button"
                                className="w-full gap-2 sm:w-auto"
                                onClick={openAddDialog}
                            >
                                <Plus className="size-4" />
                                Add {activeTabData.label}
                            </Button>
                        </div>
                        <p className="mt-2 text-sm text-muted-foreground">
                            {activeTabData.description}
                        </p>

                        <div className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                            <Input
                                value={activeSearch}
                                onChange={(event) => {
                                    if (activeTab === 'account') {
                                        setAccountSearch(event.target.value);
                                        return;
                                    }

                                    if (activeTab === 'category') {
                                        setCategorySearch(event.target.value);
                                        return;
                                    }

                                    if (activeTab === 'unit') {
                                        setUnitSearch(event.target.value);
                                        return;
                                    }

                                    setStorageSearch(event.target.value);
                                }}
                                placeholder={activeTabData.searchPlaceholder}
                                className="sm:max-w-sm"
                            />
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                <span>Show</span>
                                <select
                                    value={String(activePerPage)}
                                    onChange={handleEntriesPerPageChange}
                                    className="border-input bg-background ring-offset-background focus-visible:ring-ring inline-flex h-9 rounded-md border px-2 text-sm shadow-xs focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-hidden"
                                >
                                    {entriesPerPageOptions.map((option) => (
                                        <option key={option} value={option}>
                                            {option}
                                        </option>
                                    ))}
                                </select>
                                <span>entries</span>
                            </div>
                        </div>
                        <div className="mt-4 overflow-x-auto rounded-lg border border-border/70">
                            <table className="min-w-full text-sm">
                                {activeTab === 'account' ? (
                                    <>
                                        <thead className="bg-muted/40 text-left">
                                            <tr>
                                                <th className="px-4 py-3 font-medium">Name</th>
                                                <th className="px-4 py-3 font-medium">Email</th>
                                                <th className="px-4 py-3 font-medium">Role</th>
                                                <th className="px-4 py-3 text-right font-medium">Action</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {users.data.length === 0 ? (
                                                <tr>
                                                    <td colSpan={4} className="px-4 py-8 text-center text-muted-foreground">
                                                        {filters.account_search
                                                            ? 'No matching accounts found.'
                                                            : 'No account entries found.'}
                                                    </td>
                                                </tr>
                                            ) : (
                                                users.data.map((user) => (
                                                    <tr key={user.id} className="border-t border-border/70">
                                                        <td className="px-4 py-3">{user.name}</td>
                                                        <td className="px-4 py-3 text-muted-foreground">{user.email}</td>
                                                        <td className="px-4 py-3">
                                                            <Badge
                                                                variant="outline"
                                                                className={cn(getRoleBadgeClassName(user.role_slug))}
                                                            >
                                                                {user.role}
                                                            </Badge>
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
                                                                            aria-label={`Reset password for ${user.name}`}
                                                                            onClick={() => handleResetPassword(user.id)}
                                                                            disabled={resettingUserId !== null}
                                                                        >
                                                                            {resettingUserId === user.id ? (
                                                                                <Loader2 className="size-4 animate-spin" />
                                                                            ) : (
                                                                                <RotateCcw className="size-4" />
                                                                            )}
                                                                        </Button>
                                                                    </TooltipTrigger>
                                                                    <TooltipContent>Reset password</TooltipContent>
                                                                </Tooltip>
                                                                <Tooltip>
                                                                    <TooltipTrigger asChild>
                                                                        <Button
                                                                            type="button"
                                                                            variant="ghost"
                                                                            size="icon"
                                                                            className="size-8"
                                                                            aria-label={`Edit ${user.name}`}
                                                                            onClick={() => openEditAccountDialog(user)}
                                                                        >
                                                                            <Pencil className="size-4" />
                                                                        </Button>
                                                                    </TooltipTrigger>
                                                                    <TooltipContent>Edit</TooltipContent>
                                                                </Tooltip>
                                                                <Tooltip>
                                                                    <TooltipTrigger asChild>
                                                                        <Button
                                                                            type="button"
                                                                            variant="ghost"
                                                                            size="icon"
                                                                            className="size-8 text-destructive hover:text-destructive"
                                                                            aria-label={`Delete ${user.name}`}
                                                                            onClick={() =>
                                                                                openDeleteDialog({
                                                                                    type: 'account',
                                                                                    id: user.id,
                                                                                    name: user.name,
                                                                                })
                                                                            }
                                                                        >
                                                                            <Trash2 className="size-4" />
                                                                        </Button>
                                                                    </TooltipTrigger>
                                                                    <TooltipContent>Delete</TooltipContent>
                                                                </Tooltip>
                                                            </div>
                                                        </td>
                                                    </tr>
                                                ))
                                            )}
                                        </tbody>
                                    </>
                                ) : (
                                    <>
                                        <thead className="bg-muted/40 text-left">
                                            <tr>
                                                <th className="px-4 py-3 font-medium">
                                                    {activeTabData.label}
                                                </th>
                                                <th className="px-4 py-3 font-medium">Added by</th>
                                                <th className="px-4 py-3 text-right font-medium">Action</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {activeLocalRecords.data.length === 0 ? (
                                                <tr>
                                                    <td colSpan={3} className="px-4 py-8 text-center text-muted-foreground">
                                                        {activeSearch.trim()
                                                            ? `No matching ${activeTabData.label.toLowerCase()} found.`
                                                            : `No ${activeTabData.label.toLowerCase()} entries found.`}
                                                    </td>
                                                </tr>
                                            ) : (
                                                activeLocalRecords.data.map((item) => (
                                                    <tr key={item.id} className="border-t border-border/70">
                                                        <td className="px-4 py-3">{item.name}</td>
                                                        <td className="px-4 py-3 text-muted-foreground">
                                                            {item.created_by_name ?? 'System'}
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
                                                                                openEditLocalDialog(
                                                                                    item,
                                                                                    activeTab as Exclude<ManagementTab, 'account'>,
                                                                                )
                                                                            }
                                                                        >
                                                                            <Pencil className="size-4" />
                                                                        </Button>
                                                                    </TooltipTrigger>
                                                                    <TooltipContent>Edit</TooltipContent>
                                                                </Tooltip>
                                                                <Tooltip>
                                                                    <TooltipTrigger asChild>
                                                                        <Button
                                                                            type="button"
                                                                            variant="ghost"
                                                                            size="icon"
                                                                            className="size-8 text-destructive hover:text-destructive"
                                                                            aria-label={`Delete ${item.name}`}
                                                                            onClick={() =>
                                                                                openDeleteDialog({
                                                                                    type: activeTab,
                                                                                    id: item.id,
                                                                                    name: item.name,
                                                                                })
                                                                            }
                                                                        >
                                                                            <Trash2 className="size-4" />
                                                                        </Button>
                                                                    </TooltipTrigger>
                                                                    <TooltipContent>Delete</TooltipContent>
                                                                </Tooltip>
                                                            </div>
                                                        </td>
                                                    </tr>
                                                ))
                                            )}
                                        </tbody>
                                    </>
                                )}
                            </table>
                        </div>

                        <div className="mt-3 flex flex-col gap-3 text-sm text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
                            <p>
                                Showing {activeRecords.from ?? 0} to {activeRecords.to ?? 0} of{' '}
                                {activeRecords.total} entries
                            </p>
                            <div className="flex items-center gap-2">
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={() => goToPage(activeRecords.current_page - 1)}
                                    disabled={activeRecords.current_page <= 1}
                                >
                                    Previous
                                </Button>
                                <span className="min-w-24 text-center">
                                    Page {activeRecords.current_page} of {activeRecords.last_page}
                                </span>
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={() => goToPage(activeRecords.current_page + 1)}
                                    disabled={activeRecords.current_page >= activeRecords.last_page}
                                >
                                    Next
                                </Button>
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>
            <Dialog
                open={isAddDialogOpen}
                onOpenChange={(open) => (open ? setIsAddDialogOpen(true) : closeAddDialog())}
            >
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle>Add {activeTabData.label}</DialogTitle>
                        <DialogDescription>
                            {activeTab === 'account'
                                ? 'Create a new account. Default password will be set to apoy1234.'
                                : `Create a new ${activeTabData.label.toLowerCase()} entry.`}
                        </DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handleAdd} className="space-y-4">
                        {activeTab === 'account' ? (
                            <>
                                <div className="space-y-2">
                                    <Label htmlFor="account-add-name">Name</Label>
                                    <Input
                                        id="account-add-name"
                                        value={addAccountForm.name}
                                        onChange={(event) =>
                                            setAddAccountForm((current) => ({
                                                ...current,
                                                name: event.target.value,
                                            }))
                                        }
                                        placeholder="Enter full name"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="account-add-email">Email</Label>
                                    <Input
                                        id="account-add-email"
                                        type="email"
                                        value={addAccountForm.email}
                                        onChange={(event) =>
                                            setAddAccountForm((current) => ({
                                                ...current,
                                                email: event.target.value,
                                            }))
                                        }
                                        placeholder="Enter email address"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="account-add-role">Role</Label>
                                    <select
                                        id="account-add-role"
                                        value={addAccountForm.role}
                                        onChange={(event) =>
                                            setAddAccountForm((current) => ({
                                                ...current,
                                                role: event.target.value,
                                            }))
                                        }
                                        className="border-input bg-background ring-offset-background focus-visible:ring-ring inline-flex h-9 w-full rounded-md border px-3 text-sm shadow-xs focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-hidden"
                                    >
                                        {roles.map((role) => (
                                            <option key={role.id} value={role.slug}>
                                                {role.name}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            </>
                        ) : (
                            <div className="space-y-2">
                                <Label htmlFor="management-add-name">
                                    {activeTabData.inputLabel}
                                </Label>
                                <Input
                                    id="management-add-name"
                                    value={addLocalValue}
                                    onChange={(event) => setAddLocalValue(event.target.value)}
                                    placeholder={`Enter ${activeTabData.label.toLowerCase()}...`}
                                />
                            </div>
                        )}
                        <DialogFooter>
                            <Button type="button" variant="outline" onClick={closeAddDialog}>
                                Cancel
                            </Button>
                            <Button type="submit" disabled={isSubmitting || isAddDisabled}>
                                {isSubmitting ? (
                                    <>
                                        <Loader2 className="mr-2 size-4 animate-spin" />
                                        Saving...
                                    </>
                                ) : (
                                    'Save'
                                )}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            <Dialog
                open={isEditDialogOpen}
                onOpenChange={(open) => (open ? setIsEditDialogOpen(true) : closeEditDialog())}
            >
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle>Edit {activeTabData.label}</DialogTitle>
                        <DialogDescription>
                            {activeTab === 'account'
                                ? 'Update this account record.'
                                : `Update this ${activeTabData.label.toLowerCase()} entry.`}
                        </DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handleEdit} className="space-y-4">
                        {activeTab === 'account' ? (
                            <>
                                <div className="space-y-2">
                                    <Label htmlFor="account-edit-name">Name</Label>
                                    <Input
                                        id="account-edit-name"
                                        value={editAccountForm.name}
                                        onChange={(event) =>
                                            setEditAccountForm((current) => ({
                                                ...current,
                                                name: event.target.value,
                                            }))
                                        }
                                        placeholder="Enter full name"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="account-edit-email">Email</Label>
                                    <Input
                                        id="account-edit-email"
                                        type="email"
                                        value={editAccountForm.email}
                                        onChange={(event) =>
                                            setEditAccountForm((current) => ({
                                                ...current,
                                                email: event.target.value,
                                            }))
                                        }
                                        placeholder="Enter email address"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="account-edit-role">Role</Label>
                                    <select
                                        id="account-edit-role"
                                        value={editAccountForm.role}
                                        onChange={(event) =>
                                            setEditAccountForm((current) => ({
                                                ...current,
                                                role: event.target.value,
                                            }))
                                        }
                                        className="border-input bg-background ring-offset-background focus-visible:ring-ring inline-flex h-9 w-full rounded-md border px-3 text-sm shadow-xs focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-hidden"
                                    >
                                        {roles.map((role) => (
                                            <option key={role.id} value={role.slug}>
                                                {role.name}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            </>
                        ) : (
                            <div className="space-y-2">
                                <Label htmlFor="management-edit-name">
                                    {activeTabData.inputLabel}
                                </Label>
                                <Input
                                    id="management-edit-name"
                                    value={editLocalValue}
                                    onChange={(event) => setEditLocalValue(event.target.value)}
                                    placeholder={`Enter ${activeTabData.label.toLowerCase()}...`}
                                />
                            </div>
                        )}
                        <DialogFooter>
                            <Button type="button" variant="outline" onClick={closeEditDialog}>
                                Cancel
                            </Button>
                            <Button type="submit" disabled={isSubmitting || isEditDisabled}>
                                {isSubmitting ? (
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
                        <DialogTitle>
                            Delete{' '}
                            {deleteDialogTarget?.type === 'account'
                                ? 'Account'
                                : deleteDialogTarget?.type === 'category'
                                  ? 'Category'
                                  : deleteDialogTarget?.type === 'unit'
                                    ? 'Unit'
                                    : 'Storage'}
                        </DialogTitle>
                        <DialogDescription>
                            {deleteDialogTarget
                                ? `Would you like to delete ${deleteDialogTarget.name}?`
                                : 'Would you like to delete this item?'}
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button
                            type="button"
                            variant="outline"
                            onClick={closeDeleteDialog}
                            disabled={isDeleting}
                        >
                            Cancel
                        </Button>
                        <Button
                            type="button"
                            variant="destructive"
                            onClick={handleConfirmDelete}
                            disabled={isDeleting || !deleteDialogTarget}
                        >
                            {isDeleting ? (
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
        </AppLayout>
    );
}
