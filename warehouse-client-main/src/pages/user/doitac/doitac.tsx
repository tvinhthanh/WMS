// pages/doitac/Doitac.tsx
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "react-query";
import { Plus, Search, Edit, Trash2 } from "lucide-react";
import DoitacModal from "./doitacModal"; // Assuming the modal is named DoitacModal.tsx
import Table, { Column } from "../../../components/Table";
import { PartnerDTO } from "../../../types"; // Define PartnerDTO for partner data
import { partnerService } from "../../../services/partner.service"; // Partner service for API calls

const Doitac = () => {
    const [searchTerm, setSearchTerm] = useState("");
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedPartner, setSelectedPartner] = useState<PartnerDTO | null>(null);

    const queryClient = useQueryClient();

    // ================================
    // FETCH PARTNERS
    // ================================
    const { data: partners = [], isLoading: loadingPartners } = useQuery(
        "partners",
        partnerService.getAll // Fetch partners from the API
    );

    const deleteMutation = useMutation(partnerService.delete, {
    onSuccess: () => {
        queryClient.invalidateQueries("partners");
        alert("Xóa đối tác thành công");
    },
    onError: (error: any) => {
        alert(error.message); // Show backend error message
    }
    });
    // ================================
    // FILTER PARTNERS
    // ================================
   const [filterType, setFilterType] = useState<string>("Tất cả");

    const filteredPartners = partners
    .filter((partner) => {
    const name = partner.partnerName || "";
    const phoneNumber = partner.phoneNumber || "";

    const matchSearch =
      name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      phoneNumber.toLowerCase().includes(searchTerm.toLowerCase());

    const matchType =
      filterType === "Tất cả" ||
      partner.partnerType === filterType;

    return matchSearch && matchType;
  })
  .sort((a, b) => a.partnerId - b.partnerId);


    const handleDelete = (id: number) => {
        if (window.confirm("Bạn có chắc muốn xóa đối tác này?")) {
            deleteMutation.mutate(id);
        }
    };

    const handleAdd = () => {
        setSelectedPartner(null); // Clear selected partner when adding
        setIsModalOpen(true); // Open modal
    };

    const handleEdit = (partner: PartnerDTO) => {
        setSelectedPartner(partner); // Set selected partner for editing
        setIsModalOpen(true); // Open modal
    };

    const handleCloseModal = () => {
        setIsModalOpen(false); // Close modal
        setSelectedPartner(null); // Reset selected partner
    };

    if (loadingPartners) return <div className="p-4">Đang tải...</div>;

    // ================================
    // TABLE COLUMNS
    // ================================
    const columns: Column<PartnerDTO>[] = [
        { title: "Mã ĐT", dataIndex: "partnerId" }, // Partner ID
        { title: "Tên đối tác", dataIndex: "partnerName" },
        { title: "Địa chỉ", dataIndex: "address" },
        { 
            title: "Loại đối tác", 
            dataIndex: "partnerType",
            render: (value: string) => (
                <span className={`px-2 py-1 rounded text-xs font-medium ${
                    value === "Nhà cung cấp" 
                        ? "bg-blue-100 text-blue-700" 
                        : value === "Nhà phân phối"
                        ? "bg-green-100 text-green-700"
                        : "bg-gray-100 text-gray-700"
                }`}>
                    {value || "Chưa chọn"}
                </span>
            )
        },
        { title: "Số điện thoại", dataIndex: "phoneNumber" },
        { title: "Đại diện", dataIndex: "representative" },
        {
            title: "Thao tác",
            render: (_, row) => (
                <div className="flex justify-end gap-2">
                    <button
                        onClick={() => handleEdit(row)}
                        className="p-2 text-blue-600 hover:bg-blue-50 rounded"
                    >
                        <Edit className="w-4 h-4" />
                    </button>
                    <button
                        onClick={() => handleDelete(row.partnerId)}
                        className="p-2 text-red-600 hover:bg-red-50 rounded"
                    >
                        <Trash2 className="w-4 h-4" />
                    </button>
                </div>
            ),
        },
    ];

    // ================================
    // RENDER
    // ================================
    return (
        <div className="max-w-7xl mx-auto p-2 sm:p-4">
            {/* HEADER */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4 sm:mb-6">
                <h1 className="text-xl sm:text-2xl font-bold">Đối Tác</h1>
                <button
                    onClick={handleAdd}
                    className="flex items-center gap-2 bg-blue-600 text-white px-3 sm:px-4 py-2 rounded hover:bg-blue-700 w-full sm:w-auto justify-center"
                >
                    <Plus className="w-4 h-4" />
                    <span className="text-sm sm:text-base">Thêm đối tác</span>
                </button>
            </div>

            {/* FILTER BAR */}
            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
    
    {/* Ô Search */}
    <div className="flex-1 relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
        <input
            type="text"
            placeholder="Tìm kiếm theo tên hoặc số điện thoại..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
    </div>

    {/* FILTER PARTNER TYPE */}
        <select
        value={filterType}
        onChange={(e) => setFilterType(e.target.value)}
        className="w-full sm:w-60 border rounded px-3 py-2 focus:ring-2 focus:ring-blue-500"
        >
        <option value="Tất cả">Tất cả loại đối tác</option>
        <option value="Nhà cung cấp">Nhà cung cấp</option>
        <option value="Nhà phân phối">Nhà phân phối</option>
        </select>
    </div>


            {/* TABLE */}
            <div className="bg-white rounded-lg shadow p-4">
                <p className="mb-3 text-sm text-gray-600">
                    Hiển thị {filteredPartners.length} đối tác
                </p>

                <Table columns={columns} data={filteredPartners} />
            </div>

            {/* MODAL */}
            <DoitacModal
                isOpen={isModalOpen}
                onClose={handleCloseModal}
                partner={selectedPartner}
            />
        </div>
    );
};

export default Doitac;
