import { Head, Link, router } from '@inertiajs/react';
import {
    ArrowRight,
    Boxes,
    GripVertical,
    Layers,
    PackageCheck,
    PackageX,
    Printer,
    RotateCcw,
    TriangleAlert,
    Users,
    Warehouse,
} from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';
import type { MouseEventHandler } from 'react';
import { toast } from 'sonner';
import Sortable from 'sortablejs';
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

const dashboardRealtimeKeys = [
    'counts',
    'statusChart',
    'dailyAdded',
    'categoryChart',
    'recentIngredients',
] as const;
const dashboardRefreshIntervalMs = 30000;

type TopCardId =
    | 'total_ingredients'
    | 'in_stock'
    | 'low_stock'
    | 'out_of_stock';
type SummaryCardId = 'categories' | 'storages' | 'users';
type PrimaryInsightCardId = 'new_ingredients' | 'stock_distribution';
type SecondaryInsightCardId = 'top_categories' | 'recent_additions';
type MetricCardId = TopCardId | SummaryCardId;
type InsightCardId = PrimaryInsightCardId | SecondaryInsightCardId;

const defaultTopCardOrder: TopCardId[] = [
    'total_ingredients',
    'in_stock',
    'low_stock',
    'out_of_stock',
];
const defaultSummaryCardOrder: SummaryCardId[] = [
    'categories',
    'storages',
    'users',
];
const defaultPrimaryInsightOrder: PrimaryInsightCardId[] = [
    'new_ingredients',
    'stock_distribution',
];
const defaultSecondaryInsightOrder: SecondaryInsightCardId[] = [
    'top_categories',
    'recent_additions',
];
const defaultMetricCardOrder: MetricCardId[] = [
    ...defaultTopCardOrder,
    ...defaultSummaryCardOrder,
];
const defaultInsightCardOrder: InsightCardId[] = [
    ...defaultPrimaryInsightOrder,
    ...defaultSecondaryInsightOrder,
];
const metricCardOrderStorageKey = 'dashboard.metric-card-order.v1';
const insightCardOrderStorageKey = 'dashboard.insight-card-order.v1';

const areCardOrdersEqual = <T extends string>(
    current: readonly T[],
    expected: readonly T[],
) =>
    current.length === expected.length &&
    current.every((cardId, index) => cardId === expected[index]);

const orderCardsById = <T extends { id: string }>(
    cards: readonly T[],
    order: readonly string[],
) => {
    const cardMap = new Map(cards.map((card) => [card.id, card]));
    const orderedCards = order
        .map((cardId) => cardMap.get(cardId))
        .filter((card): card is T => card !== undefined);

    if (orderedCards.length === cards.length) {
        return orderedCards;
    }

    const remainingCards = cards.filter((card) => !order.includes(card.id));
    return [...orderedCards, ...remainingCards];
};

const readCardOrderFromContainer = <T extends string>(
    container: HTMLDivElement,
    validIds: readonly T[],
) => {
    const validIdSet = new Set(validIds);

    return Array.from(container.children)
        .map((child) => child.getAttribute('data-card-id'))
        .filter(
            (cardId): cardId is T =>
                cardId !== null && validIdSet.has(cardId as T),
        );
};

const getStoredCardOrder = <T extends string>(
    storageKey: string,
    validIds: readonly T[],
) => {
    if (typeof window === 'undefined') {
        return null;
    }

    try {
        const raw = window.localStorage.getItem(storageKey);
        if (!raw) {
            return null;
        }

        const parsed = JSON.parse(raw);
        if (!Array.isArray(parsed)) {
            return null;
        }

        const validIdSet = new Set(validIds);
        const normalized = parsed.filter(
            (item): item is T =>
                typeof item === 'string' && validIdSet.has(item as T),
        );

        if (
            normalized.length !== validIds.length ||
            new Set(normalized).size !== validIds.length
        ) {
            return null;
        }

        return normalized;
    } catch {
        return null;
    }
};

