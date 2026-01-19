/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "react-query";
import { AlertCircle } from "lucide-react";
import { useAppContext } from "../../../contexts/AppContext";
import { productService } from "../../../services/product.service";
import { receivingService } from "../../../services/receiving.service";
import { partnerService } from "../../../services/partner.service";

const ReceivingFormModal = ({ isOpen, onClose }: any) => {
    const queryClient = useQueryClient();
    const { userId } = useAppContext();

    const { data: allPartners = [] } = useQuery("partners", partnerService.getAll);

    // Chỉ hiển thị "Nhà cung cấp" cho phiếu nhập
    const partners = allPartners.filter((p: any) => p.partnerType === "Nhà cung cấp");

    const [partnerId, setPartnerId] = useState<number | "">("");

    // Lấy danh sách sản phẩm theo nhà cung cấp đã chọn
    const { data: products = [] } = useQuery(
        ["products-by-partner", partnerId],
        () => partnerId ? productService.getByPartner(Number(partnerId)) : [],
        { enabled: !!partnerId && typeof partnerId === "number" }
    );
    // Delivery Code sẽ được tự động tạo bởi backend

    const [form, setForm] = useState({
        userId: 0,
        note: "",
        details: [] as any[]
    });

    // Generate preview SerialNumber format
    const generateSerialPreview = (productCode: string, quantity: number, orderCode: string = "PN-XXX") => {
        if (!productCode || quantity <= 0) return [];
        const previews = [];
        for (let i = 1; i <= quantity; i++) {
            previews.push(`${productCode}-${orderCode}-${i.toString().padStart(4, '0')}`);
        }
        return previews;
    };

    useEffect(() => {
        if (isOpen) {
            setForm({
                userId: userId as number,
                note: "",
                details: []
            });
            // Delivery Code sẽ được tự động tạo bởi backend
            setPartnerId("");
        }
    }, [isOpen, userId]);

    const addItem = () => {
        setForm({
            ...form,
            details: [
                ...form.details,
                { productId: "", quantity: 1, unit: "pcs", price: 0 }
            ]
        });
    };

    const updateItem = (index: number, key: string, value: any) => {
        const items = [...form.details];

        if (key === "productId") {
            const newProductId = Number(value);
            const currentPrice = items[index].price;

            // Tự động lấy unit từ sản phẩm được chọn
            const selectedProduct = products.find((p: any) => p.productId === newProductId);
            const productUnit = selectedProduct?.unit || "pcs";

            const existingIndex = items.findIndex((item, idx) =>
                idx !== index &&
                Number(item.productId) === newProductId &&
                Number(item.price) === currentPrice
            );

            if (existingIndex !== -1) {
                items[existingIndex].quantity += items[index].quantity;
                items.splice(index, 1);
                alert(`Đã gộp sản phẩm trùng. Số lượng mới: ${items[existingIndex].quantity}`);
            } else {
                items[index][key] = value;
                // Tự động cập nhật unit từ sản phẩm
                items[index].unit = productUnit;
            }
        }
        else if (key === "price") {
            const newPrice = Number(value);
            const currentProductId = Number(items[index].productId);

            const existingIndex = items.findIndex((item, idx) =>
                idx !== index &&
                Number(item.productId) === currentProductId &&
                Number(item.price) === newPrice
            );

            if (existingIndex !== -1) {
                items[existingIndex].quantity += items[index].quantity;
                items.splice(index, 1);
                alert(`Đã gộp sản phẩm trùng. Số lượng mới: ${items[existingIndex].quantity}`);
            } else {
                items[index][key] = value;
            }
        }
        else {
            items[index][key] = value;
        }

        setForm({ ...form, details: items });
    };

    const removeItem = (index: number) => {
        const items = [...form.details];
        items.splice(index, 1);
        setForm({ ...form, details: items });
    };

    const mutation = useMutation(receivingService.create, {
        onSuccess: () => {
            queryClient.invalidateQueries("receivings");
            alert("Tạo phiếu nhập thành công!");
            onClose();
        },
        onError: (error: any) => {
            console.error("Error creating receiving:", error);
            let errorMessage = "Không thể tạo phiếu nhập.";

            if (error?.response?.data) {
                if (typeof error.response.data === "string") {
                    errorMessage = error.response.data;
                } else if (error.response.data.message) {
                    errorMessage = error.response.data.message;
                } else if (error.response.data.errors) {
                    // Xử lý validation errors từ API
                    const errors = error.response.data.errors;
                    errorMessage = Object.keys(errors)
                        .map(key => `${key}: ${errors[key].join(", ")}`)
                        .join("\n");
                }
            } else if (error?.message) {
                errorMessage = error.message;
            }

            alert(`Lỗi: ${errorMessage}`);
        }
    });

    const handleSubmit = () => {
        // Delivery Code sẽ được tự động tạo bởi backend

        if (partnerId === "" || partnerId === null) {
            alert("Vui lòng chọn Partner!");
            return;
        }

        if (form.details.length === 0) {
            alert("Vui lòng thêm ít nhất 1 sản phẩm!");
            return;
        }

        // Validation: Kiểm tra productId hợp lệ
        const invalidProduct = form.details.find((d, idx) => {
            const productIdNum = Number(d.productId);
            return !d.productId || d.productId === "" || isNaN(productIdNum) || productIdNum <= 0;
        });
        if (invalidProduct) {
            alert("Vui lòng chọn sản phẩm hợp lệ cho tất cả các dòng!");
            return;
        }

        // Validation: Kiểm tra giá
        const invalidPrice = form.details.find((d, idx) => {
            const priceNum = Number(d.price);
            return isNaN(priceNum) || priceNum <= 0;
        });
        if (invalidPrice) {
            alert("Giá phải > 0 và là số hợp lệ!");
            return;
        }

        // Validation: Kiểm tra số lượng
        const invalidQuantity = form.details.find((d, idx) => {
            const qtyNum = Number(d.quantity);
            return isNaN(qtyNum) || qtyNum <= 0;
        });
        if (invalidQuantity) {
            alert("Số lượng phải > 0 và là số hợp lệ!");
            return;
        }

        // Validation: Kiểm tra unit
        const invalidUnit = form.details.find(d => !d.unit || d.unit.trim() === "");
        if (invalidUnit) {
            alert("Đơn vị không được để trống!");
            return;
        }

        // 👇 PAYLOAD CHUẨN THEO API
        // Delivery Code sẽ được tự động tạo bởi backend nếu không cung cấp
        const payload = {
            userId: form.userId,
            partnerId: Number(partnerId),
            deliveryCode: null, // Để backend tự động tạo
            note: form.note,
            details: form.details.map(d => ({
                productId: Number(d.productId), // Đảm bảo productId là number
                quantity: Number(d.quantity),
                unit: d.unit,
                price: Number(d.price),
                damageQuantity: d.damageQuantity ? Number(d.damageQuantity) : null,
                damageReason: d.damageReason || null
            }))
        };

        mutation.mutate(payload);
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/40 flex justify-center items-center z-50 p-2 sm:p-4">
            <div className="bg-white p-4 sm:p-6 rounded-md w-full max-w-[900px] max-h-[95vh] sm:max-h-[90vh] overflow-auto">

                <h3 className="text-lg sm:text-xl font-bold mb-4">Tạo Phiếu Nhập</h3>

                {/* Delivery Code - Tự động tạo bởi backend */}
                <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-md">
                    <p className="text-sm text-blue-800 flex items-start gap-2">
                        <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                        <span>
                            <strong>Mã giao hàng (Delivery Code)</strong> sẽ được tự động tạo bởi hệ thống (ví dụ: PG-001, PG-002, ...)
                        </span>
                    </p>
                </div>

                {/* Note */}
                <div className="mb-4">
                    <label className="text-sm font-medium">Ghi chú</label>
                    <textarea
                        className="border p-2 rounded w-full mt-1"
                        value={form.note}
                        onChange={(e) => setForm({ ...form, note: e.target.value })}
                        rows={2}
                        placeholder="Nhập ghi chú..."
                    />
                </div>

                {/* Partner */}
                <div className="mb-4">
                    <label className="text-sm font-medium">
                        Partner <span className="text-gray-500 text-xs">(Nhà cung cấp)</span>
                    </label>
                    {partners.length === 0 ? (
                        <div className="mt-1 p-3 bg-yellow-50 border border-yellow-200 rounded-md">
                            <p className="text-sm text-yellow-800">
                                Chưa có đối tác loại "Nhà cung cấp". Vui lòng tạo đối tác trước.
                            </p>
                        </div>
                    ) : (
                        <>
                            <select
                                value={partnerId}
                                onChange={(e) => {
                                    const newPartnerId = e.target.value ? Number(e.target.value) : "";
                                    setPartnerId(newPartnerId);
                                    // Xóa tất cả sản phẩm đã chọn khi đổi nhà cung cấp
                                    setForm({ ...form, details: [] });
                                }}
                                className="border p-2 rounded w-full mt-1"
                            >
                                <option value="">-- Chọn Partner --</option>
                                {partners.map((p: any) => (
                                    <option key={p.partnerId} value={p.partnerId}>
                                        {p.partnerName}
                                    </option>
                                ))}
                            </select>
                            {partnerId && products.length === 0 && (
                                <div className="mt-2 p-3 bg-yellow-50 border border-yellow-200 rounded-md">
                                    <p className="text-sm text-yellow-800">
                                        Nhà cung cấp này chưa có sản phẩm nào được cấu hình. Vui lòng thêm sản phẩm cho nhà cung cấp trước.
                                    </p>
                                </div>
                            )}
                            {partnerId && products.length > 0 && (
                                <p className="mt-1 text-sm text-gray-600">
                                    Hiển thị {products.length} sản phẩm của nhà cung cấp này
                                </p>
                            )}
                        </>
                    )}
                </div>

                {/* Product list */}
                <div className="mb-3 flex justify-between items-center">
                    <h4 className="font-semibold">Danh sách sản phẩm</h4>
                    <button
                        onClick={addItem}
                        disabled={!partnerId}
                        className="px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
                        title={!partnerId ? "Vui lòng chọn nhà cung cấp trước" : ""}
                    >
                        + Thêm sản phẩm
                    </button>
                </div>
                {!partnerId && (
                    <div className="mb-3 p-3 bg-blue-50 border border-blue-200 rounded-md">
                        <p className="text-sm text-blue-800 flex items-start gap-2">
                            <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                            <span>Vui lòng chọn nhà cung cấp trước để hiển thị danh sách sản phẩm.</span>
                        </p>
                    </div>
                )}

                {form.details.length === 0 ? (
                    <div className="border rounded p-8 text-center text-gray-500 mb-4">
                        Chưa có sản phẩm nào.
                    </div>
                ) : (
                    <>
                        {/* Desktop Table View */}
                        <div className="hidden md:block overflow-x-auto mb-4">
                            <table className="w-full border text-sm">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="border p-2 text-center">Sản phẩm</th>
                                        <th className="border p-2 text-center w-24">SL</th>
                                        <th className="border p-2 text-center w-24">Đơn vị</th>
                                        <th className="border p-2 text-center w-32">Giá Đơn vị</th>
                                        <th className="border p-2 text-center w-48">Preview SerialNumber</th>
                                        <th className="border p-2 text-center w-16"></th>
                                    </tr>
                                </thead>

                                <tbody>
                                    {form.details.map((item, index) => (
                                        <tr key={index} className="hover:bg-gray-50">
                                            <td className="border p-2">
                                                <select
                                                    value={item.productId}
                                                    className="border p-1 rounded w-full text-sm"
                                                    onChange={(e) =>
                                                        updateItem(index, "productId", e.target.value)
                                                    }
                                                >
                                                    <option value="">-- Chọn sản phẩm --</option>
                                                    {products.map((p: any) => (
                                                        <option key={p.productId} value={p.productId}>
                                                            {p.productName}
                                                        </option>
                                                    ))}
                                                </select>
                                            </td>

                                            <td className="border p-2">
                                                <input
                                                    type="number"
                                                    min={1}
                                                    value={item.quantity}
                                                    className="border p-1 rounded w-full text-center text-sm"
                                                    onChange={(e) =>
                                                        updateItem(index, "quantity", Number(e.target.value))
                                                    }
                                                />
                                            </td>

                                            <td className="border p-2">
                                                <input
                                                    value={item.unit}
                                                    className="border p-1 rounded w-full text-center text-sm"
                                                    onChange={(e) =>
                                                        updateItem(index, "unit", e.target.value)
                                                    }
                                                    placeholder="pcs"
                                                />
                                            </td>

                                            <td className="border p-2">
                                                <input
                                                    type="number"
                                                    min={1}
                                                    className="border p-1 rounded w-full text-right text-sm"
                                                    value={item.price}
                                                    onChange={(e) => {
                                                        const value = Number(e.target.value);
                                                        if (value > 0 || e.target.value === "") {
                                                            updateItem(index, "price", value);
                                                        }
                                                    }}
                                                    placeholder="Nhập giá"
                                                />
                                            </td>

                                            <td className="border p-2">
                                                {item.productId && item.quantity > 0 ? (
                                                    <div className="text-xs">
                                                        <div className="max-h-20 overflow-y-auto bg-gray-50 p-1 rounded">
                                                            {generateSerialPreview(
                                                                products.find((p: any) => p.productId === Number(item.productId))?.productCode || "",
                                                                item.quantity,
                                                                "PN-XXX"
                                                            ).slice(0, 5).map((sn, i) => (
                                                                <div key={i} className="font-mono text-blue-600">
                                                                    {sn}
                                                                </div>
                                                            ))}
                                                            {item.quantity > 5 && (
                                                                <div className="text-gray-500 italic">
                                                                    ... và {item.quantity - 5} số khác
                                                                </div>
                                                            )}
                                                        </div>
                                                        <div className="text-gray-500 mt-1">
                                                            Format: {products.find((p: any) => p.productId === Number(item.productId))?.productCode || "CODE"}-PN-XXXX
                                                        </div>
                                                    </div>
                                                ) : (
                                                    <span className="text-gray-400 text-xs">Chọn sản phẩm và nhập SL</span>
                                                )}
                                            </td>

                                            <td className="border p-2 text-center">
                                                <button
                                                    className="text-red-600 hover:bg-red-50 p-1 rounded transition"
                                                    onClick={() => removeItem(index)}
                                                >
                                                    ✕
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        {/* Mobile Card View */}
                        <div className="md:hidden space-y-3 mb-4">
                            {form.details.map((item, index) => (
                                <div key={index} className="border rounded-lg p-3 bg-gray-50">
                                    <div className="mb-3">
                                        <label className="text-xs text-gray-600 mb-1 block">Sản phẩm</label>
                                        <select
                                            value={item.productId}
                                            className="border p-2 rounded w-full text-sm"
                                            onChange={(e) =>
                                                updateItem(index, "productId", e.target.value)
                                            }
                                        >
                                            <option value="">-- Chọn sản phẩm --</option>
                                            {products.map((p: any) => (
                                                <option key={p.productId} value={p.productId}>
                                                    {p.productName}
                                                </option>
                                            ))}
                                        </select>
                                    </div>

                                    <div className="grid grid-cols-3 gap-2">
                                        <div>
                                            <label className="text-xs text-gray-600 mb-1 block">SL</label>
                                            <input
                                                type="number"
                                                min={1}
                                                value={item.quantity}
                                                className="border p-2 rounded w-full text-center text-sm"
                                                onChange={(e) =>
                                                    updateItem(index, "quantity", Number(e.target.value))
                                                }
                                            />
                                        </div>

                                        <div>
                                            <label className="text-xs text-gray-600 mb-1 block">Đơn vị</label>
                                            <input
                                                value={item.unit}
                                                className="border p-2 rounded w-full text-center text-sm"
                                                onChange={(e) =>
                                                    updateItem(index, "unit", e.target.value)
                                                }
                                                placeholder="pcs"
                                            />
                                        </div>

                                        <div>
                                            <label className="text-xs text-gray-600 mb-1 block">Giá đơn vị </label>
                                            <input
                                                type="number"
                                                min={1}
                                                className="border p-2 rounded w-full text-right text-sm"
                                                value={item.price}
                                                onChange={(e) => {
                                                    const value = Number(e.target.value);
                                                    if (value > 0 || e.target.value === "") {
                                                        updateItem(index, "price", value);
                                                    }
                                                }}
                                                placeholder="0"
                                            />
                                        </div>
                                    </div>

                                    {/* Preview SerialNumber cho mobile */}
                                    {item.productId && item.quantity > 0 && (
                                        <div className="mt-3 p-2 bg-blue-50 rounded border border-blue-200">
                                            <div className="text-xs font-semibold text-blue-800 mb-1">
                                                Preview SerialNumber:
                                            </div>
                                            <div className="text-xs space-y-1 max-h-24 overflow-y-auto">
                                                {generateSerialPreview(
                                                    products.find((p: any) => p.productId === Number(item.productId))?.productCode || "",
                                                    item.quantity,
                                                    "PN-XXX"
                                                ).slice(0, 3).map((sn, i) => (
                                                    <div key={i} className="font-mono text-blue-600 text-xs">
                                                        {sn}
                                                    </div>
                                                ))}
                                                {item.quantity > 3 && (
                                                    <div className="text-gray-500 italic text-xs">
                                                        ... và {item.quantity - 3} số khác
                                                    </div>
                                                )}
                                            </div>
                                            <div className="text-xs text-gray-500 mt-1">
                                                Format: {products.find((p: any) => p.productId === Number(item.productId))?.productCode || "CODE"}-PN-XXXX
                                            </div>
                                        </div>
                                    )}

                                    <button
                                        className="mt-2 w-full text-red-600 hover:bg-red-50 p-2 rounded transition text-sm"
                                        onClick={() => removeItem(index)}
                                    >
                                        ✕ Xóa
                                    </button>
                                </div>
                            ))}
                        </div>
                    </>
                )}

                <div className="flex flex-col sm:flex-row justify-end gap-3 mt-5">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 bg-gray-300 rounded hover:bg-gray-400 transition w-full sm:w-auto"
                    >
                        Hủy
                    </button>

                    <button
                        onClick={handleSubmit}
                        className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition disabled:opacity-50 w-full sm:w-auto"
                        disabled={mutation.isLoading}
                    >
                        {mutation.isLoading ? "Đang lưu..." : "Lưu phiếu nhập"}
                    </button>
                </div>

            </div>
        </div>
    );
};

export default ReceivingFormModal;
