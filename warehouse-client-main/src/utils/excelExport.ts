/**
 * Xuất dữ liệu ra file Excel (dynamic import xlsx)
 */
export const exportToExcel = async (data: any[], fileName: string, sheetName: string = 'Sheet1') => {
    // Dynamic import xlsx - chỉ tải khi cần
    const XLSX = await import('xlsx');
    
    // Tạo workbook mới
    const wb = XLSX.utils.book_new();
    
    // Chuyển đổi dữ liệu thành worksheet
    const ws = XLSX.utils.json_to_sheet(data);
    
    // Thêm worksheet vào workbook
    XLSX.utils.book_append_sheet(wb, ws, sheetName);
    
    // Xuất file
    XLSX.writeFile(wb, `${fileName}.xlsx`);
};

/**
 * Xuất nhiều sheet trong một file Excel (dynamic import xlsx)
 */
export const exportMultipleSheets = async (sheets: { name: string; data: any[] }[], fileName: string) => {
    // Dynamic import xlsx - chỉ tải khi cần
    const XLSX = await import('xlsx');
    
    const wb = XLSX.utils.book_new();
    
    sheets.forEach(sheet => {
        const ws = XLSX.utils.json_to_sheet(sheet.data);
        XLSX.utils.book_append_sheet(wb, ws, sheet.name);
    });
    
    XLSX.writeFile(wb, `${fileName}.xlsx`);
};

/**
 * Format số tiền
 */
export const formatCurrency = (value: number): string => {
    return new Intl.NumberFormat('vi-VN').format(value);
};

/**
 * Format ngày tháng
 */
export const formatDate = (dateString: string): string => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('vi-VN');
};

