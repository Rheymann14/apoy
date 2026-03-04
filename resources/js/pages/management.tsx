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
import type { FormEvent } from 'react';
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
type LocalTab = Exclude<ManagementTab, 'account'>;

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
};

type AccountForm = {
    name: string;
    email: string;
    role: string;
};

type ManagementPageProps = {
    roles: RoleOption[];
    users: AccountUser[];
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
    initialItems: string[];
}[] = [
    {
        value: 'account',
        label: 'Account',
        description: 'Manage user records and role access.',
        inputLabel: 'Account name',
        initialItems: [],
    },
    {
        value: 'category',
        label: 'Category',
        description: 'Define ingredient categories used in inventory.',
        inputLabel: 'Category name',
        initialItems: ['Produce', 'Meat', 'Dry Goods'],
    },
    {
        value: 'unit',
        label: 'Unit',
        description: 'Maintain measurement units for item quantities.',
        inputLabel: 'Unit name',
        initialItems: ['kg', 'L', 'pack'],
    },
    {
        value: 'storage',
        label: 'Storage',
        description: 'Configure storage areas and stock locations.',
        inputLabel: 'Storage name',
        initialItems: ['Walk-in Cooler', 'Freezer A', 'Dry Storage'],
    },
];

const tabIcons = {
    account: UserCog,
    category: Tags,
    unit: Ruler,
    storage: Building2,
} as const;

const initialLocalTabItems = tabs
    .filter((tab): tab is (typeof tabs)[number] & { value: LocalTab } => tab.value !== 'account')
    .reduce(
        (accumulator, tab) => {
            accumulator[tab.value] = tab.initialItems.map((name, index) => ({
                id: index + 1,
                name,
            }));
            return accumulator;
        },
        {} as Record<LocalTab, LocalManagementItem[]>,
    );

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

