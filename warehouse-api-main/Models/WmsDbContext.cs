using Microsoft.EntityFrameworkCore;

namespace WMS1.Models
{
    public partial class WmsDbContext : DbContext
    {
        public WmsDbContext() { }
        public WmsDbContext(DbContextOptions<WmsDbContext> options) : base(options) { }

        // ===========================
        // DB SETS (10 TABLES)
        // ===========================
        public virtual DbSet<User> Users { get; set; } = null!;
        public virtual DbSet<ProductCategory> ProductCategories { get; set; } = null!;
        public virtual DbSet<Product> Products { get; set; } = null!;
        public virtual DbSet<Receiving> Receivings { get; set; } = null!;
        public virtual DbSet<ReceivingDetail> ReceivingDetails { get; set; } = null!;
        public virtual DbSet<PickingOrder> PickingOrders { get; set; } = null!;
        public virtual DbSet<PickingDetail> PickingDetails { get; set; } = null!;
        public virtual DbSet<Partners> Partners { get; set; } = null!;
        public virtual DbSet<LoginHistory> LoginHistories { get; set; } = null!;
        public virtual DbSet<InventoryDetail> InventoryDetails { get; set; } = null!;
        public virtual DbSet<InventoryLog> InventoryLogs { get; set; } = null!;
        public virtual DbSet<StockTake> StockTakes { get; set; } = null!;
        public virtual DbSet<StockTakeDetail> StockTakeDetails { get; set; } = null!;
        public virtual DbSet<PendingDamage> PendingDamages { get; set; } = null!;
        public virtual DbSet<ProductSeries> ProductSeries { get; set; } = null!;
        public virtual DbSet<ProductPartner> ProductPartners { get; set; } = null!;
        public virtual DbSet<ProductDamage> ProductDamages { get; set; } = null!;
        public virtual DbSet<PickingSerialDetail> PickingSerialDetails { get; set; } = null!;
        public virtual DbSet<PasswordResetRequest> PasswordResetRequests { get; set; } = null!;

        protected override void OnConfiguring(DbContextOptionsBuilder optionsBuilder)
        {
            if (!optionsBuilder.IsConfigured)
            {
                optionsBuilder.UseSqlServer(
                    "Server=.;Database=WarehouseManagerSystem;Trusted_Connection=True;TrustServerCertificate=True");
            }
        }

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            
            // USER
            modelBuilder.Entity<User>(entity =>
            {
                entity.ToTable("Users");
                entity.HasKey(e => e.UserId);

                entity.Property(e => e.EmployeeCode).HasMaxLength(50).IsRequired();
                entity.Property(e => e.UserName).HasMaxLength(100).IsRequired();
                entity.Property(e => e.Email).HasMaxLength(100).IsRequired();
                entity.Property(e => e.PasswordHash).HasMaxLength(200).IsRequired();
                entity.Property(e => e.Role).HasMaxLength(50).IsRequired();

                entity.Property(e => e.FullName).HasMaxLength(255).IsRequired();
                entity.Property(e => e.Phone).HasMaxLength(20);
                entity.Property(e => e.Address).HasMaxLength(255);
                entity.Property(e => e.Gender).HasMaxLength(20);
                entity.Property(e => e.Position).HasMaxLength(100);

                entity.Property(e => e.Salary).HasColumnType("decimal(18,2)");

                entity.Property(e => e.CreatedDate)
                      .HasColumnType("datetime")
                      .HasDefaultValueSql("(getdate())");

                entity.HasMany(e => e.LoginHistories)
                      .WithOne(h => h.User)
                      .HasForeignKey(h => h.UserId)
                      .OnDelete(DeleteBehavior.Cascade);

                entity.HasMany(e => e.Receivings)
                      .WithOne(r => r.User)
                      .HasForeignKey(r => r.UserId)
                      .OnDelete(DeleteBehavior.ClientSetNull);

                entity.HasMany(e => e.PickingOrders)
                      .WithOne(p => p.CreateByUser)
                      .HasForeignKey(p => p.CreateByUserId)
                      .OnDelete(DeleteBehavior.ClientSetNull);
            });

