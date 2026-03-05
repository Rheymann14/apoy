import { Head, Link } from '@inertiajs/react';
import {
    ArrowRight,
    Boxes,
    Layers,
    PackageCheck,
    PackageX,
    TriangleAlert,
    Users,
    Warehouse,
} from 'lucide-react';
import { useMemo, useState } from 'react';
import type { MouseEventHandler } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import AppLayout from '@/layouts/app-layout';
import { dashboard, inventory, management } from '@/routes';
import type { BreadcrumbItem } from '@/types';

type InventoryStatus = 'In Stock' | 'Low Stock' | 'Out of Stock';

type CountSummary = {
    total_ingredients: number;
    total_quantity: number;
    total_categories: number;
    total_storages: number;
    total_users: number;
    in_stock: number;
    low_stock: number;
    out_of_stock: number;
};

type ChartPoint = {
    label: string;
    value: number;
};

type StatusPoint = {
    label: InventoryStatus;
    value: number;
};

type DonutSegment = StatusPoint & {
    start: number;
    end: number;
    percent: number;
    color: string;
};

type RecentIngredient = {
    id: number;
    name: string;
    code: string;
    status: InventoryStatus;
    category: string;
    storage: string;
    created_at_human: string | null;
};

type DashboardPageProps = {
    counts: CountSummary;
    statusChart: StatusPoint[];
    dailyAdded: ChartPoint[];
    categoryChart: ChartPoint[];
    recentIngredients: RecentIngredient[];
};

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Dashboard',
        href: dashboard(),
    },
];

const formatCount = (value: number) => new Intl.NumberFormat().format(value);

const toPercentLabel = (value: number, total: number) => {
    if (total <= 0) {
        return '0% of total';
    }

    const percent = Math.round((value / total) * 100);
    return `${percent}% of total`;
};

const statusColorMap: Record<InventoryStatus, string> = {
    'In Stock': '#7aa99a',
    'Low Stock': '#ccb07a',
    'Out of Stock': '#c48f90',
};

const categoryBarPalette = [
    '#7aa99a',
    '#90b3a8',
    '#a7bdaf',
    '#bcc8b8',
    '#ccd2c5',
    '#d9ddd2',
];

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

type TrendChartProps = {
    data: ChartPoint[];
};

