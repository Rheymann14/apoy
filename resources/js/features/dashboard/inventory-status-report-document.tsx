import {
    Document,
    Page,
    StyleSheet,
    Text,
    View,
} from '@react-pdf/renderer';

type InventoryStatus = 'In Stock' | 'Low Stock' | 'Out of Stock';

export type InventoryReportItem = {
    id: number;
    name: string;
    code: string;
    category: string;
    quantity: number;
    unit: string;
    storage: string;
    status: InventoryStatus;
};

type InventoryStatusReportDocumentProps = {
    status: InventoryStatus;
    items: InventoryReportItem[];
    generatedAt: string;
};

const reportPdfStyles = StyleSheet.create({
    page: {
        paddingHorizontal: 24,
        paddingVertical: 22,
        fontSize: 10,
        color: '#111827',
    },
    title: {
        fontSize: 14,
        fontWeight: 700,
        marginBottom: 4,
    },
    meta: {
        color: '#4b5563',
        marginBottom: 10,
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
        fontSize: 9,
        fontWeight: 700,
    },
    bodyCellText: {
        fontSize: 9,
    },
    emptyState: {
        paddingVertical: 10,
        textAlign: 'center',
        color: '#6b7280',
    },
    colSeq: {
        width: '7%',
    },
    colName: {
        width: '23%',
    },
    colCode: {
        width: '12%',
    },
    colCategory: {
        width: '16%',
    },
    colQty: {
        width: '8%',
    },
    colUnit: {
        width: '10%',
    },
    colStorage: {
        width: '14%',
    },
    colStatus: {
        width: '10%',
    },
});

export function InventoryStatusReportDocument({
    status,
    items,
    generatedAt,
}: InventoryStatusReportDocumentProps) {
    return (
        <Document>
            <Page size="A4" style={reportPdfStyles.page}>
                <Text style={reportPdfStyles.title}>
                    {status} Inventory Report
                </Text>
                <Text style={reportPdfStyles.meta}>
                    Generated: {generatedAt} | Total Items: {items.length}
                </Text>

                <View style={reportPdfStyles.table}>
                    <View
                        style={[reportPdfStyles.row, reportPdfStyles.headerRow]}
                    >
                        <View
                            style={[
                                reportPdfStyles.cell,
                                reportPdfStyles.colSeq,
                            ]}
                        >
                            <Text style={reportPdfStyles.headerCellText}>
                                Seq
                            </Text>
                        </View>
                        <View
                            style={[
                                reportPdfStyles.cell,
                                reportPdfStyles.colName,
                            ]}
                        >
                            <Text style={reportPdfStyles.headerCellText}>
                                Name
                            </Text>
                        </View>
                        <View
                            style={[
                                reportPdfStyles.cell,
                                reportPdfStyles.colCode,
                            ]}
                        >
                            <Text style={reportPdfStyles.headerCellText}>
                                Code
                            </Text>
                        </View>
                        <View
                            style={[
                                reportPdfStyles.cell,
                                reportPdfStyles.colCategory,
                            ]}
                        >
                            <Text style={reportPdfStyles.headerCellText}>
                                Category
                            </Text>
                        </View>
                        <View
                            style={[
                                reportPdfStyles.cell,
                                reportPdfStyles.colQty,
                            ]}
                        >
                            <Text style={reportPdfStyles.headerCellText}>
                                Qty
                            </Text>
                        </View>
                        <View
                            style={[
                                reportPdfStyles.cell,
                                reportPdfStyles.colUnit,
                            ]}
                        >
                            <Text style={reportPdfStyles.headerCellText}>
                                Unit
                            </Text>
                        </View>
                        <View
                            style={[
                                reportPdfStyles.cell,
                                reportPdfStyles.colStorage,
                            ]}
                        >
                            <Text style={reportPdfStyles.headerCellText}>
                                Storage
                            </Text>
                        </View>
                        <View
                            style={[
                                reportPdfStyles.cell,
                                reportPdfStyles.lastCell,
                                reportPdfStyles.colStatus,
                            ]}
                        >
                            <Text style={reportPdfStyles.headerCellText}>
                                Status
                            </Text>
                        </View>
                    </View>

                    {items.length === 0 ? (
                        <Text style={reportPdfStyles.emptyState}>
                            No items found.
                        </Text>
                    ) : (
                        items.map((item, index) => (
                            <View
                                key={item.id}
                                style={[
                                    reportPdfStyles.row,
                                    reportPdfStyles.bodyRow,
                                    ...(index % 2 === 1
                                        ? [reportPdfStyles.bodyRowAlt]
                                        : []),
                                ]}
                            >
                                <View
                                    style={[
                                        reportPdfStyles.cell,
                                        reportPdfStyles.colSeq,
                                    ]}
                                >
                                    <Text style={reportPdfStyles.bodyCellText}>
                                        {index + 1}
                                    </Text>
                                </View>
                                <View
                                    style={[
                                        reportPdfStyles.cell,
                                        reportPdfStyles.colName,
                                    ]}
                                >
                                    <Text style={reportPdfStyles.bodyCellText}>
                                        {item.name}
                                    </Text>
                                </View>
                                <View
                                    style={[
                                        reportPdfStyles.cell,
                                        reportPdfStyles.colCode,
                                    ]}
                                >
                                    <Text style={reportPdfStyles.bodyCellText}>
                                        {item.code}
                                    </Text>
                                </View>
                                <View
                                    style={[
                                        reportPdfStyles.cell,
                                        reportPdfStyles.colCategory,
                                    ]}
                                >
                                    <Text style={reportPdfStyles.bodyCellText}>
                                        {item.category}
                                    </Text>
                                </View>
                                <View
                                    style={[
                                        reportPdfStyles.cell,
                                        reportPdfStyles.colQty,
                                    ]}
                                >
                                    <Text style={reportPdfStyles.bodyCellText}>
                                        {item.quantity}
                                    </Text>
                                </View>
                                <View
                                    style={[
                                        reportPdfStyles.cell,
                                        reportPdfStyles.colUnit,
                                    ]}
                                >
                                    <Text style={reportPdfStyles.bodyCellText}>
                                        {item.unit}
                                    </Text>
                                </View>
                                <View
                                    style={[
                                        reportPdfStyles.cell,
                                        reportPdfStyles.colStorage,
                                    ]}
                                >
                                    <Text style={reportPdfStyles.bodyCellText}>
                                        {item.storage}
                                    </Text>
                                </View>
                                <View
                                    style={[
                                        reportPdfStyles.cell,
                                        reportPdfStyles.lastCell,
                                        reportPdfStyles.colStatus,
                                    ]}
                                >
                                    <Text style={reportPdfStyles.bodyCellText}>
                                        {item.status}
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
