import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "react-query";
import { Plus, Search, Edit, Trash2, Hash, Building2 } from "lucide-react";
import ProductModal from "./SanphamModal";
import ProductSeriesModal from "./ProductSeriesModal";
import ProductPartnersModal from "./ProductPartnersModal";
import Table, { Column } from "../../../components/Table";
import { ProductDTO } from "../../../types";
import { productService } from "../../../services/product.service";
import { categoryService } from "../../../services/category.service";
import { getImageUrl } from "../../../utils/imageUrl";
import { extractDataFromResponse, extractPaginationFromResponse } from "../../../utils/pagination";
import Pagination from "../../../components/Pagination";

const Sanpham = () => {
    const [searchTerm, setSearchTerm] = useState("");
    const [selectedCategory, setSelectedCategory] = useState("");
    const [sortBy, setSortBy] = useState("name-asc");
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isSeriesModalOpen, setIsSeriesModalOpen] = useState(false);
    const [isPartnersModalOpen, setIsPartnersModalOpen] = useState(false);
    const [selectedProduct, setSelectedProduct] = useState<ProductDTO | null>(null);
   
    const queryClient = useQueryClient();

    const [page, setPage] = useState(1);
    const pageSize = 50;

    // =============================
    // FETCH PRODUCTS & CATEGORIES
    // =============================
    const { data: productResponse, isLoading: loadingProducts } = useQuery(
        ["products", page],
        () => productService.getAll(page, pageSize)
    );

    // Extract data và pagination từ response
    const products = extractDataFromResponse<ProductDTO>(productResponse);
    const productPagination = extractPaginationFromResponse(productResponse);

    const { data: categories = [] } = useQuery("categories", categoryService.getAll);

    const getCategoryName = (id: number) => {
        const cat = categories.find(c => c.categoryId === id);
        return cat ? cat.categoryName : "—";
    };

   const deleteMutation = useMutation(productService.delete, {
    onSuccess: () => {
        queryClient.invalidateQueries("products");
        alert("Xóa sản phẩm thành công");
    },
    onError: (error: any) => {
        alert(error.message);
    }
    });


    // =============================
    // FILTER + SORT
    // =============================
    const filteredProducts = products
        .filter((product) => {
            const name = product.productName || "";
            const code = product.productCode || "";
            const matchSearch =
                name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                code.toLowerCase().includes(searchTerm.toLowerCase());
            const matchCategory =
                !selectedCategory || product.categoryId === Number(selectedCategory);
            return matchSearch && matchCategory;
        })
        .sort((a, b) => {
            switch (sortBy) {
                case "name-asc":
                    return a.productName.localeCompare(b.productName);
                case "name-desc":
                    return b.productName.localeCompare(a.productName);
                case "code-asc":
                    return a.productCode.localeCompare(b.productCode);
                case "code-desc":
                    return b.productCode.localeCompare(a.productCode);
                default:
                    return 0;
            }
        });
    
    

    const handleDelete = (id: number) => {
        if (window.confirm("Bạn có chắc muốn xóa sản phẩm này?")) {
            deleteMutation.mutate(id);
        }
    };

    const handleAdd = () => {
        setSelectedProduct(null);
        setIsModalOpen(true);
    };

    const handleEdit = (product: ProductDTO) => {
        setSelectedProduct(product);
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setSelectedProduct(null);
    };

    if (loadingProducts) return <div className="p-4">Đang tải...</div>;

    // =============================
    // TABLE COLUMNS
    // =============================
    const columns: Column<ProductDTO>[] = [
        {
            title: "Hình ảnh",
            render: (_, row) => {
                const imageUrl = getImageUrl(row.imageUrl);
                return imageUrl ? (
                    <img
                        src={imageUrl}
                        alt={row.productName}
                        className="w-12 h-12 object-cover rounded"
                        onError={(e) => {
                            // Fallback nếu hình ảnh không load được
                            const target = e.target as HTMLImageElement;
                            target.style.display = 'none';
                            const parent = target.parentElement;
                            if (parent && !parent.querySelector('.image-placeholder')) {
                                const placeholder = document.createElement('div');
                                placeholder.className = 'w-12 h-12 bg-gray-200 rounded flex items-center justify-center text-gray-400 text-xs image-placeholder';
                                placeholder.textContent = 'No img';
                                parent.appendChild(placeholder);
                            }
                        }}
                    />
                ) : (
                    <div className="w-12 h-12 bg-gray-200 rounded flex items-center justify-center text-gray-400 text-xs">
                        No img
                    </div>
                );
            },
        },
        { title: "Mã SP", dataIndex: "productCode" },
        { title: "Tên sản phẩm", dataIndex: "productName" },

        //Thêm cột ở đây
        //{ title: "TEST" , render(_, row) 
        //    { return <span>{row.productName}-{row.productCode}</span>; }
        //},

        {
            title: "Danh mục",
            render: (_, row) => (
                <span className="px-2 py-1 bg-gray-100 rounded text-sm">
                    {getCategoryName(row.categoryId)}
                </span>
            ),
        },
        { title: "Đơn vị", dataIndex: "unit" },
        {
            title: "Bảo hành",
            render: (_, row) => (
                row.warrantyPeriod ? (
                    <span className="text-sm">{row.warrantyPeriod} tháng</span>
                ) : (
                    <span className="text-gray-400 text-sm">—</span>
                )
            ),
        },
        {
            title: "Thao tác",
            render: (_, row) => (
                <div className="flex justify-end gap-2">
                    <button
                        onClick={() => {
                            setSelectedProduct(row);
                            setIsSeriesModalOpen(true);
                        }}
                        className="p-2 text-purple-600 hover:bg-purple-50 rounded"
                        title="Quản lý số series"
                    >
                        <Hash className="w-4 h-4" />
                    </button>
                    <button
                        onClick={() => {
                            setSelectedProduct(row);
                            setIsPartnersModalOpen(true);
                        }}
                        className="p-2 text-green-600 hover:bg-green-50 rounded"
                        title="Quản lý nhà cung cấp"
                    >
                        <Building2 className="w-4 h-4" />
                    </button>
                    <button
                        onClick={() => handleEdit(row)}
                        className="p-2 text-blue-600 hover:bg-blue-50 rounded"
                    >
                        <Edit className="w-4 h-4" />
                    </button>
                    <button
                        onClick={() => handleDelete(row.productId)}
                        className="p-2 text-red-600 hover:bg-red-50 rounded"
                    >
                        <Trash2 className="w-4 h-4" />
                    </button>
                </div>
            ),
        },
    ];

    // =============================
    // RENDER
    // =============================
    return (
        <div className="max-w-7xl mx-auto p-2 sm:p-4">
            {/* HEADER */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4 sm:mb-6">
                <h1 className="text-xl sm:text-2xl font-bold">Sản Phẩm</h1>
                <button
                    onClick={handleAdd}
                    className="flex items-center gap-2 bg-blue-600 text-white px-3 sm:px-4 py-2 rounded hover:bg-blue-700 w-full sm:w-auto justify-center"
                >
                    <Plus className="w-4 h-4" />
                    <span className="text-sm sm:text-base">Thêm sản phẩm</span>
                </button>
            </div>

            {/* FILTER BAR */}
            <div className="bg-white rounded-lg shadow p-3 sm:p-4 mb-4 sm:mb-6">
                <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
                    <div className="flex-1 relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                        <input
                            type="text"
                            placeholder="Tìm kiếm theo tên hoặc mã sản phẩm..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                    </div>

                    <select
                        value={selectedCategory}
                        onChange={(e) => setSelectedCategory(e.target.value)}
                        className="px-4 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                        <option value="">Tất cả danh mục</option>
                        {categories.map((cat) => (
                            <option key={cat.categoryId} value={cat.categoryId}>
                                {cat.categoryName}
                            </option>
                        ))}
                    </select>

                    <select
                        value={sortBy}
                        onChange={(e) => setSortBy(e.target.value)}
                        className="px-4 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                        <option value="name-asc">Tên A-Z</option>
                        <option value="name-desc">Tên Z-A</option>
                        <option value="code-asc">Mã SP A-Z</option>
                        <option value="code-desc">Mã SP Z-A</option>
                    </select>
                </div>
            </div>

            {/* TABLE */}
            <div className="bg-white rounded-lg shadow p-4">
                <p className="mb-3 text-sm text-gray-600">
                    Hiển thị {filteredProducts.length} sản phẩm
                </p>

                <Table columns={columns} data={filteredProducts} />

                {/* PAGINATION */}
                {productPagination && productPagination.totalPages > 1 && (
                    <div className="mt-4">
                        <Pagination
                            page={productPagination.page}
                            pages={productPagination.totalPages}
                            onPageChange={(newPage) => setPage(newPage)}
                        />
                    </div>
                )}
            </div>

            {/* MODALS */}
            <ProductModal
                isOpen={isModalOpen}
                onClose={handleCloseModal}
                product={selectedProduct}
            />
            <ProductSeriesModal
                isOpen={isSeriesModalOpen}
                onClose={() => {
                    setIsSeriesModalOpen(false);
                    setSelectedProduct(null);
                }}
                product={selectedProduct}
            />
            <ProductPartnersModal
                isOpen={isPartnersModalOpen}
                onClose={() => {
                    setIsPartnersModalOpen(false);
                    setSelectedProduct(null);
                }}
                product={selectedProduct}
            />
        </div>
    );
};

export default Sanpham;