            // ===========================
            // PARTNERS
            // ===========================
            modelBuilder.Entity<Partners>(entity =>
            {
                entity.ToTable("Partners");
                entity.HasKey(e => e.PartnerId);

                entity.Property(e => e.PartnerName).HasMaxLength(200).IsRequired();
                entity.Property(e => e.Address).HasMaxLength(255);
                entity.Property(e => e.PartnerType).HasMaxLength(100);
                entity.Property(e => e.PhoneNumber).HasMaxLength(50);
                entity.Property(e => e.Representative).HasMaxLength(100);

                entity.Property(e => e.CreatedDate)
                      .HasColumnType("datetime")
                      .HasDefaultValueSql("(getdate())");

                // Partner - Receiving (1 - N)
                entity.HasMany(p => p.Receivings)
                      .WithOne(r => r.Partner)
                      .HasForeignKey(r => r.PartnerId)
                      .OnDelete(DeleteBehavior.ClientSetNull);

                // Partner - PickingOrder (1 - N)
                entity.HasMany(p => p.PickingOrders)
                      .WithOne(po => po.Partner)
                      .HasForeignKey(po => po.PartnerId)
                      .OnDelete(DeleteBehavior.ClientSetNull);
            });

            // ===========================
            // PRODUCT CATEGORY
            // ===========================
            modelBuilder.Entity<ProductCategory>(entity =>
            {
                entity.ToTable("ProductCategory");
                entity.HasKey(e => e.CategoryId);

                entity.Property(e => e.CategoryName).HasMaxLength(100).IsRequired();
            });

            // ===========================
            // PRODUCT
            // ===========================
            modelBuilder.Entity<Product>(entity =>
            {
                entity.ToTable("Product");
                entity.HasKey(e => e.ProductId);

                entity.Property(e => e.ProductCode).HasMaxLength(100).IsRequired();
                entity.Property(e => e.ProductName).HasMaxLength(100).IsRequired();
                entity.Property(e => e.Unit).HasMaxLength(50);
                entity.Property(e => e.Description).HasMaxLength(200);

                entity.HasOne(e => e.Category)
                      .WithMany(c => c.Products)
                      .HasForeignKey(e => e.CategoryId)
                      .OnDelete(DeleteBehavior.ClientSetNull);
            });

            // ===========================
            // RECEIVING
            // ===========================
            modelBuilder.Entity<Receiving>(entity =>
            {
                entity.ToTable("Receiving");
                entity.HasKey(e => e.ReceivingId);

                entity.Property(e => e.OrderCode)
                      .HasMaxLength(50)
                      .IsRequired();

                entity.Property(e => e.Note).HasMaxLength(200);

                entity.Property(e => e.ReceivedDate)
                      .HasColumnType("datetime")
                      .HasDefaultValueSql("(getdate())");

                entity.Property(e => e.Status)
                      .HasColumnType("tinyint")
                      .HasDefaultValue((byte)0);

                entity.Property(e => e.DeliveryCode).HasMaxLength(100);
                entity.Property(e => e.ImageUrl).HasMaxLength(500);

                // Receiving -> User
                entity.HasOne(e => e.User)
                      .WithMany(u => u.Receivings)
                      .HasForeignKey(e => e.UserId)
                      .OnDelete(DeleteBehavior.ClientSetNull);

                // Receiving -> Partner
                entity.HasOne(e => e.Partner)
                      .WithMany(p => p.Receivings)
                      .HasForeignKey(e => e.PartnerId)
                      .OnDelete(DeleteBehavior.ClientSetNull);
            });

            // ===========================
            // chi tiết phiếu nhập 
            // ===========================
            modelBuilder.Entity<ReceivingDetail>(entity =>
            {
                entity.ToTable("ReceivingDetail");
                entity.HasKey(e => e.ReceivingDetailId);

                entity.Property(e => e.Unit).HasMaxLength(50);
                entity.Property(e => e.Price).HasColumnType("decimal(18,2)");

                entity.Property(e => e.Quantity).IsRequired();

                entity.HasOne(e => e.Receiving)
                      .WithMany(r => r.ReceivingDetails)
                      .HasForeignKey(e => e.ReceivingId)
                      .OnDelete(DeleteBehavior.Cascade);

                entity.HasOne(e => e.Product)
                      .WithMany(p => p.ReceivingDetails)
                      .HasForeignKey(e => e.ProductId)
                      .OnDelete(DeleteBehavior.ClientSetNull);
            });

            // ===========================
            // phiếu xuất hàng
            // ===========================
            modelBuilder.Entity<PickingOrder>(entity =>
            {
                entity.ToTable("PickingOrder");
                entity.HasKey(e => e.PickingOrderId);

                entity.Property(e => e.OrderCode).HasMaxLength(50).IsRequired();
                entity.Property(e => e.Status).HasMaxLength(50);

                entity.Property(e => e.CreateDate)
                      .HasColumnType("datetime")
                      .HasDefaultValueSql("(getdate())");

                // User tạo đơn
                entity.HasOne(e => e.CreateByUser)
                      .WithMany(u => u.PickingOrders)
                      .HasForeignKey(e => e.CreateByUserId)
                      .OnDelete(DeleteBehavior.ClientSetNull);

                // Partner trong PickingOrder
                entity.HasOne(e => e.Partner)
                      .WithMany(p => p.PickingOrders)
                      .HasForeignKey(e => e.PartnerId)
                      .OnDelete(DeleteBehavior.ClientSetNull);
            });

