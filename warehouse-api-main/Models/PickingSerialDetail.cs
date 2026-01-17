namespace WMS1.Models
{
    public class PickingSerialDetail
    {
        public int PickingSerialDetailId { get; set; }

        public int PickingDetailId { get; set; }

        public int ProductSeriesId { get; set; }

        public int ProductId { get; set; }

        public string SerialNumber { get; set; }

        public DateTime PickedDate { get; set; } = DateTime.Now;

        public string Status { get; set; } = "Picked";

        public virtual PickingDetail PickingDetail { get; set; }

        public virtual ProductSeries ProductSeries { get; set; }

        public virtual Product Product { get; set; }
    }

}
