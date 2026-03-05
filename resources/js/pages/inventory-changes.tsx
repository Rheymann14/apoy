import { Head, Link, router } from '@inertiajs/react';
import { ArrowLeft, Clock3, History, Search, UserRound } from 'lucide-react';
import { useMemo, useState } from 'react';
import type { ChangeEvent } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import AppLayout from '@/layouts/app-layout';
import { dashboard, inventory } from '@/routes';
import type { BreadcrumbItem } from '@/types';

type ChangedField = {
    field: string;
    from: string | null;
    to: string | null;
};

type ChangeType = 'added' | 'edited' | 'deleted';

type InventoryChange = {
    id: number;
    change_type: ChangeType;
    ingredient_name: string;
    ingredient_code: string;
    edited_by_name: string;
    changed_fields: ChangedField[];
    changed_at: string | null;
};

type PaginatedChanges = {
    data: InventoryChange[];
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
    from: number | null;
    to: number | null;
};

type Filters = {
    search: string;
    date_from: string | null;
    date_to: string | null;
    per_page: number;
};

type InventoryChangesPageProps = {
    changes: PaginatedChanges;
    filters: Filters;
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
    {
        title: 'Changes',
        href: '/inventory/changes',
    },
];

const entriesPerPageOptions = [10, 50, 100] as const;
const deletedValueFields = [
    'Name',
    'Category',
    'Quantity',
    'Unit',
    'Storage',
    'Status',
] as const;

const toDisplayValue = (value: string | null) => {
    if (value === null || value.trim() === '') {
        return '-';
    }

    return value;
};

const getPreviousFieldValue = (
    changedFields: ChangedField[],
    fieldName: (typeof deletedValueFields)[number],
) => {
    return (
        changedFields.find((field) => field.field === fieldName)?.from ?? null
    );
};

const getCardTone = (changeType: ChangeType) => {
    if (changeType === 'added') {
        return 'border-emerald-200/80 bg-emerald-50/40 dark:border-emerald-500/40 dark:bg-emerald-900/20';
    }

    if (changeType === 'deleted') {
        return 'border-rose-200/80 bg-rose-50/40 dark:border-rose-500/40 dark:bg-rose-900/20';
    }

    return 'border-amber-200/80 bg-amber-50/40 dark:border-amber-500/40 dark:bg-amber-900/20';
};

const getTypeBadge = (changeType: ChangeType) => {
    if (changeType === 'added') {
        return (
            <Badge
                variant="outline"
                className="rounded-full border-emerald-300 bg-emerald-100 text-emerald-800 dark:border-emerald-500/60 dark:bg-emerald-500/20 dark:text-emerald-200"
            >
                Added
            </Badge>
        );
    }

    if (changeType === 'deleted') {
        return (
            <Badge
                variant="outline"
                className="rounded-full border-rose-300 bg-rose-100 text-rose-800 dark:border-rose-500/60 dark:bg-rose-500/20 dark:text-rose-200"
            >
                Deleted
            </Badge>
        );
    }

    return (
        <Badge
            variant="outline"
            className="rounded-full border-amber-300 bg-amber-100 text-amber-800 dark:border-amber-500/60 dark:bg-amber-500/20 dark:text-amber-200"
        >
            Edited
        </Badge>
    );
};

