import {
    Document,
    Page,
    StyleSheet,
    Text,
    View,
} from '@react-pdf/renderer';

type ChangeType = 'added' | 'edited' | 'deleted';

export type InventoryChangeReportItem = {
    id: number;
    change_type: ChangeType;
    ingredient_name: string;
    ingredient_code: string;
    edited_by_name: string;
    changed_at: string | null;
    changed_field_count: number;
    change_summary: string;
};

type InventoryChangeReportSummary = {
    total_changes: number;
    added_count: number;
    edited_count: number;
    deleted_count: number;
    unique_ingredients: number;
    users_involved: number;
};

type InventoryChangeHistoryReportDocumentProps = {
    items: InventoryChangeReportItem[];
    summary: InventoryChangeReportSummary;
    generatedAt: string;
    periodLabel: string;
    searchLabel: string;
};

const styles = StyleSheet.create({
    page: {
        paddingHorizontal: 24,
        paddingVertical: 22,
        fontSize: 10,
        color: '#111827',
    },
    title: {
        fontSize: 15,
        fontWeight: 700,
        marginBottom: 4,
    },
    meta: {
        color: '#4b5563',
        marginBottom: 2,
    },
    summaryGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        marginTop: 10,
        marginBottom: 12,
    },
    summaryCard: {
        width: '31%',
        marginRight: '2%',
        marginBottom: 8,
        borderWidth: 1,
        borderColor: '#d1d5db',
        borderRadius: 6,
        paddingHorizontal: 8,
        paddingVertical: 6,
        backgroundColor: '#f9fafb',
    },
    summaryLabel: {
        fontSize: 8,
        color: '#6b7280',
        textTransform: 'uppercase',
        marginBottom: 3,
    },
    summaryValue: {
        fontSize: 13,
        fontWeight: 700,
    },
    sectionTitle: {
        fontSize: 11,
        fontWeight: 700,
        marginBottom: 6,
    },
    table: {
        borderWidth: 1,
        borderColor: '#d1d5db',
    },
    row: {
        flexDirection: 'row',
    },
    headerRow: {
        backgroundColor: '#f3f4f6',
        borderBottomWidth: 1,
        borderBottomColor: '#d1d5db',
    },
    bodyRow: {
        borderBottomWidth: 1,
        borderBottomColor: '#e5e7eb',
    },
    bodyRowAlt: {
        backgroundColor: '#fafafa',
    },
    cell: {
        paddingHorizontal: 5,
        paddingVertical: 4,
        borderRightWidth: 1,
        borderRightColor: '#d1d5db',
    },
    lastCell: {
        borderRightWidth: 0,
    },
    headerCellText: {
        fontSize: 8,
        fontWeight: 700,
    },
    bodyCellText: {
        fontSize: 8,
    },
    emptyState: {
        paddingVertical: 10,
        textAlign: 'center',
        color: '#6b7280',
    },
    colSeq: {
        width: '6%',
    },
    colDate: {
        width: '16%',
    },
    colIngredient: {
        width: '19%',
    },
    colCode: {
        width: '12%',
    },
    colType: {
        width: '10%',
    },
    colUser: {
        width: '15%',
    },
    colSummary: {
        width: '22%',
    },
});

const toTypeLabel = (changeType: ChangeType) => {
    if (changeType === 'added') {
        return 'Added';
    }

    if (changeType === 'deleted') {
        return 'Deleted';
    }

    return 'Edited';
};