            // ===========================
            // chi tiết phiếu xuất hàng
            // ===========================
            modelBuilder.Entity<PickingDetail>(entity =>
            {
                entity.ToTable("PickingDetail");
                entity.HasKey(e => e.PickingDetailId);

                entity.Property(e => e.QuantityPicked).IsRequired();
                entity.Property(e => e.UnitPrice).HasColumnType("decimal(18,2)");
                entity.Property(e => e.SerialNumbers).HasMaxLength(2000);

                entity.HasOne(e => e.PickingOrder)
                      .WithMany(o => o.PickingDetails)
                      .HasForeignKey(e => e.PickingOrderId)
                      .OnDelete(DeleteBehavior.Cascade);

                entity.HasOne(e => e.Product)
                      .WithMany(p => p.PickingDetails)
                      .HasForeignKey(e => e.ProductId)
                      .OnDelete(DeleteBehavior.ClientSetNull);
            });

            // ===========================
            // Chi tiết số series khi xuất hàng
            // ===========================
            modelBuilder.Entity<PickingSerialDetail>(entity =>
            {
                entity.ToTable("PickingSerialDetail");

                entity.HasKey(e => e.PickingSerialDetailId);

                entity.Property(e => e.SerialNumber)
                      .HasMaxLength(100)
                      .IsRequired();

                entity.Property(e => e.Status)
                      .HasMaxLength(50)
                      .HasDefaultValue("Picked");

                entity.Property(e => e.PickedDate)
                      .HasColumnType("datetime")
                      .HasDefaultValueSql("(getdate())");

                entity.HasOne(e => e.PickingDetail)
                      .WithMany()
                      .HasForeignKey(e => e.PickingDetailId)
                      .OnDelete(DeleteBehavior.Cascade);

                entity.HasOne(e => e.ProductSeries)
                      .WithMany()
                      .HasForeignKey(e => e.ProductSeriesId)
                      .OnDelete(DeleteBehavior.Restrict);

                entity.HasOne(e => e.Product)
                      .WithMany()
                      .HasForeignKey(e => e.ProductId)
                      .OnDelete(DeleteBehavior.ClientSetNull);

                // 1 Serial chỉ được gán cho 1 Picking
                entity.HasIndex(e => e.ProductSeriesId).IsUnique();
            });

            // ===========================
            // lịch sử đăng nhập
            // ===========================
            modelBuilder.Entity<LoginHistory>(entity =>
            {
                entity.ToTable("LoginHistories");

                entity.HasKey(e => e.LoginHistoryId);

                entity.Property(e => e.LoginTime).HasColumnType("datetime");

                entity.HasOne(e => e.User)
                      .WithMany(u => u.LoginHistories)
                      .HasForeignKey(e => e.UserId)
                      .OnDelete(DeleteBehavior.Cascade);
            });

            // ===========================
            // INVENTORY DETAIL (FIFO Lots)
            // ===========================
            modelBuilder.Entity<InventoryDetail>(entity =>
            {
                entity.ToTable("InventoryDetail");
                entity.HasKey(e => e.InventoryDetailId);

                entity.Property(e => e.QuantityIn).IsRequired();
                entity.Property(e => e.QuantityRemaining).IsRequired();
                entity.Property(e => e.QuantityDamaged).HasDefaultValue(0);
                entity.Property(e => e.QuantityLost).HasDefaultValue(0);
                entity.Property(e => e.Unit).HasMaxLength(50);
                entity.Property(e => e.Price).HasColumnType("decimal(10,2)");
                entity.Property(e => e.ReceivedDate)
                      .HasColumnType("datetime")
                      .HasDefaultValueSql("(getdate())");

                entity.HasOne(e => e.Product)
                      .WithMany(p => p.InventoryDetails)
                      .HasForeignKey(e => e.ProductId)
                      .OnDelete(DeleteBehavior.ClientSetNull);

                entity.HasOne(e => e.ReceivingDetail)
                      .WithMany(rd => rd.InventoryDetails)
                      .HasForeignKey(e => e.ReceivingDetailId)
                      .OnDelete(DeleteBehavior.ClientSetNull);
            });