export default function Management({ roles, users }: ManagementPageProps) {
    const [activeTab, setActiveTab] = useState<ManagementTab>('account');
    const [localTabItems, setLocalTabItems] =
        useState<Record<LocalTab, LocalManagementItem[]>>(initialLocalTabItems);
    const [accountUsers, setAccountUsers] = useState<AccountUser[]>(users);
    const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
    const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
    const [addLocalValue, setAddLocalValue] = useState('');
    const [editLocalValue, setEditLocalValue] = useState('');
    const [editLocalTarget, setEditLocalTarget] = useState<{
        tab: LocalTab;
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
    const [accountSearch, setAccountSearch] = useState('');
    const [accountPage, setAccountPage] = useState(1);
    const [accountPageSize, setAccountPageSize] = useState(10);

    useEffect(() => {
        setAccountUsers(users);
    }, [users]);

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

    const activeTabData = useMemo(
        () => tabs.find((tab) => tab.value === activeTab) ?? tabs[0],
        [activeTab],
    );
    const ActiveIcon = tabIcons[activeTabData.value];
    const isAccountTab = activeTab === 'account';
    const activeLocalItems = !isAccountTab ? localTabItems[activeTab] : [];
    const filteredAccountUsers = useMemo(() => {
        const query = accountSearch.trim().toLowerCase();
        if (!query) {
            return accountUsers;
        }

        return accountUsers.filter((user) => {
            const searchable = `${user.name} ${user.email} ${user.role}`.toLowerCase();
            return searchable.includes(query);
        });
    }, [accountUsers, accountSearch]);
    const totalAccountPages = useMemo(
        () => Math.max(1, Math.ceil(filteredAccountUsers.length / accountPageSize)),
        [filteredAccountUsers.length, accountPageSize],
    );
    const paginatedAccountUsers = useMemo(() => {
        const startIndex = (accountPage - 1) * accountPageSize;
        return filteredAccountUsers.slice(startIndex, startIndex + accountPageSize);
    }, [filteredAccountUsers, accountPage, accountPageSize]);
    const accountEntryStart =
        filteredAccountUsers.length === 0 ? 0 : (accountPage - 1) * accountPageSize + 1;
    const accountEntryEnd =
        filteredAccountUsers.length === 0
            ? 0
            : Math.min(accountPage * accountPageSize, filteredAccountUsers.length);

    useEffect(() => {
        setAccountPage((currentPage) => Math.min(currentPage, totalAccountPages));
    }, [totalAccountPages]);

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

    const handleTabChange = (tab: ManagementTab) => {
        setActiveTab(tab);
        closeAddDialog();
        closeEditDialog();
    };

    const openAddDialog = () => {
        if (isAccountTab) {
            setAddAccountForm({ name: '', email: '', role: defaultRoleSlug });
        } else {
            setAddLocalValue('');
        }
        setIsAddDialogOpen(true);
    };

    const openEditLocalDialog = (item: LocalManagementItem) => {
        if (activeTab === 'account') {
            return;
        }
        setEditLocalTarget({ tab: activeTab, id: item.id });
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

    const handleAdd = (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();

        if (isAccountTab) {
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

        setLocalTabItems((current) => {
            const nextId =
                current[activeTab].reduce((maxId, item) => Math.max(maxId, item.id), 0) + 1;

            return {
                ...current,
                [activeTab]: [{ id: nextId, name: nextName }, ...current[activeTab]],
            };
        });
        closeAddDialog();
    };

    const handleEdit = (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();

        if (isAccountTab) {
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

        setLocalTabItems((current) => ({
            ...current,
            [editLocalTarget.tab]: current[editLocalTarget.tab].map((item) =>
                item.id === editLocalTarget.id ? { ...item, name: nextName } : item,
            ),
        }));
        closeEditDialog();
    };

    const handleDeleteLocal = (id: number) => {
        if (activeTab === 'account') {
            return;
        }
        setLocalTabItems((current) => ({
            ...current,
            [activeTab]: current[activeTab].filter((item) => item.id !== id),
        }));
    };

    const handleDeleteAccount = (id: number) => {
        router.delete(`/management/users/${id}`, {
            preserveScroll: true,
            onSuccess: () => toast.success('User deleted successfully.'),
            onError: (errors) => toast.error(getFirstErrorMessage(errors)),
        });
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

    const isAddDisabled = isAccountTab
        ? !addAccountForm.name.trim() ||
          !addAccountForm.email.trim() ||
          !addAccountForm.role
        : !addLocalValue.trim();

    const isEditDisabled = isAccountTab
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
                        {isAccountTab ? (
                            <div className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                                <Input
                                    value={accountSearch}
                                    onChange={(event) => {
                                        setAccountSearch(event.target.value);
                                        setAccountPage(1);
                                    }}
                                    placeholder="Search name, email, or role..."
                                    className="sm:max-w-sm"
                                />
                                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                    <span>Show</span>
                                    <select
                                        value={accountPageSize}
                                        onChange={(event) => {
                                            setAccountPageSize(Number(event.target.value));
                                            setAccountPage(1);
                                        }}
                                        className="border-input bg-background ring-offset-background focus-visible:ring-ring inline-flex h-9 rounded-md border px-2 text-sm shadow-xs focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-hidden"
                                    >
                                        <option value={10}>10</option>
                                        <option value={50}>50</option>
                                        <option value={100}>100</option>
                                    </select>
                                    <span>entries</span>
                                </div>
                            </div>
                        ) : null}

                        <div className="mt-4 overflow-x-auto rounded-lg border border-border/70">
                            <table className="min-w-full text-sm">
                                {isAccountTab ? (
                                    <>
                                        <thead className="bg-muted/40 text-left">
                                            <tr>
                                                <th className="px-4 py-3 font-medium">
                                                    Name
                                                </th>
                                                <th className="px-4 py-3 font-medium">
                                                    Email
                                                </th>
                                                <th className="px-4 py-3 font-medium">
                                                    Role
                                                </th>
                                                <th className="px-4 py-3 text-right font-medium">
                                                    Action
                                                </th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {accountUsers.length === 0 ? (
                                                <tr>
                                                    <td
                                                        colSpan={4}
                                                        className="px-4 py-8 text-center text-muted-foreground"
                                                    >
                                                        No account entries found.
                                                    </td>
                                                </tr>
                                            ) : filteredAccountUsers.length === 0 ? (
                                                <tr>
                                                    <td
                                                        colSpan={4}
                                                        className="px-4 py-8 text-center text-muted-foreground"
                                                    >
                                                        No matching accounts found.
                                                    </td>
                                                </tr>
                                            ) : (
                                                paginatedAccountUsers.map((user) => (
                                                    <tr
                                                        key={user.id}
                                                        className="border-t border-border/70"
                                                    >
                                                        <td className="px-4 py-3">
                                                            {user.name}
                                                        </td>
                                                        <td className="px-4 py-3 text-muted-foreground">
                                                            {user.email}
                                                        </td>
                                                        <td className="px-4 py-3">
                                                            <Badge
                                                                variant="outline"
                                                                className={cn(
                                                                    getRoleBadgeClassName(
                                                                        user.role_slug,
                                                                    ),
                                                                )}
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
                                                                            onClick={() =>
                                                                                handleResetPassword(
                                                                                    user.id,
                                                                                )
                                                                            }
                                                                            disabled={
                                                                                resettingUserId !==
                                                                                null
                                                                            }
                                                                        >
                                                                            {resettingUserId ===
                                                                            user.id ? (
                                                                                <Loader2 className="size-4 animate-spin" />
                                                                            ) : (
                                                                                <RotateCcw className="size-4" />
                                                                            )}
                                                                        </Button>
                                                                    </TooltipTrigger>
                                                                    <TooltipContent>
                                                                        Reset password
                                                                    </TooltipContent>
                                                                </Tooltip>
                                                                <Tooltip>
                                                                    <TooltipTrigger asChild>
                                                                        <Button
                                                                            type="button"
                                                                            variant="ghost"
                                                                            size="icon"
                                                                            className="size-8"
                                                                            aria-label={`Edit ${user.name}`}
                                                                            onClick={() =>
                                                                                openEditAccountDialog(
                                                                                    user,
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
                                                                <Tooltip>
                                                                    <TooltipTrigger asChild>
                                                                        <Button
                                                                            type="button"
                                                                            variant="ghost"
                                                                            size="icon"
                                                                            className="size-8 text-destructive hover:text-destructive"
                                                                            aria-label={`Delete ${user.name}`}
                                                                            onClick={() =>
                                                                                handleDeleteAccount(
                                                                                    user.id,
                                                                                )
                                                                            }
                                                                        >
                                                                            <Trash2 className="size-4" />
                                                                        </Button>
                                                                    </TooltipTrigger>
                                                                    <TooltipContent>
                                                                        Delete
                                                                    </TooltipContent>
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
                                                <th className="px-4 py-3 text-right font-medium">
                                                    Action
                                                </th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {activeLocalItems.length === 0 ? (
                                                <tr>
                                                    <td
                                                        colSpan={2}
                                                        className="px-4 py-8 text-center text-muted-foreground"
                                                    >
                                                        No {activeTabData.label.toLowerCase()} entries found.
                                                    </td>
                                                </tr>
                                            ) : (
                                                activeLocalItems.map((item) => (
                                                    <tr
                                                        key={item.id}
                                                        className="border-t border-border/70"
                                                    >
                                                        <td className="px-4 py-3">
                                                            {item.name}
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
                                                                <Tooltip>
                                                                    <TooltipTrigger asChild>
                                                                        <Button
                                                                            type="button"
                                                                            variant="ghost"
                                                                            size="icon"
                                                                            className="size-8 text-destructive hover:text-destructive"
                                                                            aria-label={`Delete ${item.name}`}
                                                                            onClick={() =>
                                                                                handleDeleteLocal(
                                                                                    item.id,
                                                                                )
                                                                            }
                                                                        >
                                                                            <Trash2 className="size-4" />
                                                                        </Button>
                                                                    </TooltipTrigger>
                                                                    <TooltipContent>
                                                                        Delete
                                                                    </TooltipContent>
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
                        {isAccountTab && accountUsers.length > 0 ? (
                            <div className="mt-3 flex flex-col gap-3 text-sm text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
                                <p>
                                    Showing {accountEntryStart} to {accountEntryEnd} of{' '}
                                    {filteredAccountUsers.length} entries
                                </p>
                                <div className="flex items-center gap-2">
                                    <Button
                                        type="button"
                                        variant="outline"
                                        onClick={() =>
                                            setAccountPage((currentPage) =>
                                                Math.max(currentPage - 1, 1),
                                            )
                                        }
                                        disabled={accountPage <= 1}
                                    >
                                        Previous
                                    </Button>
                                    <span className="min-w-24 text-center">
                                        Page {accountPage} of {totalAccountPages}
                                    </span>
                                    <Button
                                        type="button"
                                        variant="outline"
                                        onClick={() =>
                                            setAccountPage((currentPage) =>
                                                Math.min(
                                                    currentPage + 1,
                                                    totalAccountPages,
                                                ),
                                            )
                                        }
                                        disabled={accountPage >= totalAccountPages}
                                    >
                                        Next
                                    </Button>
                                </div>
                            </div>
                        ) : null}
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
                            {isAccountTab
                                ? 'Create a new account. Default password will be set to apoy1234.'
                                : `Create a new ${activeTabData.label.toLowerCase()} entry.`}
                        </DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handleAdd} className="space-y-4">
                        {isAccountTab ? (
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
                                    onChange={(event) =>
                                        setAddLocalValue(event.target.value)
                                    }
                                    placeholder={`Enter ${activeTabData.label.toLowerCase()}...`}
                                />
                            </div>
                        )}
                        <DialogFooter>
                            <Button
                                type="button"
                                variant="outline"
                                onClick={closeAddDialog}
                            >
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
                            {isAccountTab
                                ? 'Update this account record.'
                                : `Update this ${activeTabData.label.toLowerCase()} entry.`}
                        </DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handleEdit} className="space-y-4">
                        {isAccountTab ? (
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
                                    onChange={(event) =>
                                        setEditLocalValue(event.target.value)
                                    }
                                    placeholder={`Enter ${activeTabData.label.toLowerCase()}...`}
                                />
                            </div>
                        )}
                        <DialogFooter>
                            <Button
                                type="button"
                                variant="outline"
                                onClick={closeEditDialog}
                            >
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
        </AppLayout>
    );
}
