using System;
using System.Collections.Generic;

namespace WMS1.DTO
{
    public class PickingOrderResponse
    {
        public int PickingOrderId { get; set; }
        public string OrderCode { get; set; }
        public int CreateByUserId { get; set; }
        public DateTime CreateDate { get; set; }
        public string Status { get; set; }

        public int PartnerId { get; set; }
        public string PartnerName { get; set; }
        public UserInfo CreateByUser { get; set; }
        public List<PickingDetailResponse> Details { get; set; }
    }

    public class PickingDetailResponse
    {
        public int PickingDetailId { get; set; }
        public int ProductId { get; set; }
        public string ProductCode { get; set; }
        public string ProductName { get; set; }
        public int QuantityPicked { get; set; }
        public decimal? UnitPrice { get; set; } // Giá đơn vị (tính theo tỷ lệ từ lô hàng)
        public string? SerialNumbers { get; set; } // Danh sách số series (comma-separated, giữ lại để tương thích)
        public List<SerialNumberInfo>? SerialNumberDetails { get; set; } // Danh sách serial numbers với ProductSeriesId
    }

    public class UserInfo
    {
        public int UserId { get; set; }
        public string UserName { get; set; }
        public string FullName { get; set; }
        public string Email { get; set; }
    }

    // Request DTOs
    public class CreatePickingRequest
    {
        public int CreateByUserId { get; set; }
        public int PartnerId { get; set; }
    }

    public class AddPickingItemRequest
    {
        public int PickingOrderId { get; set; }
        public int ProductId { get; set; }
        public int QuantityPicked { get; set; }
        public string? SerialNumbers { get; set; } // Danh sách số series, phân cách bằng dấu phẩy
    }

    public class UpdatePickingDetailRequest
    {
        public int QuantityPicked { get; set; }
        public string? SerialNumbers { get; set; } // Danh sách số series, phân cách bằng dấu phẩy
    }
}