import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "react-query";
import { X, Plus, Trash2 } from "lucide-react";
import { ProductDTO, ProductPartnerDTO, PartnerDTO } from "../../../types";
import { productService } from "../../../services/product.service";
import { partnerService } from "../../../services/partner.service";

interface Props {
    isOpen: boolean;
    onClose: () => void;
    product: ProductDTO | null;
}

const ProductPartnersModal = ({ isOpen, onClose, product }: Props) => {
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [selectedPartnerId, setSelectedPartnerId] = useState<number>(0);
    const [defaultPrice, setDefaultPrice] = useState<string>("");
    const [partnerProductCode, setPartnerProductCode] = useState<string>("");

    const queryClient = useQueryClient();

    const { data: allPartners = [] } = useQuery<PartnerDTO[]>("partners", partnerService.getAll);
    
    // Chỉ hiển thị "Nhà cung cấp", không hiển thị "Nhà phân phối"
    const partners = allPartners.filter((p) => p.partnerType === "Nhà cung cấp");
    
    const { data: productPartners = [], isLoading } = useQuery(
        ["product-partners", product?.productId],
        () => productService.getPartners(product?.productId || 0),
        { enabled: !!product?.productId && isOpen }
    );

    const addPartnerMutation = useMutation(
        (payload: { partnerId: number; defaultPrice?: number; partnerProductCode?: string }) =>
            productService.addPartner(product?.productId || 0, payload),
        {
            onSuccess: () => {
                queryClient.invalidateQueries(["product-partners", product?.productId]);
                setSelectedPartnerId(0);
                setDefaultPrice("");
                setPartnerProductCode("");
                setIsAddModalOpen(false);
            }
        }
    );

    const deletePartnerMutation = useMutation(
        (partnerRelationId: number) => productService.deletePartner(partnerRelationId),
        {
            onSuccess: () => {
                queryClient.invalidateQueries(["product-partners", product?.productId]);
            }
        }
    );

    const handleAddPartner = () => {
        if (selectedPartnerId === 0) {
            alert("Vui lòng chọn nhà cung cấp!");
            return;
        }
        addPartnerMutation.mutate({
            partnerId: selectedPartnerId,
            defaultPrice: defaultPrice ? parseFloat(defaultPrice) : undefined,
            partnerProductCode: partnerProductCode || undefined
        });
    };

    if (!isOpen || !product) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
            <div className="absolute inset-0 bg-black/40" onClick={onClose} />
            <div className="relative bg-white rounded-lg shadow-lg w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
                {/* HEADER */}
                <div className="flex justify-between items-center p-6 border-b">
                    <h2 className="text-xl font-bold">
                        Quản lý nhà cung cấp - {product.productName}
                    </h2>
                    <button onClick={onClose}>
                        <X className="w-5 h-5 text-gray-500" />
                    </button>
                </div>

                {/* CONTENT */}
                <div className="flex-1 overflow-y-auto p-6">
                    {/* ADD BUTTON */}
                    <div className="mb-4 flex justify-between items-center">
                        <button
                            onClick={() => setIsAddModalOpen(true)}
                            className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
                        >
                            <Plus className="w-4 h-4" />
                            Thêm nhà cung cấp
                        </button>
                    </div>

                    {/* PARTNERS LIST */}
                    {isLoading ? (
                        <div className="text-center py-8">Đang tải...</div>
                    ) : productPartners.length === 0 ? (
                        <div className="text-center py-8 text-gray-500">
                            Chưa có nhà cung cấp nào
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full border-collapse">
                                <thead>
                                    <tr className="bg-gray-100">
                                        <th className="border p-2 text-left">Nhà cung cấp</th>
                                        <th className="border p-2 text-left">Giá mặc định</th>
                                        <th className="border p-2 text-left">Mã sản phẩm (NCC)</th>
                                        <th className="border p-2 text-left">Thao tác</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {productPartners.map((pp: ProductPartnerDTO) => (
                                        <tr key={pp.productPartnerId}>
                                            <td className="border p-2">{pp.partnerName}</td>
                                            <td className="border p-2">
                                                {pp.defaultPrice ? `${pp.defaultPrice.toLocaleString()} VNĐ` : "—"}
                                            </td>
                                            <td className="border p-2">{pp.partnerProductCode || "—"}</td>
                                            <td className="border p-2">
                                                <button
                                                    onClick={() => {
                                                        if (window.confirm("Bạn có chắc muốn xóa quan hệ này?")) {
                                                            deletePartnerMutation.mutate(pp.productPartnerId);
                                                        }
                                                    }}
                                                    className="p-1 text-red-600 hover:bg-red-50 rounded"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>

                {/* ADD MODAL */}
                {isAddModalOpen && (
                    <div className="fixed inset-0 z-60 flex items-center justify-center">
                        <div className="absolute inset-0 bg-black/40" onClick={() => setIsAddModalOpen(false)} />
                        <div className="relative bg-white rounded-lg shadow-lg w-full max-w-md p-6">
                            <h3 className="text-lg font-bold mb-4">Thêm nhà cung cấp</h3>
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium mb-2">Nhà cung cấp</label>
                                    <select
                                        value={selectedPartnerId}
                                        onChange={(e) => setSelectedPartnerId(Number(e.target.value))}
                                        className="w-full px-3 py-2 border rounded"
                                    >
                                        <option value={0}>-- Chọn nhà cung cấp --</option>
                                        {partners.map((p) => (
                                            <option key={p.partnerId} value={p.partnerId}>
                                                {p.partnerName}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium mb-2">Giá mặc định (VNĐ)</label>
                                    <input
                                        type="number"
                                        value={defaultPrice}
                                        onChange={(e) => setDefaultPrice(e.target.value)}
                                        placeholder="Ví dụ: 100000"
                                        className="w-full px-3 py-2 border rounded"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium mb-2">Mã sản phẩm (của nhà cung cấp)</label>
                                    <input
                                        type="text"
                                        value={partnerProductCode}
                                        onChange={(e) => setPartnerProductCode(e.target.value)}
                                        placeholder="Mã sản phẩm theo nhà cung cấp"
                                        className="w-full px-3 py-2 border rounded"
                                    />
                                </div>
                            </div>
                            <div className="flex justify-end gap-2 mt-4">
                                <button
                                    onClick={() => {
                                        setIsAddModalOpen(false);
                                        setSelectedPartnerId(0);
                                        setDefaultPrice("");
                                        setPartnerProductCode("");
                                    }}
                                    className="px-4 py-2 border rounded"
                                >
                                    Hủy
                                </button>
                                <button
                                    onClick={handleAddPartner}
                                    disabled={addPartnerMutation.isLoading}
                                    className="px-4 py-2 bg-blue-600 text-white rounded"
                                >
                                    {addPartnerMutation.isLoading ? "Đang thêm..." : "Thêm"}
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default ProductPartnersModal;