            // ===========================
            // INVENTORY LOG (Movement History)
            // ===========================
            modelBuilder.Entity<InventoryLog>(entity =>
            {
                entity.ToTable("InventoryLog");
                entity.HasKey(e => e.InventoryLogId);

                entity.Property(e => e.TransactionDate)
                      .HasColumnType("datetime")
                      .HasDefaultValueSql("(getdate())");

                entity.Property(e => e.TransactionType)
                      .HasMaxLength(10)
                      .IsRequired();

                entity.Property(e => e.QuantityChange).IsRequired();
                entity.Property(e => e.BalanceAfter).IsRequired();
                entity.Property(e => e.ReferenceType).HasMaxLength(50);

                entity.HasOne(e => e.Product)
                      .WithMany(p => p.InventoryLogs)
                      .HasForeignKey(e => e.ProductId)
                      .OnDelete(DeleteBehavior.ClientSetNull);

                entity.HasOne(e => e.InventoryDetail)
                      .WithMany(id => id.InventoryLogs)
                      .HasForeignKey(e => e.InventoryDetailId)
                      .OnDelete(DeleteBehavior.ClientSetNull);

                entity.HasOne(e => e.User)
                      .WithMany(u => u.InventoryLogs)
                      .HasForeignKey(e => e.UserId)
                      .OnDelete(DeleteBehavior.ClientSetNull);
            });

            // ===========================
            // PENDING DAMAGE (chờ đạt ngưỡng để xuất trả)
            // ===========================
            modelBuilder.Entity<PendingDamage>(entity =>
            {
                entity.ToTable("PendingDamage");
                entity.HasKey(e => e.PendingDamageId);

                entity.Property(e => e.DamageReason).HasMaxLength(255);
                entity.Property(e => e.SourceType).HasMaxLength(50);
                entity.Property(e => e.Status).HasMaxLength(50);
                entity.Property(e => e.CreatedDate)
                      .HasColumnType("datetime")
                      .HasDefaultValueSql("(getdate())");

                entity.HasOne(e => e.Product)
                      .WithMany(p => p.PendingDamages)
                      .HasForeignKey(e => e.ProductId)
                      .OnDelete(DeleteBehavior.ClientSetNull);

                entity.HasOne(e => e.Partner)
                      .WithMany(p => p.PendingDamages)
                      .HasForeignKey(e => e.PartnerId)
                      .OnDelete(DeleteBehavior.ClientSetNull);

                entity.HasOne(e => e.ReceivingDetail)
                      .WithMany(rd => rd.PendingDamages)
                      .HasForeignKey(e => e.ReceivingDetailId)
                      .OnDelete(DeleteBehavior.SetNull);

                entity.HasOne(e => e.PickingOrder)
                      .WithMany(po => po.PendingDamages)
                      .HasForeignKey(e => e.PickingOrderId)
                      .OnDelete(DeleteBehavior.SetNull);
            });

            // ===========================
            // STOCK TAKE
            // ===========================
            modelBuilder.Entity<StockTake>(entity =>
            {
                entity.ToTable("StockTake");
                entity.HasKey(e => e.StockTakeId);

                entity.Property(e => e.StockTakeCode).HasMaxLength(50).IsRequired();
                entity.Property(e => e.Status).HasMaxLength(50).IsRequired();
                entity.Property(e => e.Note).HasMaxLength(500);

                entity.Property(e => e.StockTakeDate)
                      .HasColumnType("datetime")
                      .HasDefaultValueSql("(getdate())");

                entity.Property(e => e.CreatedDate)
                      .HasColumnType("datetime")
                      .HasDefaultValueSql("(getdate())");

                entity.HasOne(e => e.CreatedByUser)
                      .WithMany(u => u.StockTakes)
                      .HasForeignKey(e => e.CreatedByUserId)
                      .OnDelete(DeleteBehavior.ClientSetNull);
            });

            modelBuilder.Entity<StockTakeDetail>(entity =>
            {
                entity.ToTable("StockTakeDetail");
                entity.HasKey(e => e.StockTakeDetailId);

                entity.Property(e => e.DamageQuantity).HasDefaultValue(0);
                entity.Property(e => e.DamageReason).HasMaxLength(500);
                entity.Property(e => e.Note).HasMaxLength(500);

                entity.HasOne(e => e.StockTake)
                      .WithMany(st => st.StockTakeDetails)
                      .HasForeignKey(e => e.StockTakeId)
                      .OnDelete(DeleteBehavior.Cascade);

                entity.HasOne(e => e.Product)
                      .WithMany(p => p.StockTakeDetails)
                      .HasForeignKey(e => e.ProductId)
                      .OnDelete(DeleteBehavior.ClientSetNull);
            });

