using Microsoft.EntityFrameworkCore.Migrations;

namespace WMS1.Migrations
{
    public partial class AddNewFeatures : Migration
    {
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            // 1. Thêm ImageUrl và WarrantyPeriod vào Product
            migrationBuilder.Sql(@"
                IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'[dbo].[Product]') AND name = 'ImageUrl')
                BEGIN
                    ALTER TABLE [Product] ADD [ImageUrl] nvarchar(500) NULL;
                END
            ");

            migrationBuilder.Sql(@"
                IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'[dbo].[Product]') AND name = 'WarrantyPeriod')
                BEGIN
                    ALTER TABLE [Product] ADD [WarrantyPeriod] int NULL;
                END
            ");

            // 2. Thêm ImageUrl vào Receiving
            migrationBuilder.Sql(@"
                IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'[dbo].[Receiving]') AND name = 'ImageUrl')
                BEGIN
                    ALTER TABLE [Receiving] ADD [ImageUrl] nvarchar(500) NULL;
                END
            ");

            // 3. Thêm UnitPrice và SerialNumbers vào PickingDetail
            migrationBuilder.Sql(@"
                IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'[dbo].[PickingDetail]') AND name = 'UnitPrice')
                BEGIN
                    ALTER TABLE [PickingDetail] ADD [UnitPrice] decimal(18,2) NULL;
                END
            ");

            migrationBuilder.Sql(@"
                IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'[dbo].[PickingDetail]') AND name = 'SerialNumbers')
                BEGIN
                    ALTER TABLE [PickingDetail] ADD [SerialNumbers] nvarchar(2000) NULL;
                END
            ");

            // 4. Thêm QuantityDamaged và QuantityLost vào InventoryDetail
            migrationBuilder.Sql(@"
                IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'[dbo].[InventoryDetail]') AND name = 'QuantityDamaged')
                BEGIN
                    ALTER TABLE [InventoryDetail] ADD [QuantityDamaged] int NULL DEFAULT 0;
                END
            ");

            migrationBuilder.Sql(@"
                IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'[dbo].[InventoryDetail]') AND name = 'QuantityLost')
                BEGIN
                    ALTER TABLE [InventoryDetail] ADD [QuantityLost] int NULL DEFAULT 0;
                END
            ");

            // 5. Tạo bảng ProductSeries
            migrationBuilder.Sql(@"
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'ProductSeries')
BEGIN
    CREATE TABLE [ProductSeries](
        [ProductSeriesId] INT IDENTITY(1,1) NOT NULL PRIMARY KEY,
        [ProductId] INT NOT NULL,
        [InventoryDetailId] INT NULL,
        [PickingDetailId] INT NULL,
        [SerialNumber] NVARCHAR(100) NOT NULL,
        [ReceivedDate] DATETIME NULL,
        [PickedDate] DATETIME NULL,
        [Status] NVARCHAR(50) NOT NULL DEFAULT('InStock'),
        [Notes] NVARCHAR(500) NULL
    );

    ALTER TABLE [ProductSeries] WITH CHECK ADD CONSTRAINT [FK_ProductSeries_Product] FOREIGN KEY([ProductId])
        REFERENCES [Product] ([ProductId]) ON DELETE NO ACTION;
    ALTER TABLE [ProductSeries] WITH CHECK ADD CONSTRAINT [FK_ProductSeries_InventoryDetail] FOREIGN KEY([InventoryDetailId])
        REFERENCES [InventoryDetail] ([InventoryDetailId]) ON DELETE SET NULL;
    ALTER TABLE [ProductSeries] WITH CHECK ADD CONSTRAINT [FK_ProductSeries_PickingDetail] FOREIGN KEY([PickingDetailId])
        REFERENCES [PickingDetail] ([PickingDetailId]) ON DELETE SET NULL;

    CREATE UNIQUE INDEX [IX_ProductSeries_SerialNumber] ON [ProductSeries]([SerialNumber]);
END
");

            // 6. Tạo bảng ProductPartner
            migrationBuilder.Sql(@"
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'ProductPartner')
BEGIN
    CREATE TABLE [ProductPartner](
        [ProductPartnerId] INT IDENTITY(1,1) NOT NULL PRIMARY KEY,
        [ProductId] INT NOT NULL,
        [PartnerId] INT NOT NULL,
        [DefaultPrice] decimal(18,2) NULL,
        [PartnerProductCode] NVARCHAR(100) NULL,
        [CreatedDate] DATETIME NOT NULL DEFAULT(GETDATE())
    );

    ALTER TABLE [ProductPartner] WITH CHECK ADD CONSTRAINT [FK_ProductPartner_Product] FOREIGN KEY([ProductId])
        REFERENCES [Product] ([ProductId]) ON DELETE CASCADE;
    ALTER TABLE [ProductPartner] WITH CHECK ADD CONSTRAINT [FK_ProductPartner_Partner] FOREIGN KEY([PartnerId])
        REFERENCES [Partners] ([PartnerId]) ON DELETE CASCADE;

    CREATE UNIQUE INDEX [IX_ProductPartner_ProductId_PartnerId] ON [ProductPartner]([ProductId], [PartnerId]);