const persistCardOrder = <T extends string>(
    storageKey: string,
    currentOrder: readonly T[],
    defaultOrder: readonly T[],
) => {
    if (typeof window === 'undefined') {
        return;
    }

    if (areCardOrdersEqual(currentOrder, defaultOrder)) {
        window.localStorage.removeItem(storageKey);
        return;
    }

    window.localStorage.setItem(storageKey, JSON.stringify(currentOrder));
};

const draggingCardClasses = [
    'ring-2',
    'ring-emerald-300/60',
    'dark:ring-emerald-500/40',
    'bg-emerald-50/40',
    'dark:bg-emerald-950/20',
    'shadow-lg',
] as const;

const getDraggableCardElement = (item: HTMLElement) =>
    (item.querySelector('[data-dashboard-card]') as HTMLElement | null) ?? item;

const toggleDraggingCardHighlight = (
    item: HTMLElement,
    shouldHighlight: boolean,
) => {
    const cardElement = getDraggableCardElement(item);

    if (shouldHighlight) {
        cardElement.classList.add(...draggingCardClasses);
        return;
    }

    cardElement.classList.remove(...draggingCardClasses);
};

const formatCount = (value: number) => new Intl.NumberFormat().format(value);

const renderPreviewMessage = (
    previewWindow: Window,
    title: string,
    message: string,
) => {
    previewWindow.document.title = title;
    previewWindow.document.body.innerHTML = '';

    const paragraph = previewWindow.document.createElement('p');
    paragraph.style.fontFamily = 'Arial, sans-serif';
    paragraph.style.padding = '16px';
    paragraph.textContent = message;

    previewWindow.document.body.appendChild(paragraph);
};

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
    const width = Math.max(300, chartData.length * 56);
    const height = 210;
    const xStart = 26;
    const xEnd = width - 26;
    const yTop = 16;
    const yBottom = height - 30;
    const maxVisibleLabels = 10;
    const labelStep = Math.max(
        1,
        Math.ceil(chartData.length / maxVisibleLabels),
    );
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
    const isTooltipBelowPoint =
        hoveredPoint !== null && hoveredPoint.y < yTop + 26;

    const toSmoothPath = (
        chartPoints: Array<{ x: number; y: number }>,
        smoothing = 0.18,
    ) => {
        if (chartPoints.length === 0) {
            return '';
        }

        if (chartPoints.length === 1) {
            const point = chartPoints[0];
            return `M ${point.x.toFixed(2)} ${point.y.toFixed(2)}`;
        }

        if (chartPoints.length === 2) {
            const [start, end] = chartPoints;
            return `M ${start.x.toFixed(2)} ${start.y.toFixed(2)} L ${end.x.toFixed(2)} ${end.y.toFixed(2)}`;
        }

        const getControlPoint = (
            current: { x: number; y: number },
            previous: { x: number; y: number } | undefined,
            next: { x: number; y: number } | undefined,
            reverse = false,
        ) => {
            const previousPoint = previous ?? current;
            const nextPoint = next ?? current;
            const angle =
                Math.atan2(
                    nextPoint.y - previousPoint.y,
                    nextPoint.x - previousPoint.x,
                ) + (reverse ? Math.PI : 0);
            const length =
                Math.hypot(
                    nextPoint.x - previousPoint.x,
                    nextPoint.y - previousPoint.y,
                ) * smoothing;

            return {
                x: current.x + Math.cos(angle) * length,
                y: current.y + Math.sin(angle) * length,
            };
        };

        let path = `M ${chartPoints[0].x.toFixed(2)} ${chartPoints[0].y.toFixed(2)}`;

        for (let index = 1; index < chartPoints.length; index += 1) {
            const currentPoint = chartPoints[index];
            const previousPoint = chartPoints[index - 1];
            const previousPreviousPoint = chartPoints[index - 2];
            const nextPoint = chartPoints[index + 1];

            const controlPointStart = getControlPoint(
                previousPoint,
                previousPreviousPoint,
                currentPoint,
            );
            const controlPointEnd = getControlPoint(
                currentPoint,
                previousPoint,
                nextPoint,
                true,
            );

            path += ` C ${controlPointStart.x.toFixed(2)} ${controlPointStart.y.toFixed(2)} ${controlPointEnd.x.toFixed(2)} ${controlPointEnd.y.toFixed(2)} ${currentPoint.x.toFixed(2)} ${currentPoint.y.toFixed(2)}`;
        }

        return path;
    };

    const linePath = toSmoothPath(points);

    const firstPoint = points[0];
    const lastPoint = points[points.length - 1];
    const areaPath = `${linePath} L ${lastPoint.x.toFixed(2)} ${yBottom.toFixed(2)} L ${firstPoint.x.toFixed(2)} ${yBottom.toFixed(2)} Z`;

    return (
        <div className="space-y-2">
            <div className="overflow-x-auto pb-1">
                <div
                    className="min-w-full space-y-2"
                    style={{ width: `max(100%, ${width}px)` }}
                >
                    <div className="relative">
                        <svg
                            viewBox={`0 0 ${width} ${height}`}
                            preserveAspectRatio="none"
                            className="h-52 w-full"
                        >
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
                                            fill={
                                                isHovered
                                                    ? '#5d8f80'
                                                    : '#ffffff'
                                            }
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
                                            onMouseLeave={() =>
                                                setHoveredLabel(null)
                                            }
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
                                    top: `${Math.max(
                                        8,
                                        ((hoveredPoint.y +
                                            (isTooltipBelowPoint ? 14 : -12)) /
                                            height) *
                                            100,
                                    )}%`,
                                    transform: isTooltipBelowPoint
                                        ? 'translate(-50%, 0)'
                                        : 'translate(-50%, -100%)',
                                }}
                            >
                                <p className="font-medium">
                                    {hoveredPoint.label}
                                </p>
                                <p className="text-muted-foreground">
                                    {formatCount(hoveredPoint.value)} added
                                </p>
                            </div>
                        )}
                    </div>
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                        {chartData.map((point, index) => (
                            <span
                                key={point.label}
                                className={
                                    hoveredLabel === point.label
                                        ? 'text-foreground'
                                        : 'text-muted-foreground'
                                }
                            >
                                {index % labelStep === 0 ||
                                index === chartData.length - 1
                                    ? point.label
                                    : '\u00A0'}
                            </span>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}

type StatusDonutChartProps = {
    data: StatusPoint[];
    total: number;
    onPrintStatus: (status: InventoryStatus) => void | Promise<void>;
};

function StatusDonutChart({
    data,
    total,
    onPrintStatus,
}: StatusDonutChartProps) {
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
    const shouldScrollLegend = data.length > 4;

    return (
        <div className="flex h-full flex-col gap-4">
            <div className="relative mx-auto aspect-square w-32 shrink-0 sm:w-40 lg:w-44">
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

            <div
                className={`space-y-2 ${
                    shouldScrollLegend ? 'max-h-48 overflow-y-auto pr-1' : ''
                }`}
            >
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
                            <div className="flex min-w-0 items-center gap-2 text-sm">
                                <span
                                    className="size-2.5 rounded-full"
                                    style={{
                                        backgroundColor:
                                            statusColorMap[item.label],
                                    }}
                                />
                                <span className="truncate">{item.label}</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <span className="text-sm text-muted-foreground">
                                    {formatCount(item.value)}
                                </span>
                                <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    className="h-6 px-2 text-[11px]"
                                    onClick={() => {
                                        void onPrintStatus(item.label);
                                    }}
                                >
                                    <Printer className="mr-1 size-3" />
                                    Print
                                </Button>
                            </div>
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
        <div
            className={`space-y-3 ${
                data.length > 6 ? 'max-h-64 overflow-y-auto pr-1' : ''
            }`}
        >
            {data.map((item, index) => {
                const width = (item.value / maxValue) * 100;
                return (
                    <div key={item.label} className="space-y-1">
                        <div className="flex items-center justify-between text-sm">
                            <span className="truncate pr-3">{item.label}</span>
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
    const metricCardsRef = useRef<HTMLDivElement | null>(null);
    const insightCardsRef = useRef<HTMLDivElement | null>(null);
    const [metricCardOrder, setMetricCardOrder] = useState<MetricCardId[]>(
        () =>
            getStoredCardOrder(
                metricCardOrderStorageKey,
                defaultMetricCardOrder,
            ) ?? defaultMetricCardOrder,
    );
    const [insightCardOrder, setInsightCardOrder] = useState<InsightCardId[]>(
        () =>
            getStoredCardOrder(
                insightCardOrderStorageKey,
                defaultInsightCardOrder,
            ) ?? defaultInsightCardOrder,
    );

    useEffect(() => {
        let isReloading = false;

        const reloadDashboardData = () => {
            if (
                document.visibilityState === 'hidden' ||
                isReloading ||
                !window.navigator.onLine
            ) {
                return;
            }

            isReloading = true;
            router.reload({
                only: [...dashboardRealtimeKeys],
                onFinish: () => {
                    isReloading = false;
                },
            });
        };

        const intervalId = window.setInterval(
            reloadDashboardData,
            dashboardRefreshIntervalMs,
        );
        const handleVisibilityChange = () => {
            if (document.visibilityState === 'visible') {
                reloadDashboardData();
            }
        };

        document.addEventListener('visibilitychange', handleVisibilityChange);

        return () => {
            window.clearInterval(intervalId);
            document.removeEventListener(
                'visibilitychange',
                handleVisibilityChange,
            );
        };
    }, []);

    useEffect(() => {
        const container = metricCardsRef.current;
        if (!container) {
            return;
        }

        const sortable = Sortable.create(container, {
            animation: 170,
            draggable: '[data-card-id]',
            handle: '[data-drag-handle]',
            ghostClass: 'opacity-70',
            swapThreshold: 0.65,
            invertSwap: true,
            onChoose: (event) => {
                toggleDraggingCardHighlight(event.item, true);
            },
            onEnd: (event) => {
                toggleDraggingCardHighlight(event.item, false);
                const newOrder = readCardOrderFromContainer(
                    container,
                    defaultMetricCardOrder,
                );

                if (newOrder.length === defaultMetricCardOrder.length) {
                    setMetricCardOrder(newOrder);
                }
            },
        });

        return () => sortable.destroy();
    }, []);

    useEffect(() => {
        const container = insightCardsRef.current;
        if (!container) {
            return;
        }

        const sortable = Sortable.create(container, {
            animation: 170,
            draggable: '[data-card-id]',
            handle: '[data-drag-handle]',
            ghostClass: 'opacity-70',
            swapThreshold: 0.65,
            invertSwap: true,
            onChoose: (event) => {
                toggleDraggingCardHighlight(event.item, true);
            },
            onEnd: (event) => {
                toggleDraggingCardHighlight(event.item, false);
                const newOrder = readCardOrderFromContainer(
                    container,
                    defaultInsightCardOrder,
                );

                if (newOrder.length === defaultInsightCardOrder.length) {
                    setInsightCardOrder(newOrder);
                }
            },
        });

        return () => sortable.destroy();
    }, []);

    useEffect(() => {
        persistCardOrder(
            metricCardOrderStorageKey,
            metricCardOrder,
            defaultMetricCardOrder,
        );
    }, [metricCardOrder]);

    useEffect(() => {
        persistCardOrder(
            insightCardOrderStorageKey,
            insightCardOrder,
            defaultInsightCardOrder,
        );
    }, [insightCardOrder]);

    const totalTrackedStatuses =
        counts.in_stock + counts.low_stock + counts.out_of_stock;
    const metricCards = [
        {
            id: 'total_ingredients' as const,
            variant: 'stock' as const,
            title: 'Total Ingredients',
            value: formatCount(counts.total_ingredients),
            description: `${formatCount(counts.total_quantity)} combined quantity`,
            icon: Boxes,
            tone: 'text-foreground',
            cardClassName: 'sm:col-span-2 lg:col-span-3',
        },
        {
            id: 'in_stock' as const,
            variant: 'stock' as const,
            title: 'In Stock',
            value: formatCount(counts.in_stock),
            description: toPercentLabel(counts.in_stock, totalTrackedStatuses),
            icon: PackageCheck,
            tone: 'text-emerald-700 dark:text-emerald-300',
            cardClassName: 'lg:col-span-1',
        },
        {
            id: 'low_stock' as const,
            variant: 'stock' as const,
            title: 'Low Stock',
            value: formatCount(counts.low_stock),
            description: toPercentLabel(counts.low_stock, totalTrackedStatuses),
            icon: TriangleAlert,
            tone: 'text-amber-700 dark:text-amber-300',
            cardClassName: 'lg:col-span-1',
        },
        {
            id: 'out_of_stock' as const,
            variant: 'stock' as const,
            title: 'Out of Stock',
            value: formatCount(counts.out_of_stock),
            description: toPercentLabel(
                counts.out_of_stock,
                totalTrackedStatuses,
            ),
            icon: PackageX,
            tone: 'text-rose-700 dark:text-rose-300',
            cardClassName: 'lg:col-span-1',
        },
        {
            id: 'categories' as const,
            variant: 'summary' as const,
            title: 'Categories',
            value: formatCount(counts.total_categories),
            description: 'Configured ingredient groups',
            icon: Layers,
            tone: 'text-foreground',
            cardClassName: 'sm:col-span-2 lg:col-span-2',
        },
        {
            id: 'storages' as const,
            variant: 'summary' as const,
            title: 'Storage Areas',
            value: formatCount(counts.total_storages),
            description: 'Active inventory locations',
            icon: Warehouse,
            tone: 'text-foreground',
            cardClassName: 'sm:col-span-2 lg:col-span-2',
        },
        {
            id: 'users' as const,
            variant: 'summary' as const,
            title: 'Users',
            value: formatCount(counts.total_users),
            description: 'Accounts with system access',
            icon: Users,
            tone: 'text-foreground',
            cardClassName: 'sm:col-span-2 lg:col-span-2',
        },
    ] as const;
    const orderedMetricCards = orderCardsById(metricCards, metricCardOrder);

    const handlePrintStatusReport = async (status: InventoryStatus) => {
        if (typeof window === 'undefined') {
            return;
        }

        const previewWindow = window.open('', '_blank');
        if (!previewWindow) {
            return;
        }

        renderPreviewMessage(
            previewWindow,
            'Generating PDF...',
            'Generating report...',
        );

        try {
            const response = await window.fetch(
                `/dashboard/reports/status?status=${encodeURIComponent(status)}`,
                {
                    headers: {
                        Accept: 'application/json',
                    },
                    credentials: 'same-origin',
                },
            );

            if (!response.ok) {
                const payload = (await response.json().catch(() => null)) as
                    | { message?: string }
                    | null;

                throw new Error(
                    payload?.message ??
                        `Failed to load report data (${response.status})`,
                );
            }

            const { items } = (await response.json()) as {
                items: InventoryItem[];
            };
            const [
                { pdf },
                { InventoryStatusReportDocument },
            ] = await Promise.all([
                import('@react-pdf/renderer'),
                import('@/features/dashboard/inventory-status-report-document'),
            ]);
            const generatedAt = new Date().toLocaleString();
            const reportDocument = (
                <InventoryStatusReportDocument
                    status={status}
                    items={items}
                    generatedAt={generatedAt}
                />
            );
            const blob = await pdf(reportDocument).toBlob();
            const url = URL.createObjectURL(blob);
            previewWindow.location.href = url;

            window.setTimeout(() => {
                URL.revokeObjectURL(url);
            }, 60_000);
        } catch (error) {
            const message =
                error instanceof Error
                    ? error.message
                    : 'Unable to generate the report right now. Please try again.';

            toast.error(message);
            renderPreviewMessage(
                previewWindow,
                'Unable to generate report',
                message,
            );
        }
    };

    const insightCards = [
        {
            id: 'new_ingredients' as const,
            title: 'New Ingredients (Last 7 Days)',
            description: 'Daily additions trend for recent inventory intake.',
            cardClassName: 'lg:col-span-2 xl:col-span-8',
            panelClassName:
                'min-h-[18rem] min-w-0 sm:min-h-[20rem] lg:min-h-[24rem]',
            content: (
                <CardContent className="min-w-0 flex-1 pb-3">
                    <TrendChart data={dailyAdded} />
                </CardContent>
            ),
        },
        {
            id: 'stock_distribution' as const,
            title: 'Stock Distribution',
            description: 'Share of items by stock status.',
            cardClassName: 'xl:col-span-4',
            panelClassName:
                'min-h-[18rem] min-w-0 sm:min-h-[20rem] lg:min-h-[24rem]',
            content: (
                <CardContent className="min-w-0 flex-1">
                    <StatusDonutChart
                        data={statusChart}
                        total={counts.total_ingredients}
                        onPrintStatus={handlePrintStatusReport}
                    />
                </CardContent>
            ),
        },
        {
            id: 'top_categories' as const,
            title: 'Top Categories by Item Count',
            description:
                'Highest-volume categories based on current inventory.',
            cardClassName: 'lg:col-span-2 xl:col-span-8',
            panelClassName:
                'min-h-[18rem] min-w-0 sm:min-h-[20rem] lg:min-h-[24rem]',
            content: (
                <CardContent className="min-w-0 flex-1 overflow-hidden">
                    <CategoryBars data={categoryChart} />
                </CardContent>
            ),
        },
        {
            id: 'recent_additions' as const,
            title: 'Recent Additions',
            description: 'Latest ingredient records in the system.',
            cardClassName: 'xl:col-span-4',
            panelClassName:
                'min-h-[18rem] min-w-0 sm:min-h-[20rem] lg:min-h-[24rem]',
            content: (
                <CardContent className="flex-1 space-y-2.5 lg:overflow-y-auto lg:pr-1">
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
                                <p className="mt-2 text-xs break-words text-muted-foreground">
                                    {ingredient.category} - {ingredient.storage}
                                </p>
                                <p className="mt-1 text-xs text-muted-foreground">
                                    {ingredient.created_at_human ?? 'Just now'}
                                </p>
                            </div>
                        ))
                    )}
                </CardContent>
            ),
        },
    ] as const;
    const orderedInsightCards = orderCardsById(insightCards, insightCardOrder);
    const isDefaultCardLayout =
        areCardOrdersEqual(metricCardOrder, defaultMetricCardOrder) &&
        areCardOrdersEqual(insightCardOrder, defaultInsightCardOrder);

    const handleResetCardLayout = () => {
        setMetricCardOrder(defaultMetricCardOrder);
        setInsightCardOrder(defaultInsightCardOrder);
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Dashboard" />

            <div className="animate-in space-y-4 overflow-x-hidden duration-500 fade-in-0 slide-in-from-bottom-2">
                <Card className="border-border/70 bg-card/90">
                    <CardHeader className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                        <div>
                            <CardTitle className="text-xl tracking-tight sm:text-2xl">
                                Inventory Overview
                            </CardTitle>
                            <CardDescription className="mt-1">
                                Live counts, stock health, and activity trends
                                from your inventory records.
                            </CardDescription>
                        </div>
                        <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:flex-wrap sm:justify-end">
                            <Button
                                asChild
                                variant="outline"
                                size="sm"
                                className="w-full sm:w-auto"
                            >
                                <Link href={inventory()}>
                                    Open Inventory
                                    <ArrowRight className="ml-2 size-4" />
                                </Link>
                            </Button>
                            <Button
                                asChild
                                variant="outline"
                                size="sm"
                                className="w-full sm:w-auto"
                            >
                                <Link href={management()}>
                                    Open Management
                                    <ArrowRight className="ml-2 size-4" />
                                </Link>
                            </Button>
                        </div>
                    </CardHeader>
                </Card>

                <div className="flex flex-col gap-1 px-1 sm:flex-row sm:items-center sm:justify-between">
                    <h2 className="text-sm font-semibold tracking-wide text-muted-foreground">
                        Key Metrics
                    </h2>
                    <p className="text-xs text-muted-foreground">
                        Arrange cards using the top-right handle.
                    </p>
                </div>

                <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="w-full sm:w-auto"
                    onClick={handleResetCardLayout}
                    disabled={isDefaultCardLayout}
                >
                    <RotateCcw className="mr-2 size-4" />
                    Reset Layout
                </Button>

                <div
                    ref={metricCardsRef}
                    className="grid gap-4 sm:grid-cols-2 lg:grid-cols-6"
                >
                    {orderedMetricCards.map((item) => (
                        <div
                            key={item.id}
                            data-card-id={item.id}
                            className={`min-w-0 ${item.cardClassName}`}
                        >
                            <Card
                                data-dashboard-card
                                className="relative min-w-0 border-border/70 bg-card/90 shadow-sm transition-shadow hover:shadow-md"
                            >
                                <span
                                    data-drag-handle
                                    className="absolute top-3 right-3 z-10 cursor-grab rounded-sm p-0.5 text-muted-foreground active:cursor-grabbing"
                                >
                                    <GripVertical className="size-4" />
                                </span>
                                {item.variant === 'stock' ? (
                                    <>
                                        <CardHeader className="pb-2">
                                            <div className="flex items-center gap-2">
                                                <item.icon className="size-4 text-muted-foreground" />
                                                <CardDescription>
                                                    {item.title}
                                                </CardDescription>
                                            </div>
                                        </CardHeader>
                                        <CardContent>
                                            <p
                                                className={`text-2xl font-semibold tracking-tight ${item.tone}`}
                                            >
                                                {item.value}
                                            </p>
                                            <p className="mt-1 text-xs text-muted-foreground">
                                                {item.description}
                                            </p>
                                        </CardContent>
                                    </>
                                ) : (
                                    <>
                                        <CardHeader className="pb-2">
                                            <CardDescription>
                                                {item.title}
                                            </CardDescription>
                                            <CardTitle className="text-lg">
                                                {item.value}
                                            </CardTitle>
                                        </CardHeader>
                                        <CardContent className="flex items-center gap-2 text-sm text-muted-foreground">
                                            <item.icon className="size-4" />
                                            {item.description}
                                        </CardContent>
                                    </>
                                )}
                            </Card>
                        </div>
                    ))}
                </div>

                <div className="mt-2 flex flex-col gap-1 px-1 sm:flex-row sm:items-center sm:justify-between">
                    <h2 className="text-sm font-semibold tracking-wide text-muted-foreground">
                        Operational Insights
                    </h2>
                    <p className="text-xs text-muted-foreground">
                        Charts and latest activity at a glance.
                    </p>
                </div>

                <div
                    ref={insightCardsRef}
                    className="grid gap-4 lg:grid-cols-3 xl:grid-cols-12"
                >
                    {orderedInsightCards.map((item) => (
                        <div
                            key={item.id}
                            data-card-id={item.id}
                            className={`min-w-0 ${item.cardClassName}`}
                        >
                            <Card
                                data-dashboard-card
                                className={`relative flex min-w-0 flex-col border-border/70 bg-card/90 shadow-sm transition-shadow hover:shadow-md ${item.panelClassName}`}
                            >
                                <span
                                    data-drag-handle
                                    className="absolute top-3 right-3 z-10 cursor-grab rounded-sm p-0.5 text-muted-foreground active:cursor-grabbing"
                                >
                                    <GripVertical className="size-4" />
                                </span>
                                <CardHeader>
                                    <CardTitle>{item.title}</CardTitle>
                                    <CardDescription>
                                        {item.description}
                                    </CardDescription>
                                </CardHeader>
                                {item.content}
                            </Card>
                        </div>
                    ))}
                </div>
            </div>
        </AppLayout>
    );
}
