import { useState, useEffect } from "react";
import { useMutation, useQuery, useQueryClient } from "react-query";
import { X, Upload, Trash2 } from "lucide-react";
import {
    ProductDTO,
    ProductCreateDTO,
    ProductUpdateDTO
} from "../../../types";
import { categoryService } from "../../../services/category.service";
import { productService } from "../../../services/product.service";
import { uploadService } from "../../../services/upload.service";
import { getImageUrl } from "../../../utils/imageUrl";

interface Props {
    isOpen: boolean;
    onClose: () => void;
    product?: ProductDTO | null;
}

const ProductModal = ({ isOpen, onClose, product }: Props) => {
    const [formData, setFormData] = useState<ProductCreateDTO>({
        productCode: "",
        productName: "",
        categoryId: 0,
        unit: "",
        description: "",
        warrantyPeriod: undefined
    });
    const [imageFile, setImageFile] = useState<File | null>(null);
    const [imagePreview, setImagePreview] = useState<string | null>(null);
    const [currentImageUrl, setCurrentImageUrl] = useState<string | null>(null);

    const queryClient = useQueryClient();
    const isEdit = !!product;

    const { data: categories = [] } = useQuery(
        "categories",
        categoryService.getAll
    );

    // ================================
    // LOAD DATA VÀO FORM (CREATE / EDIT)
    // ================================
    useEffect(() => {
        if (product) {
            setFormData({
                productCode: product.productCode,
                productName: product.productName,
                categoryId: product.categoryId,
                unit: product.unit || "",
                description: product.description || "",
                warrantyPeriod: product.warrantyPeriod
            });
            setCurrentImageUrl(product.imageUrl || null);
            setImagePreview(null);
            setImageFile(null);
        } else {
            setFormData({
                productCode: "",
                productName: "",
                categoryId: categories[0]?.categoryId || 0,
                unit: "",
                description: "",
                warrantyPeriod: undefined
            });
            setCurrentImageUrl(null);
            setImagePreview(null);
            setImageFile(null);
        }
    }, [product, categories]);

    // ================================
    // CREATE
    // ================================
    const createMutation = useMutation(
        (payload: ProductCreateDTO) => productService.create(payload),
        {
            onSuccess: async (newProduct) => {
                // Upload image if selected
                if (imageFile && newProduct?.productId) {
                    try {
                        await uploadService.uploadProductImage(newProduct.productId, imageFile);
                    } catch (error) {
                        console.error("Error uploading image:", error);
                    }
                }
                queryClient.invalidateQueries("products");
                onClose();
            }
        }
    );

    // ================================
    // UPDATE
    // ================================
    const updateMutation = useMutation(
        (payload: { id: number; data: ProductUpdateDTO }) =>
            productService.update(payload.id, payload.data),
        {
            onSuccess: async (_, variables) => {
                // Upload image if selected
                if (imageFile && variables.id) {
                    try {
                        await uploadService.uploadProductImage(variables.id, imageFile);
                    } catch (error) {
                        console.error("Error uploading image:", error);
                    }
                }
                queryClient.invalidateQueries("products");
                onClose();
            }
        }
    );

    // ================================
    // UPLOAD IMAGE
    // ================================
    const uploadImageMutation = useMutation(
        ({ productId, file }: { productId: number; file: File }) =>
            uploadService.uploadProductImage(productId, file),
        {
            onSuccess: () => {
                queryClient.invalidateQueries("products");
            }
        }
    );

    const deleteImageMutation = useMutation(
        (productId: number) => uploadService.deleteProductImage(productId),
        {
            onSuccess: () => {
                setCurrentImageUrl(null);
                queryClient.invalidateQueries("products");
            }
        }
    );

    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            // Validate file size (5MB max)
            if (file.size > 5 * 1024 * 1024) {
                alert("File quá lớn. Kích thước tối đa là 5MB.");
                e.target.value = '';
                return;
            }
            // Validate file type
            const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
            if (!allowedTypes.includes(file.type)) {
                alert("Định dạng file không hợp lệ. Chỉ chấp nhận: jpg, jpeg, png, gif, webp");
                e.target.value = '';
                return;
            }
            setImageFile(file);
            const reader = new FileReader();
            reader.onloadend = () => {
                setImagePreview(reader.result as string);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleDeleteImage = (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        if (product && currentImageUrl) {
            // Xóa hình ảnh đã lưu trên server
            if (window.confirm("Bạn có chắc muốn xóa hình ảnh này?")) {
                deleteImageMutation.mutate(product.productId);
            }
        } else if (imagePreview || imageFile) {
            // Xóa preview khi đang tạo mới
            if (window.confirm("Bạn có chắc muốn xóa hình ảnh đã chọn?")) {
                setImageFile(null);
                setImagePreview(null);
            }
        }
    };

    // ================================
    // SUBMIT FORM
    // ================================
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (formData.categoryId === 0) {
            alert("Vui lòng chọn danh mục!");
            return;
        }

        try {
            if (isEdit && product) {
                await updateMutation.mutateAsync({
                    id: product.productId,
                    data: formData
                });
                // Upload image after update (already handled in onSuccess, but keeping for safety)
                if (imageFile) {
                    await uploadImageMutation.mutateAsync({
                        productId: product.productId,
                        file: imageFile
                    });
                }
            } else {
                // Create product - image upload is handled in createMutation.onSuccess
                await createMutation.mutateAsync(formData);
            }
        } catch (error) {
            console.error("Error submitting form:", error);
            alert("Có lỗi xảy ra khi lưu sản phẩm. Vui lòng thử lại.");
        }
    };

    // ================================
    // HANDLE INPUT CHANGE
    // ================================
    const handleChange = (
        e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
    ) => {
        const { name, value } = e.target;

        setFormData((prev) => ({
            ...prev,
            [name]: name === "categoryId" || name === "warrantyPeriod" ? Number(value) || undefined : value
        }));
    };

    if (!isOpen) return null;

    const loading = createMutation.isLoading || updateMutation.isLoading;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
            <div className="absolute inset-0 bg-black/40" onClick={onClose} />

            <div className="relative bg-white rounded-lg shadow-lg w-full max-w-lg p-6">
                {/* HEADER */}
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-xl font-bold">
                        {isEdit ? "Sửa sản phẩm" : "Thêm sản phẩm"}
                    </h2>
                    <button onClick={onClose}>
                        <X className="w-5 h-5 text-gray-500" />
                    </button>
                </div>

                {/* FORM */}
                <form onSubmit={handleSubmit} className="space-y-4">
                    {/* PRODUCT CODE */}
                    <div>
                        <label className="block text-sm font-medium">Mã sản phẩm</label>
                        <input
                            name="productCode"
                            value={formData.productCode}
                            onChange={handleChange}
                            className="w-full px-3 py-2 border rounded"
                            required
                        />
                    </div>

                    {/* PRODUCT NAME */}
                    <div>
                        <label className="block text-sm font-medium">Tên sản phẩm</label>
                        <input
                            name="productName"
                            value={formData.productName}
                            onChange={handleChange}
                            className="w-full px-3 py-2 border rounded"
                            required
                        />
                    </div>

                    {/* CATEGORY */}
                    <div>
                        <label className="block text-sm font-medium">Danh mục</label>
                        <select
                            name="categoryId"
                            value={formData.categoryId}
                            onChange={handleChange}
                            className="w-full px-3 py-2 border rounded"
                            required
                        >
                            <option value={0}>-- Chọn danh mục --</option>
                            {categories.map((cat) => (
                                <option key={cat.categoryId} value={cat.categoryId}>
                                    {cat.categoryName}
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* UNIT */}
                    <div>
                        <label className="block text-sm font-medium">Đơn vị</label>
                        <input
                            name="unit"
                            value={formData.unit}
                            onChange={handleChange}
                            className="w-full px-3 py-2 border rounded"
                            placeholder="pcs, box, kg..."
                        />
                    </div>

                    {/* DESCRIPTION */}
                    <div>
                        <label className="block text-sm font-medium">Mô tả</label>
                        <input
                            name="description"
                            value={formData.description}
                            onChange={handleChange}
                            className="w-full px-3 py-2 border rounded"
                            placeholder="Ghi chú mô tả"
                        />
                    </div>

                    {/* WARRANTY PERIOD */}
                    <div>
                        <label className="block text-sm font-medium">Thời gian bảo hành (tháng)</label>
                        <input
                            type="number"
                            name="warrantyPeriod"
                            value={formData.warrantyPeriod || ""}
                            onChange={handleChange}
                            className="w-full px-3 py-2 border rounded"
                            placeholder="Ví dụ: 12"
                            min="0"
                        />
                    </div>

                    {/* IMAGE UPLOAD */}
                    <div>
                        <label className="block text-sm font-medium mb-2">Hình ảnh sản phẩm</label>
                        {(currentImageUrl || imagePreview) && (
                            <div className="mb-2 relative inline-block">
                                <img
                                    src={imagePreview || getImageUrl(currentImageUrl) || ""}
                                    alt="Product"
                                    className="w-32 h-32 object-cover rounded border"
                                    onError={(e) => {
                                        // Ẩn hình ảnh nếu không load được
                                        const target = e.target as HTMLImageElement;
                                        target.style.display = 'none';
                                    }}
                                />
                                {(isEdit && currentImageUrl) || (!isEdit && imagePreview) ? (
                                    <button
                                        type="button"
                                        onClick={handleDeleteImage}
                                        className="absolute top-0 right-0 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
                                        title={isEdit ? "Xóa hình ảnh" : "Xóa preview"}
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                ) : null}
                            </div>
                        )}
                        <label
                            htmlFor="product-image-upload"
                            className="flex items-center gap-2 px-4 py-2 border rounded cursor-pointer hover:bg-gray-50"
                        >
                            <Upload className="w-4 h-4" />
                            <span className="text-sm">Chọn hình ảnh</span>
                            <input
                                id="product-image-upload"
                                type="file"
                                accept="image/*"
                                onChange={handleImageChange}
                                className="hidden"
                            />
                        </label>
                    </div>

                    {/* ACTIONS */}
                    <div className="flex justify-end gap-2">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2 border rounded"
                        >
                            Hủy
                        </button>
                        <button
                            type="submit"
                            disabled={loading}
                            className="px-4 py-2 bg-blue-600 text-white rounded"
                        >
                            {loading ? "Đang xử lý..." : isEdit ? "Cập nhật" : "Thêm"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default ProductModal;