function TrendChart({ data }: TrendChartProps) {
    const [hoveredLabel, setHoveredLabel] = useState<string | null>(null);
    const chartData = data.length > 0 ? data : [{ label: 'N/A', value: 0 }];
    const width = 620;
    const height = 210;
    const xStart = 26;
    const xEnd = width - 26;
    const yTop = 16;
    const yBottom = height - 30;
    const maxValue = Math.max(1, ...chartData.map((point) => point.value));
    const stepX =
        chartData.length > 1 ? (xEnd - xStart) / (chartData.length - 1) : 0;

    const points = chartData.map((point, index) => ({
        ...point,
        x: xStart + stepX * index,
        y: yBottom - (point.value / maxValue) * (yBottom - yTop),
    }));
    const hoveredPoint =
        points.find((point) => point.label === hoveredLabel) ?? null;

    const linePath = points
        .map(
            (point, index) =>
                `${index === 0 ? 'M' : 'L'} ${point.x.toFixed(2)} ${point.y.toFixed(2)}`,
        )
        .join(' ');

    const firstPoint = points[0];
    const lastPoint = points[points.length - 1];
    const areaPath = `${linePath} L ${lastPoint.x.toFixed(2)} ${yBottom.toFixed(2)} L ${firstPoint.x.toFixed(2)} ${yBottom.toFixed(2)} Z`;

    return (
        <div className="space-y-2">
            <div className="relative">
                <svg viewBox={`0 0 ${width} ${height}`} className="h-52 w-full">
                    <defs>
                        <linearGradient
                            id="dailyTrendFill"
                            x1="0"
                            y1="0"
                            x2="0"
                            y2="1"
                        >
                            <stop
                                offset="0%"
                                stopColor="#7aa99a"
                                stopOpacity="0.35"
                            />
                            <stop
                                offset="100%"
                                stopColor="#7aa99a"
                                stopOpacity="0.02"
                            />
                        </linearGradient>
                    </defs>

                    {Array.from({ length: 4 }).map((_, index) => {
                        const y = yTop + ((yBottom - yTop) * index) / 3;
                        return (
                            <line
                                key={index}
                                x1={xStart}
                                y1={y}
                                x2={xEnd}
                                y2={y}
                                stroke="currentColor"
                                strokeOpacity={0.12}
                                strokeWidth={1}
                            />
                        );
                    })}

                    {hoveredPoint && (
                        <line
                            x1={hoveredPoint.x}
                            y1={yTop}
                            x2={hoveredPoint.x}
                            y2={yBottom}
                            stroke="#5d8f80"
                            strokeOpacity={0.3}
                            strokeDasharray="4 4"
                        />
                    )}

                    <path d={areaPath} fill="url(#dailyTrendFill)" />
                    <path
                        d={linePath}
                        fill="none"
                        stroke="#5d8f80"
                        strokeWidth={2.4}
                        strokeLinecap="round"
                        strokeLinejoin="round"
                    />
                    {points.map((point) => {
                        const isHovered = hoveredLabel === point.label;
                        return (
                            <g key={point.label}>
                                <circle
                                    cx={point.x}
                                    cy={point.y}
                                    r={isHovered ? 4.5 : 3}
                                    fill={isHovered ? '#5d8f80' : '#ffffff'}
                                    stroke="#5d8f80"
                                    strokeWidth={2}
                                />
                                <circle
                                    cx={point.x}
                                    cy={point.y}
                                    r={12}
                                    fill="transparent"
                                    onMouseEnter={() =>
                                        setHoveredLabel(point.label)
                                    }
                                    onMouseLeave={() => setHoveredLabel(null)}
                                />
                            </g>
                        );
                    })}
                </svg>

                {hoveredPoint && (
                    <div
                        className="pointer-events-none absolute z-10 rounded-md border border-border/70 bg-card/95 px-2 py-1 text-xs shadow-sm"
                        style={{
                            left: `${(hoveredPoint.x / width) * 100}%`,
                            top: `${Math.max(8, ((hoveredPoint.y - 12) / height) * 100)}%`,
                            transform: 'translate(-50%, -100%)',
                        }}
                    >
                        <p className="font-medium">{hoveredPoint.label}</p>
                        <p className="text-muted-foreground">
                            {formatCount(hoveredPoint.value)} added
                        </p>
                    </div>
                )}
            </div>

            <div className="flex items-center justify-between text-xs text-muted-foreground">
                {chartData.map((point) => (
                    <span
                        key={point.label}
                        className={
                            hoveredLabel === point.label
                                ? 'text-foreground'
                                : 'text-muted-foreground'
                        }
                    >
                        {point.label}
                    </span>
                ))}
            </div>
        </div>
    );
}

type StatusDonutChartProps = {
    data: StatusPoint[];
    total: number;
};

