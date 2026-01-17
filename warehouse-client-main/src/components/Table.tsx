import React from "react";

export interface Column<T> {
    title: string;
    dataIndex?: keyof T;
    width?: string | number;
    render?: (value: unknown, record: T) => React.ReactNode;
}

interface TableProps<T> {
    columns: Column<T>[];
    data: T[];
}

function Table<T extends object>({ columns, data }: TableProps<T>) {
    return (
        <div className="overflow-x-auto">
            <table className="w-full border-collapse">
                <thead className="bg-gray-100">
                    <tr>
                        {columns.map((col, idx) => (
                            <th
                                key={idx}
                                className="text-left px-4 py-2 text-xs font-semibold text-gray-600 uppercase border-italic"
                                style={{ width: col.width }}
                            >
                                {col.title}
                            </th>
                        ))}
                    </tr>
                </thead>

                <tbody>
                    {data.length === 0 && (
                        <tr>
                            <td
                                colSpan={columns.length}
                                className="text-center py-4 text-gray-500"
                            >
                                Không có dữ liệu
                            </td>
                        </tr>
                    )}

                    {data.map((row, i) => (
                        <tr key={i} className="border-b hover:bg-gray-50">
                            {columns.map((col, cIdx) => {
                                const value = col.dataIndex
                                    ? (row[col.dataIndex] as unknown)
                                    : null;

                                return (
                                    <td key={cIdx} className="px-4 py-2 text-sm text-gray-700">
                                        {col.render ? col.render(value, row) : (value as React.ReactNode)}
                                    </td>
                                );
                            })}
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}

export default Table;