export function InventoryChangeHistoryReportDocument({
    items,
    summary,
    generatedAt,
    periodLabel,
    searchLabel,
}: InventoryChangeHistoryReportDocumentProps) {
    return (
        <Document>
            <Page size="A4" style={styles.page}>
                <Text style={styles.title}>Inventory Change History Summary</Text>
                <Text style={styles.meta}>Generated: {generatedAt}</Text>
                <Text style={styles.meta}>Period: {periodLabel}</Text>
                <Text style={styles.meta}>Search Filter: {searchLabel}</Text>

                <View style={styles.summaryGrid}>
                    <View style={styles.summaryCard}>
                        <Text style={styles.summaryLabel}>Total Changes</Text>
                        <Text style={styles.summaryValue}>
                            {summary.total_changes}
                        </Text>
                    </View>
                    <View style={styles.summaryCard}>
                        <Text style={styles.summaryLabel}>Added</Text>
                        <Text style={styles.summaryValue}>
                            {summary.added_count}
                        </Text>
                    </View>
                    <View style={styles.summaryCard}>
                        <Text style={styles.summaryLabel}>Edited</Text>
                        <Text style={styles.summaryValue}>
                            {summary.edited_count}
                        </Text>
                    </View>
                    <View style={styles.summaryCard}>
                        <Text style={styles.summaryLabel}>Deleted</Text>
                        <Text style={styles.summaryValue}>
                            {summary.deleted_count}
                        </Text>
                    </View>
                    <View style={styles.summaryCard}>
                        <Text style={styles.summaryLabel}>
                            Unique Ingredients
                        </Text>
                        <Text style={styles.summaryValue}>
                            {summary.unique_ingredients}
                        </Text>
                    </View>
                    <View style={styles.summaryCard}>
                        <Text style={styles.summaryLabel}>Users Involved</Text>
                        <Text style={styles.summaryValue}>
                            {summary.users_involved}
                        </Text>
                    </View>
                </View>

                <Text style={styles.sectionTitle}>Activity Details</Text>

                <View style={styles.table}>
                    <View style={[styles.row, styles.headerRow]}>
                        <View style={[styles.cell, styles.colSeq]}>
                            <Text style={styles.headerCellText}>#</Text>
                        </View>
                        <View style={[styles.cell, styles.colDate]}>
                            <Text style={styles.headerCellText}>Changed At</Text>
                        </View>
                        <View style={[styles.cell, styles.colIngredient]}>
                            <Text style={styles.headerCellText}>Ingredient</Text>
                        </View>
                        <View style={[styles.cell, styles.colCode]}>
                            <Text style={styles.headerCellText}>Code</Text>
                        </View>
                        <View style={[styles.cell, styles.colType]}>
                            <Text style={styles.headerCellText}>Type</Text>
                        </View>
                        <View style={[styles.cell, styles.colUser]}>
                            <Text style={styles.headerCellText}>By</Text>
                        </View>
                        <View
                            style={[
                                styles.cell,
                                styles.lastCell,
                                styles.colSummary,
                            ]}
                        >
                            <Text style={styles.headerCellText}>Summary</Text>
                        </View>
                    </View>

                    {items.length === 0 ? (
                        <Text style={styles.emptyState}>
                            No changes found for the selected filters.
                        </Text>
                    ) : (
                        items.map((item, index) => (
                            <View
                                key={item.id}
                                wrap={false}
                                style={[
                                    styles.row,
                                    styles.bodyRow,
                                    ...(index % 2 === 1
                                        ? [styles.bodyRowAlt]
                                        : []),
                                ]}
                            >
                                <View style={[styles.cell, styles.colSeq]}>
                                    <Text style={styles.bodyCellText}>
                                        {index + 1}
                                    </Text>
                                </View>
                                <View style={[styles.cell, styles.colDate]}>
                                    <Text style={styles.bodyCellText}>
                                        {item.changed_at ?? 'Unknown'}
                                    </Text>
                                </View>
                                <View
                                    style={[styles.cell, styles.colIngredient]}
                                >
                                    <Text style={styles.bodyCellText}>
                                        {item.ingredient_name}
                                    </Text>
                                </View>
                                <View style={[styles.cell, styles.colCode]}>
                                    <Text style={styles.bodyCellText}>
                                        {item.ingredient_code}
                                    </Text>
                                </View>
                                <View style={[styles.cell, styles.colType]}>
                                    <Text style={styles.bodyCellText}>
                                        {toTypeLabel(item.change_type)}
                                    </Text>
                                </View>
                                <View style={[styles.cell, styles.colUser]}>
                                    <Text style={styles.bodyCellText}>
                                        {item.edited_by_name}
                                    </Text>
                                </View>
                                <View
                                    style={[
                                        styles.cell,
                                        styles.lastCell,
                                        styles.colSummary,
                                    ]}
                                >
                                    <Text style={styles.bodyCellText}>
                                        {item.change_summary} (
                                        {item.changed_field_count})
                                    </Text>
                                </View>
                            </View>
                        ))
                    )}
                </View>
            </Page>
        </Document>
    );
}