function StatusDonutChart({ data, total }: StatusDonutChartProps) {
    const [hoveredSegment, setHoveredSegment] = useState<DonutSegment | null>(
        null,
    );
    const [tooltipPosition, setTooltipPosition] = useState({ x: 50, y: 50 });

    const segments = useMemo<DonutSegment[]>(() => {
        if (total <= 0) {
            return [];
        }

        let start = 0;
        return data.map((segment) => {
            const percent = (segment.value / total) * 100;
            const end = start + percent;
            const current: DonutSegment = {
                ...segment,
                start,
                end,
                percent,
                color: statusColorMap[segment.label],
            };
            start = end;
            return current;
        });
    }, [data, total]);

    const segmentByLabel = useMemo(
        () => new Map(segments.map((segment) => [segment.label, segment])),
        [segments],
    );

    const conicGradient = useMemo(() => {
        if (total <= 0) {
            return 'conic-gradient(#e5e7eb 0% 100%)';
        }

        const stops = segments.map(
            (segment) =>
                `${segment.color} ${segment.start.toFixed(2)}% ${segment.end.toFixed(2)}%`,
        );

        return `conic-gradient(${stops.join(', ')})`;
    }, [segments, total]);

    const handleDonutMouseMove: MouseEventHandler<HTMLDivElement> = (event) => {
        if (segments.length === 0) {
            setHoveredSegment(null);
            return;
        }

        const rect = event.currentTarget.getBoundingClientRect();
        const x = event.clientX - rect.left;
        const y = event.clientY - rect.top;
        const center = rect.width / 2;
        const dx = x - center;
        const dy = y - center;
        const distance = Math.hypot(dx, dy);
        const outerRadius = rect.width / 2;
        const innerRadius = outerRadius * 0.64;

        setTooltipPosition({
            x: (x / rect.width) * 100,
            y: (y / rect.height) * 100,
        });

        if (distance < innerRadius || distance > outerRadius) {
            setHoveredSegment(null);
            return;
        }

        const degrees = ((Math.atan2(dy, dx) * 180) / Math.PI + 450) % 360;
        const percent = (degrees / 360) * 100;
        const match =
            segments.find(
                (segment) => percent >= segment.start && percent < segment.end,
            ) ??
            segments[segments.length - 1] ??
            null;
        setHoveredSegment(match);
    };

    return (
        <div className="space-y-4">
            <div className="relative mx-auto size-44">
                <div
                    className="relative size-full rounded-full transition-shadow duration-200"
                    style={{
                        background: conicGradient,
                        boxShadow: hoveredSegment
                            ? `0 0 0 2px ${hoveredSegment.color}33`
                            : undefined,
                    }}
                    onMouseMove={handleDonutMouseMove}
                    onMouseLeave={() => setHoveredSegment(null)}
                >
                    <div className="absolute inset-[18%] flex items-center justify-center rounded-full border border-border/60 bg-background/95">
                        <div className="text-center">
                            <p className="text-xl font-semibold">
                                {formatCount(hoveredSegment?.value ?? total)}
                            </p>
                            <p className="text-xs text-muted-foreground">
                                {hoveredSegment
                                    ? `${hoveredSegment.label} (${Math.round(
                                          hoveredSegment.percent,
                                      )}%)`
                                    : 'Ingredients'}
                            </p>
                        </div>
                    </div>
                </div>

                {hoveredSegment && (
                    <div
                        className="pointer-events-none absolute z-10 rounded-md border border-border/70 bg-card/95 px-2 py-1 text-xs shadow-sm"
                        style={{
                            left: `${tooltipPosition.x}%`,
                            top: `${Math.max(14, tooltipPosition.y)}%`,
                            transform: 'translate(-50%, -120%)',
                        }}
                    >
                        <p className="font-medium">{hoveredSegment.label}</p>
                        <p className="text-muted-foreground">
                            {formatCount(hoveredSegment.value)} items
                        </p>
                    </div>
                )}
            </div>

            <div className="space-y-2">
                {data.map((item) => {
                    const segment = segmentByLabel.get(item.label) ?? null;
                    const isHovered = hoveredSegment?.label === item.label;

                    return (
                        <div
                            key={item.label}
                            className={`flex items-center justify-between rounded-md border px-3 py-2 transition-colors ${
                                isHovered
                                    ? 'border-border bg-muted/40'
                                    : 'border-border/60'
                            }`}
                            onMouseEnter={() => setHoveredSegment(segment)}
                            onMouseLeave={() => setHoveredSegment(null)}
                        >
                            <div className="flex items-center gap-2 text-sm">
                                <span
                                    className="size-2.5 rounded-full"
                                    style={{
                                        backgroundColor:
                                            statusColorMap[item.label],
                                    }}
                                />
                                {item.label}
                            </div>
                            <span className="text-sm text-muted-foreground">
                                {formatCount(item.value)}
                            </span>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}

type CategoryBarsProps = {
    data: ChartPoint[];
};

function CategoryBars({ data }: CategoryBarsProps) {
    if (data.length === 0) {
        return (
            <p className="rounded-md border border-dashed border-border/70 p-6 text-center text-sm text-muted-foreground">
                No category data available yet.
            </p>
        );
    }

    const maxValue = Math.max(1, ...data.map((item) => item.value));

    return (
        <div className="space-y-3">
            {data.map((item, index) => {
                const width = (item.value / maxValue) * 100;
                return (
                    <div key={item.label} className="space-y-1">
                        <div className="flex items-center justify-between text-sm">
                            <span>{item.label}</span>
                            <span className="text-muted-foreground">
                                {formatCount(item.value)}
                            </span>
                        </div>
                        <div className="h-2.5 rounded-full bg-muted/50">
                            <div
                                className="h-full rounded-full transition-all"
                                style={{
                                    width: `${width}%`,
                                    backgroundColor:
                                        categoryBarPalette[
                                            index % categoryBarPalette.length
                                        ],
                                }}
                            />
                        </div>
                    </div>
                );
            })}
        </div>
    );
}

export default function Dashboard({
    counts,
    statusChart,
    dailyAdded,
    categoryChart,
    recentIngredients,
}: DashboardPageProps) {
    const totalTrackedStatuses =
        counts.in_stock + counts.low_stock + counts.out_of_stock;
    const topCards = [
        {
            title: 'Total Ingredients',
            value: counts.total_ingredients,
            description: `${formatCount(counts.total_quantity)} combined quantity`,
            icon: Boxes,
            tone: 'text-foreground',
        },
        {
            title: 'In Stock',
            value: counts.in_stock,
            description: toPercentLabel(counts.in_stock, totalTrackedStatuses),
            icon: PackageCheck,
            tone: 'text-emerald-700 dark:text-emerald-300',
        },
        {
            title: 'Low Stock',
            value: counts.low_stock,
            description: toPercentLabel(counts.low_stock, totalTrackedStatuses),
            icon: TriangleAlert,
            tone: 'text-amber-700 dark:text-amber-300',
        },
        {
            title: 'Out of Stock',
            value: counts.out_of_stock,
            description: toPercentLabel(
                counts.out_of_stock,
                totalTrackedStatuses,
            ),
            icon: PackageX,
            tone: 'text-rose-700 dark:text-rose-300',
        },
    ] as const;

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Dashboard" />

            <div className="animate-in space-y-4 duration-500 fade-in-0 slide-in-from-bottom-2">
                <Card className="border-border/70 bg-card/90">
                    <CardHeader className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                        <div>
                            <CardTitle className="text-2xl tracking-tight">
                                Inventory Overview
                            </CardTitle>
                            <CardDescription className="mt-1">
                                Live counts, stock health, and activity trends
                                from your inventory records.
                            </CardDescription>
                        </div>
                        <div className="flex flex-wrap gap-2">
                            <Badge
                                variant="secondary"
                                className="rounded-full px-3 py-1 text-xs"
                            >
                                Live Snapshot
                            </Badge>
                            <Button asChild variant="outline" size="sm">
                                <Link href={inventory()}>
                                    Open Inventory
                                    <ArrowRight className="ml-2 size-4" />
                                </Link>
                            </Button>
                            <Button asChild variant="outline" size="sm">
                                <Link href={management()}>
                                    Open Management
                                    <ArrowRight className="ml-2 size-4" />
                                </Link>
                            </Button>
                        </div>
                    </CardHeader>
                </Card>

                <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                    {topCards.map((item) => (
                        <Card
                            key={item.title}
                            className="border-border/70 bg-card/90"
                        >
                            <CardHeader className="pb-2">
                                <div className="flex items-center justify-between">
                                    <CardDescription>
                                        {item.title}
                                    </CardDescription>
                                    <item.icon className="size-4 text-muted-foreground" />
                                </div>
                            </CardHeader>
                            <CardContent>
                                <p
                                    className={`text-2xl font-semibold tracking-tight ${item.tone}`}
                                >
                                    {formatCount(item.value)}
                                </p>
                                <p className="mt-1 text-xs text-muted-foreground">
                                    {item.description}
                                </p>
                            </CardContent>
                        </Card>
                    ))}
                </div>

                <div className="grid gap-4 md:grid-cols-3">
                    <Card className="border-border/70 bg-card/90">
                        <CardHeader className="pb-2">
                            <CardDescription>Categories</CardDescription>
                            <CardTitle className="text-lg">
                                {formatCount(counts.total_categories)}
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="flex items-center gap-2 text-sm text-muted-foreground">
                            <Layers className="size-4" />
                            Configured ingredient groups
                        </CardContent>
                    </Card>

                    <Card className="border-border/70 bg-card/90">
                        <CardHeader className="pb-2">
                            <CardDescription>Storage Areas</CardDescription>
                            <CardTitle className="text-lg">
                                {formatCount(counts.total_storages)}
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="flex items-center gap-2 text-sm text-muted-foreground">
                            <Warehouse className="size-4" />
                            Active inventory locations
                        </CardContent>
                    </Card>

                    <Card className="border-border/70 bg-card/90">
                        <CardHeader className="pb-2">
                            <CardDescription>Users</CardDescription>
                            <CardTitle className="text-lg">
                                {formatCount(counts.total_users)}
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="flex items-center gap-2 text-sm text-muted-foreground">
                            <Users className="size-4" />
                            Accounts with system access
                        </CardContent>
                    </Card>
                </div>

                <div className="grid gap-4 lg:grid-cols-3">
                    <Card className="border-border/70 bg-card/90 lg:col-span-2">
                        <CardHeader>
                            <CardTitle>New Ingredients (Last 7 Days)</CardTitle>
                            <CardDescription>
                                Daily additions trend for recent inventory
                                intake.
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <TrendChart data={dailyAdded} />
                        </CardContent>
                    </Card>

                    <Card className="border-border/70 bg-card/90">
                        <CardHeader>
                            <CardTitle>Stock Distribution</CardTitle>
                            <CardDescription>
                                Share of items by stock status.
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <StatusDonutChart
                                data={statusChart}
                                total={counts.total_ingredients}
                            />
                        </CardContent>
                    </Card>
                </div>

                <div className="grid gap-4 lg:grid-cols-3">
                    <Card className="border-border/70 bg-card/90 lg:col-span-2">
                        <CardHeader>
                            <CardTitle>Top Categories by Item Count</CardTitle>
                            <CardDescription>
                                Highest-volume categories based on current
                                inventory.
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <CategoryBars data={categoryChart} />
                        </CardContent>
                    </Card>

                    <Card className="border-border/70 bg-card/90">
                        <CardHeader>
                            <CardTitle>Recent Additions</CardTitle>
                            <CardDescription>
                                Latest ingredient records in the system.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-2.5">
                            {recentIngredients.length === 0 ? (
                                <p className="rounded-md border border-dashed border-border/70 p-4 text-sm text-muted-foreground">
                                    No ingredient records yet.
                                </p>
                            ) : (
                                recentIngredients.map((ingredient) => (
                                    <div
                                        key={ingredient.id}
                                        className="rounded-lg border border-border/70 p-3"
                                    >
                                        <div className="flex items-start justify-between gap-3">
                                            <div className="min-w-0">
                                                <p className="truncate text-sm font-medium">
                                                    {ingredient.name}
                                                </p>
                                                <p className="truncate text-xs text-muted-foreground">
                                                    {ingredient.code}
                                                </p>
                                            </div>
                                            {getStatusBadge(ingredient.status)}
                                        </div>
                                        <p className="mt-2 text-xs text-muted-foreground">
                                            {ingredient.category} -{' '}
                                            {ingredient.storage}
                                        </p>
                                        <p className="mt-1 text-xs text-muted-foreground">
                                            {ingredient.created_at_human ??
                                                'Just now'}
                                        </p>
                                    </div>
                                ))
                            )}
                        </CardContent>
                    </Card>
                </div>
            </div>
        </AppLayout>
    );
}
