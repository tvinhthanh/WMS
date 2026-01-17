using System;
using System.Collections.Generic;

namespace WMS1.DTO
{
    public class PickingOrderDTO
    {
        public int PickingOrderId { get; set; }
        public string OrderCode { get; set; }
        public int CreateByUserId { get; set; }
        public DateTime CreateDate { get; set; }
        public string Status { get; set; }

        public List<PickingDetailDTO> Details { get; set; }
    }
}