            // ===========================
            // PRODUCT SERIES
            // ===========================
            modelBuilder.Entity<ProductSeries>(entity =>
            {
                entity.ToTable("ProductSeries");
                entity.HasKey(e => e.ProductSeriesId);

                entity.Property(e => e.SerialNumber).HasMaxLength(100).IsRequired();
                entity.Property(e => e.Status).HasMaxLength(50).HasDefaultValue("InStock");
                entity.Property(e => e.Notes).HasMaxLength(500);

                // Product relationship - Product không có navigation property ProductSeries
                entity.HasOne(e => e.Product)
                      .WithMany()
                      .HasForeignKey(e => e.ProductId)
                      .OnDelete(DeleteBehavior.ClientSetNull);

                // InventoryDetail relationship - Chỉ định rõ navigation property
                entity.HasOne(e => e.InventoryDetail)
                      .WithMany(id => id.ProductSeries)
                      .HasForeignKey(e => e.InventoryDetailId)
                      .OnDelete(DeleteBehavior.SetNull)
                      .IsRequired(false);

                // PickingDetail relationship - PickingDetail không có navigation property ProductSeries
                entity.HasOne(e => e.PickingDetail)
                      .WithMany()
                      .HasForeignKey(e => e.PickingDetailId)
                      .OnDelete(DeleteBehavior.SetNull)
                      .IsRequired(false);

                // Unique constraint cho SerialNumber
                entity.HasIndex(e => e.SerialNumber).IsUnique();
            });

            // ===========================
            // PRODUCT PARTNER (Many-to-Many)
            // ===========================
            modelBuilder.Entity<ProductPartner>(entity =>
            {
                entity.ToTable("ProductPartner");
                entity.HasKey(e => e.ProductPartnerId);

                entity.Property(e => e.DefaultPrice).HasColumnType("decimal(18,2)");
                entity.Property(e => e.PartnerProductCode).HasMaxLength(100);
                entity.Property(e => e.CreatedDate)
                      .HasColumnType("datetime")
                      .HasDefaultValueSql("(getdate())");

                entity.HasOne(e => e.Product)
                      .WithMany()
                      .HasForeignKey(e => e.ProductId)
                      .OnDelete(DeleteBehavior.Cascade);

                entity.HasOne(e => e.Partner)
                      .WithMany()
                      .HasForeignKey(e => e.PartnerId)
                      .OnDelete(DeleteBehavior.Cascade);

                // Unique constraint: một sản phẩm chỉ có một quan hệ với một nhà cung cấp
                entity.HasIndex(e => new { e.ProductId, e.PartnerId }).IsUnique();
            });

            // ===========================
            // PRODUCT DAMAGE
            // ===========================
            modelBuilder.Entity<ProductDamage>(entity =>
            {
                entity.ToTable("ProductDamage");
                entity.HasKey(e => e.ProductDamageId);

                entity.Property(e => e.SerialNumber).HasMaxLength(100);
                entity.Property(e => e.DamageType).HasMaxLength(50).IsRequired(); // "Damaged" hoặc "Lost"
                entity.Property(e => e.Reason).HasMaxLength(500);
                entity.Property(e => e.Notes).HasMaxLength(1000);
                entity.Property(e => e.DamageDate)
                      .HasColumnType("datetime")
                      .HasDefaultValueSql("(getdate())");

                entity.HasOne(e => e.Product)
                      .WithMany()
                      .HasForeignKey(e => e.ProductId)
                      .OnDelete(DeleteBehavior.ClientSetNull);

                entity.HasOne(e => e.InventoryDetail)
                      .WithMany()
                      .HasForeignKey(e => e.InventoryDetailId)
                      .OnDelete(DeleteBehavior.SetNull);

                entity.HasOne(e => e.ReceivingDetail)
                      .WithMany()
                      .HasForeignKey(e => e.ReceivingDetailId)
                      .OnDelete(DeleteBehavior.SetNull);

                entity.HasOne(e => e.StockTakeDetail)
                      .WithMany()
                      .HasForeignKey(e => e.StockTakeDetailId)
                      .OnDelete(DeleteBehavior.SetNull);

                entity.HasOne(e => e.ReportedByUser)
                      .WithMany()
                      .HasForeignKey(e => e.ReportedByUserId)
                      .OnDelete(DeleteBehavior.SetNull);
            });
        }
    }
}
