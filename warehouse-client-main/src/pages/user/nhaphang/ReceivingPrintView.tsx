import { useQuery } from "react-query";
import { useParams, useNavigate } from "react-router-dom";
import { Printer, ArrowLeft } from "lucide-react";
import { receivingService } from "../../../services/receiving.service";

const formatVND = (value: number) =>
    value.toLocaleString("vi-VN", { style: "currency", currency: "VND" });

const formatDate = (dateString: string | undefined) => {
    if (!dateString) return "—";
    return new Date(dateString).toLocaleDateString("vi-VN", {
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit"
    });
};

const ReceivingPrintView = () => {
    const { receivingId } = useParams<{ receivingId: string }>();
    const navigate = useNavigate();

    const { data: receiving, isLoading, error } = useQuery(
        ["receiving-print", receivingId],
        () => {
            if (!receivingId) {
                throw new Error("ReceivingId is required");
            }
            return receivingService.getById(Number(receivingId));
        },
        {
            enabled: !!receivingId,
            retry: 1
        }
    );

    const handlePrint = () => {
        window.print();
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    if (error || !receiving) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="text-center">
                    <p className="text-red-600 mb-4">Không tìm thấy phiếu nhập</p>
                    <button
                        onClick={() => navigate("/user/nhaphang")}
                        className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                    >
                        Quay lại
                    </button>
                </div>
            </div>
        );
    }

    const details = receiving.details || [];
    const totalMoney = details.reduce((sum: number, d: any) => {
        return sum + (d.price || 0) * (d.quantity || 0);
    }, 0);

    return (
        <div className="min-h-screen bg-white p-4 sm:p-8">
            {/* Print Controls - Hidden when printing */}
            <div className="mb-4 print:hidden flex justify-between items-center">
                    <button
                        onClick={() => navigate("/nhaphang")}
                        className="flex items-center gap-2 px-4 py-2 bg-gray-300 rounded hover:bg-gray-400 transition"
                    >
                        <ArrowLeft className="w-4 h-4" />
                        Quay lại
                    </button>
                <button
                    onClick={handlePrint}
                    className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition"
                >
                    <Printer className="w-4 h-4" />
                    In phiếu nhập
                </button>
            </div>

            {/* Print Content */}
            <div className="max-w-4xl mx-auto bg-white print:max-w-full print:mx-0">
                {/* Header */}
                <div className="text-center mb-6 border-b-2 border-gray-800 pb-4">
                    <h1 className="text-2xl font-bold mb-2">PHIẾU NHẬP KHO</h1>
                    <p className="text-sm text-gray-600">Warehouse Management System</p>
                </div>

                {/* Thông tin phiếu nhập */}
                <div className="grid grid-cols-2 gap-6 mb-6">
                    <div className="space-y-2">
                        <div className="flex">
                            <span className="font-semibold w-32">Mã phiếu nhập:</span>
                            <span>{receiving.orderCode || "—"}</span>
                        </div>
                        <div className="flex">
                            <span className="font-semibold w-32">Mã giao hàng:</span>
                            <span>{receiving.deliveryCode || "—"}</span>
                        </div>
                        <div className="flex">
                            <span className="font-semibold w-32">Người tạo:</span>
                            <span>{receiving.userName || "—"}</span>
                        </div>
                        <div className="flex">
                            <span className="font-semibold w-32">Ngày tạo:</span>
                            <span>{formatDate(receiving.createdDate)}</span>
                        </div>
                    </div>
                    <div className="space-y-2">
                        <div className="flex">
                            <span className="font-semibold w-32">Đối tác:</span>
                            <span>{receiving.partnerName || "—"}</span>
                        </div>
                        <div className="flex">
                            <span className="font-semibold w-32">Trạng thái:</span>
                            <span className={`px-2 py-1 rounded text-xs ${
                                receiving.status === 1
                                    ? "bg-green-100 text-green-700"
                                    : receiving.status === 3
                                        ? "bg-red-100 text-red-700"
                                        : receiving.status === 2
                                            ? "bg-orange-100 text-orange-700"
                                            : "bg-yellow-100 text-yellow-700"
                            }`}>
                                {receiving.status === 1 ? "Đã hoàn tất" : 
                                 receiving.status === 3 ? "Đã hủy" : 
                                 receiving.status === 2 ? "Một phần" : "Chờ xử lý"}
                            </span>
                        </div>
                        {receiving.note && (
                            <div className="flex">
                                <span className="font-semibold w-32">Ghi chú:</span>
                                <span className="flex-1">{receiving.note}</span>
                            </div>
                        )}
                    </div>
                </div>

                {/* Bảng chi tiết sản phẩm */}
                <div className="mb-6">
                    <h2 className="text-lg font-bold mb-3">Danh sách sản phẩm</h2>
                    <table className="w-full border-collapse border border-gray-800 text-sm">
                        <thead>
                            <tr className="bg-gray-100">
                                <th className="border border-gray-800 p-2 text-left">STT</th>
                                <th className="border border-gray-800 p-2 text-left">Tên sản phẩm</th>
                                <th className="border border-gray-800 p-2 text-center">Đơn vị</th>
                                <th className="border border-gray-800 p-2 text-center">SL dự kiến</th>
                                <th className="border border-gray-800 p-2 text-center">SL thực tế</th>
                                <th className="border border-gray-800 p-2 text-center">SL hàng lỗi</th>
                                <th className="border border-gray-800 p-2 text-left">Lý do lỗi</th>
                                <th className="border border-gray-800 p-2 text-right">Đơn giá</th>
                                <th className="border border-gray-800 p-2 text-right">Thành tiền</th>
                                <th className="border border-gray-800 p-2 text-left">Ghi chú</th>
                            </tr>
                        </thead>
                        <tbody>
                            {details.length > 0 ? (
                                details.map((d: any, index: number) => {
                                    const actualQty = d.actualQuantity ?? d.quantity ?? 0;
                                    const damageQty = d.damageQuantity ?? 0;
                                    const unitPrice = d.price || 0;
                                    const totalPrice = unitPrice * actualQty;
                                    
                                    return (
                                        <tr key={d.receivingDetailId}>
                                            <td className="border border-gray-800 p-2 text-center">{index + 1}</td>
                                            <td className="border border-gray-800 p-2">{d.productName || "—"}</td>
                                            <td className="border border-gray-800 p-2 text-center">{d.unit || "—"}</td>
                                            <td className="border border-gray-800 p-2 text-center">{d.quantity || 0}</td>
                                            <td className="border border-gray-800 p-2 text-center">
                                                <div className="min-h-[40px] border-b border-dashed border-gray-400">
                                                    {actualQty > 0 ? actualQty : ""}
                                                </div>
                                            </td>
                                            <td className="border border-gray-800 p-2 text-center">
                                                <div className="min-h-[40px] border-b border-dashed border-gray-400">
                                                    {damageQty > 0 ? damageQty : ""}
                                                </div>
                                            </td>
                                            <td className="border border-gray-800 p-2">
                                                <div className="min-h-[40px] border-b border-dashed border-gray-400">
                                                    {d.damageReason || ""}
                                                </div>
                                            </td>
                                            <td className="border border-gray-800 p-2 text-right">{formatVND(unitPrice)}</td>
                                            <td className="border border-gray-800 p-2 text-right font-semibold">{formatVND(totalPrice)}</td>
                                            <td className="border border-gray-800 p-2">
                                                <div className="min-h-[40px] border-b border-dashed border-gray-400">
                                                    {/* Chỗ để nhân viên ghi chú */}
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })
                            ) : (
                                <tr>
                                    <td colSpan={10} className="border border-gray-800 p-4 text-center text-gray-500">
                                        Không có chi tiết sản phẩm
                                    </td>
                                </tr>
                            )}
                        </tbody>
                        <tfoot>
                            <tr>
                                <td colSpan={8} className="border border-gray-800 p-2 text-right font-bold">
                                    TỔNG TIỀN:
                                </td>
                                <td colSpan={2} className="border border-gray-800 p-2 text-right font-bold text-lg">
                                    {formatVND(totalMoney)}
                                </td>
                            </tr>
                        </tfoot>
                    </table>
                </div>

                {/* Chữ ký */}
                <div className="grid grid-cols-3 gap-8 mt-12 print:mt-16">
                    <div className="text-center">
                        <p className="font-semibold mb-12">Người lập phiếu</p>
                        <p className="border-t border-gray-800 pt-2">{receiving.userName || "—"}</p>
                    </div>
                    <div className="text-center">
                        <p className="font-semibold mb-12">Người nhận hàng</p>
                        <p className="border-t border-gray-800 pt-2">_________________</p>
                    </div>
                    <div className="text-center">
                        <p className="font-semibold mb-12">Người giao hàng</p>
                        <p className="border-t border-gray-800 pt-2">_________________</p>
                    </div>
                </div>

                {/* Footer note */}
                <div className="mt-8 text-xs text-gray-600 border-t border-gray-300 pt-4 print:mt-12">
                    <p><strong>Lưu ý:</strong></p>
                    <ul className="list-disc list-inside mt-2 space-y-1">
                        <li>Vui lòng kiểm tra kỹ số lượng và chất lượng hàng hóa trước khi ký xác nhận.</li>
                        <li>Ghi rõ số lượng thực tế và số lượng hàng lỗi (nếu có) vào các cột tương ứng.</li>
                        <li>Phiếu này được in từ hệ thống quản lý kho và có giá trị pháp lý.</li>
                    </ul>
                </div>
            </div>

            {/* Print Styles */}
            <style>{`
                @media print {
                    body {
                        margin: 0;
                        padding: 0;
                    }
                    .print\\:hidden {
                        display: none !important;
                    }
                    .print\\:max-w-full {
                        max-width: 100% !important;
                    }
                    .print\\:mx-0 {
                        margin-left: 0 !important;
                        margin-right: 0 !important;
                    }
                    .print\\:mt-16 {
                        margin-top: 4rem !important;
                    }
                    .print\\:mt-12 {
                        margin-top: 3rem !important;
                    }
                    @page {
                        margin: 1cm;
                        size: A4;
                    }
                }
            `}</style>
        </div>
    );
};

export default ReceivingPrintView;