END
");

            // 7. Tạo bảng ProductDamage
            migrationBuilder.Sql(@"
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'ProductDamage')
BEGIN
    CREATE TABLE [ProductDamage](
        [ProductDamageId] INT IDENTITY(1,1) NOT NULL PRIMARY KEY,
        [ProductId] INT NOT NULL,
        [InventoryDetailId] INT NULL,
        [ReceivingDetailId] INT NULL,
        [StockTakeDetailId] INT NULL,
        [SerialNumber] NVARCHAR(100) NULL,
        [DamageType] NVARCHAR(50) NOT NULL,
        [Reason] NVARCHAR(500) NULL,
        [DamageDate] DATETIME NOT NULL DEFAULT(GETDATE()),
        [ReportedByUserId] INT NULL,
        [Notes] NVARCHAR(1000) NULL
    );

    ALTER TABLE [ProductDamage] WITH CHECK ADD CONSTRAINT [FK_ProductDamage_Product] FOREIGN KEY([ProductId])
        REFERENCES [Product] ([ProductId]) ON DELETE NO ACTION;
    ALTER TABLE [ProductDamage] WITH CHECK ADD CONSTRAINT [FK_ProductDamage_InventoryDetail] FOREIGN KEY([InventoryDetailId])
        REFERENCES [InventoryDetail] ([InventoryDetailId]) ON DELETE SET NULL;
    ALTER TABLE [ProductDamage] WITH CHECK ADD CONSTRAINT [FK_ProductDamage_ReceivingDetail] FOREIGN KEY([ReceivingDetailId])
        REFERENCES [ReceivingDetail] ([ReceivingDetailId]) ON DELETE SET NULL;
    ALTER TABLE [ProductDamage] WITH CHECK ADD CONSTRAINT [FK_ProductDamage_StockTakeDetail] FOREIGN KEY([StockTakeDetailId])
        REFERENCES [StockTakeDetail] ([StockTakeDetailId]) ON DELETE SET NULL;
    ALTER TABLE [ProductDamage] WITH CHECK ADD CONSTRAINT [FK_ProductDamage_User] FOREIGN KEY([ReportedByUserId])
        REFERENCES [Users] ([UserId]) ON DELETE SET NULL;
END
");
        }

        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.Sql(@"
IF EXISTS (SELECT * FROM sys.tables WHERE name = 'ProductDamage')
BEGIN
    DROP TABLE [ProductDamage];
END
");

            migrationBuilder.Sql(@"
IF EXISTS (SELECT * FROM sys.tables WHERE name = 'ProductPartner')
BEGIN
    DROP TABLE [ProductPartner];
END
");

            migrationBuilder.Sql(@"
IF EXISTS (SELECT * FROM sys.tables WHERE name = 'ProductSeries')
BEGIN
    DROP TABLE [ProductSeries];
END
");

            migrationBuilder.Sql(@"
                IF EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'[dbo].[InventoryDetail]') AND name = 'QuantityLost')
                BEGIN
                    ALTER TABLE [InventoryDetail] DROP COLUMN [QuantityLost];
                END
            ");

            migrationBuilder.Sql(@"
                IF EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'[dbo].[InventoryDetail]') AND name = 'QuantityDamaged')
                BEGIN
                    ALTER TABLE [InventoryDetail] DROP COLUMN [QuantityDamaged];
                END
            ");

            migrationBuilder.Sql(@"
                IF EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'[dbo].[PickingDetail]') AND name = 'SerialNumbers')
                BEGIN
                    ALTER TABLE [PickingDetail] DROP COLUMN [SerialNumbers];
                END
            ");

            migrationBuilder.Sql(@"
                IF EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'[dbo].[PickingDetail]') AND name = 'UnitPrice')
                BEGIN
                    ALTER TABLE [PickingDetail] DROP COLUMN [UnitPrice];
                END
            ");

            migrationBuilder.Sql(@"
                IF EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'[dbo].[Receiving]') AND name = 'ImageUrl')
                BEGIN
                    ALTER TABLE [Receiving] DROP COLUMN [ImageUrl];
                END
            ");

            migrationBuilder.Sql(@"
                IF EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'[dbo].[Product]') AND name = 'WarrantyPeriod')
                BEGIN
                    ALTER TABLE [Product] DROP COLUMN [WarrantyPeriod];
                END
            ");

            migrationBuilder.Sql(@"
                IF EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'[dbo].[Product]') AND name = 'ImageUrl')
                BEGIN
                    ALTER TABLE [Product] DROP COLUMN [ImageUrl];
                END
            ");
        }
    }
}