export default function InventoryChanges({
    changes,
    filters,
}: InventoryChangesPageProps) {
    const [search, setSearch] = useState(filters.search ?? '');
    const [dateFrom, setDateFrom] = useState(filters.date_from ?? '');
    const [dateTo, setDateTo] = useState(filters.date_to ?? '');

    const requestParams = useMemo(
        () => ({
            search: search.trim() || undefined,
            date_from: dateFrom || undefined,
            date_to: dateTo || undefined,
            per_page: filters.per_page,
        }),
        [dateFrom, dateTo, filters.per_page, search],
    );

    const applyFilters = () => {
        router.get(
            '/inventory/changes',
            {
                ...requestParams,
                page: 1,
            },
            {
                preserveScroll: true,
                preserveState: true,
                replace: true,
            },
        );
    };

    const resetFilters = () => {
        setSearch('');
        setDateFrom('');
        setDateTo('');
        router.get(
            '/inventory/changes',
            {
                per_page: filters.per_page,
                page: 1,
            },
            {
                preserveScroll: true,
                preserveState: true,
                replace: true,
            },
        );
    };

    const handleEntriesPerPageChange = (
        event: ChangeEvent<HTMLSelectElement>,
    ) => {
        const nextPerPage = Number.parseInt(event.target.value, 10);
        router.get(
            '/inventory/changes',
            {
                search: search.trim() || undefined,
                date_from: dateFrom || undefined,
                date_to: dateTo || undefined,
                per_page: nextPerPage,
                page: 1,
            },
            {
                preserveScroll: true,
                preserveState: true,
                replace: true,
            },
        );
    };

    const goToPage = (page: number) => {
        router.get(
            '/inventory/changes',
            {
                ...requestParams,
                page,
            },
            {
                preserveScroll: true,
                preserveState: true,
                replace: true,
            },
        );
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Inventory Changes" />

            <div className="space-y-4">
                <Card className="border-border/70 bg-card/90">
                    <CardHeader className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                        <div>
                            <CardTitle className="text-2xl tracking-tight">
                                Inventory Change History
                            </CardTitle>
                            <p className="mt-1 text-sm text-muted-foreground">
                                Search by code, filter by date range, and review
                                added, edited, and deleted records.
                            </p>
                        </div>
                        <Button
                            asChild
                            variant="outline"
                            className="w-full sm:w-auto"
                        >
                            <Link href={inventory()}>
                                <ArrowLeft className="mr-2 size-4" />
                                Back to Inventory
                            </Link>
                        </Button>
                    </CardHeader>
                </Card>

                <Card className="border-border/70 bg-card/90">
                    <CardContent className="space-y-4 pt-6">
                        <div className="grid gap-3 lg:grid-cols-5">
                            <div className="space-y-1.5 lg:col-span-2">
                                <Label htmlFor="search-code">Search Code</Label>
                                <div className="relative">
                                    <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
                                    <Input
                                        id="search-code"
                                        value={search}
                                        onChange={(event) =>
                                            setSearch(event.target.value)
                                        }
                                        placeholder="e.g. CAT-0001"
                                        className="pl-9"
                                    />
                                </div>
                            </div>
                            <div className="space-y-1.5">
                                <Label htmlFor="date-from">Date From</Label>
                                <Input
                                    id="date-from"
                                    type="date"
                                    value={dateFrom}
                                    onChange={(event) =>
                                        setDateFrom(event.target.value)
                                    }
                                />
                            </div>
                            <div className="space-y-1.5">
                                <Label htmlFor="date-to">Date To</Label>
                                <Input
                                    id="date-to"
                                    type="date"
                                    value={dateTo}
                                    onChange={(event) =>
                                        setDateTo(event.target.value)
                                    }
                                />
                            </div>
                            <div className="space-y-1.5">
                                <Label htmlFor="entries-per-page">
                                    Show Entries
                                </Label>
                                <select
                                    id="entries-per-page"
                                    className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
                                    value={String(filters.per_page)}
                                    onChange={handleEntriesPerPageChange}
                                >
                                    {entriesPerPageOptions.map((option) => (
                                        <option key={option} value={option}>
                                            {option}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        <div className="flex flex-wrap items-center gap-2">
                            <Button
                                type="button"
                                size="sm"
                                onClick={applyFilters}
                            >
                                Apply Filters
                            </Button>
                            <Button
                                type="button"
                                size="sm"
                                variant="outline"
                                onClick={resetFilters}
                            >
                                Reset
                            </Button>
                        </div>

                        {changes.data.length === 0 ? (
                            <p className="rounded-lg border border-dashed border-border/70 p-6 text-center text-sm text-muted-foreground">
                                No change records found for your filters.
                            </p>
                        ) : (
                            <div className="space-y-3">
                                {changes.data.map((change) => (
                                    <div
                                        key={change.id}
                                        className={`rounded-lg border p-4 ${getCardTone(change.change_type)}`}
                                    >
                                        <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                                            <div className="min-w-0">
                                                <p className="truncate text-sm font-semibold">
                                                    {change.ingredient_name}
                                                </p>
                                                <p className="text-xs text-muted-foreground">
                                                    {change.ingredient_code}
                                                </p>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                {getTypeBadge(
                                                    change.change_type,
                                                )}
                                                <Badge
                                                    variant="outline"
                                                    className="w-fit rounded-full"
                                                >
                                                    <History className="mr-1 size-3.5" />
                                                    {
                                                        change.changed_fields
                                                            .length
                                                    }{' '}
                                                    field
                                                    {change.changed_fields
                                                        .length === 1
                                                        ? ''
                                                        : 's'}
                                                </Badge>
                                            </div>
                                        </div>

                                        <div className="mt-3 flex flex-col gap-2 text-xs text-muted-foreground sm:flex-row sm:items-center sm:gap-4">
                                            <p className="inline-flex items-center gap-1">
                                                <UserRound className="size-3.5" />
                                                By: {change.edited_by_name}
                                            </p>
                                            <p className="inline-flex items-center gap-1">
                                                <Clock3 className="size-3.5" />
                                                {change.changed_at ??
                                                    'Unknown time'}
                                            </p>
                                        </div>

                                        {change.change_type === 'deleted' ? (
                                            <div className="mt-3 rounded-md bg-background/65 p-3">
                                                <p className="mb-2 text-xs font-medium text-muted-foreground">
                                                    Last Values
                                                </p>
                                                <div className="grid gap-1.5 sm:grid-cols-2">
                                                    {deletedValueFields.map(
                                                        (fieldName) => (
                                                            <p
                                                                key={`${change.id}-${fieldName}`}
                                                                className="text-xs"
                                                            >
                                                                <span className="font-medium">
                                                                    {fieldName}:
                                                                </span>{' '}
                                                                {fieldName ===
                                                                'Name'
                                                                    ? toDisplayValue(
                                                                          change.ingredient_name,
                                                                      )
                                                                    : toDisplayValue(
                                                                          getPreviousFieldValue(
                                                                              change.changed_fields,
                                                                              fieldName,
                                                                          ),
                                                                      )}
                                                            </p>
                                                        ),
                                                    )}
                                                </div>
                                            </div>
                                        ) : (
                                            <div className="mt-3 space-y-1.5">
                                                {change.changed_fields.map(
                                                    (field) => (
                                                        <p
                                                            key={`${change.id}-${field.field}`}
                                                            className="rounded-md bg-background/65 px-2.5 py-1.5 text-xs"
                                                        >
                                                            <span className="font-medium">
                                                                {field.field}:
                                                            </span>{' '}
                                                            {toDisplayValue(
                                                                field.from,
                                                            )}{' '}
                                                            <span className="text-muted-foreground">
                                                                -&gt;
                                                            </span>{' '}
                                                            {toDisplayValue(
                                                                field.to,
                                                            )}
                                                        </p>
                                                    ),
                                                )}
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        )}

                        <div className="flex flex-col gap-3 border-t border-border/70 pt-4 sm:flex-row sm:items-center sm:justify-between">
                            <p className="text-sm text-muted-foreground">
                                Showing {changes.from ?? 0}-{changes.to ?? 0} of{' '}
                                {changes.total} changes
                            </p>
                            <div className="flex items-center gap-2 self-end sm:self-auto">
                                <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    onClick={() =>
                                        goToPage(changes.current_page - 1)
                                    }
                                    disabled={changes.current_page <= 1}
                                >
                                    Prev
                                </Button>
                                <span className="text-sm text-muted-foreground">
                                    Page {changes.current_page} of{' '}
                                    {changes.last_page}
                                </span>
                                <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    onClick={() =>
                                        goToPage(changes.current_page + 1)
                                    }
                                    disabled={
                                        changes.current_page >=
                                        changes.last_page
                                    }
                                >
                                    Next
                                </Button>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </AppLayout>
    );
}
