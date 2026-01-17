using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace WMS1.Migrations
{
    public partial class ThemLoiSanPHamtrongstocktake : Migration
    {
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            // Drop Inventory table nếu tồn tại
            migrationBuilder.Sql(@"
                IF EXISTS (SELECT * FROM sys.tables WHERE name = 'Inventory')
                BEGIN
                    DROP TABLE [Inventory];
                END
            ");

            // Tạo bảng StockTake nếu chưa tồn tại
            migrationBuilder.Sql(@"
                IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'StockTake')
                BEGIN
                    CREATE TABLE [StockTake] (
                        [StockTakeId] int NOT NULL IDENTITY,
                        [StockTakeCode] nvarchar(50) NOT NULL,
                        [StockTakeDate] datetime NOT NULL DEFAULT ((getdate())),
                        [CreatedByUserId] int NOT NULL,
                        [CreatedDate] datetime NOT NULL DEFAULT ((getdate())),
                        [Status] nvarchar(50) NOT NULL,
                        [Note] nvarchar(500) NULL,
                        CONSTRAINT [PK_StockTake] PRIMARY KEY ([StockTakeId]),
                        CONSTRAINT [FK_StockTake_Users_CreatedByUserId] FOREIGN KEY ([CreatedByUserId]) REFERENCES [Users] ([UserId])
                    );
                    
                    CREATE INDEX [IX_StockTake_CreatedByUserId] ON [StockTake] ([CreatedByUserId]);
                END
            ");

            // Tạo bảng StockTakeDetail nếu chưa tồn tại
            migrationBuilder.Sql(@"
                IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'StockTakeDetail')
                BEGIN
                    CREATE TABLE [StockTakeDetail] (
                        [StockTakeDetailId] int NOT NULL IDENTITY,
                        [StockTakeId] int NOT NULL,
                        [ProductId] int NOT NULL,
                        [SystemQuantity] int NOT NULL,
                        [ActualQuantity] int NOT NULL,
                        [Variance] int NOT NULL,
                        [Note] nvarchar(500) NULL,
                        CONSTRAINT [PK_StockTakeDetail] PRIMARY KEY ([StockTakeDetailId]),
                        CONSTRAINT [FK_StockTakeDetail_Product_ProductId] FOREIGN KEY ([ProductId]) REFERENCES [Product] ([ProductId]),
                        CONSTRAINT [FK_StockTakeDetail_StockTake_StockTakeId] FOREIGN KEY ([StockTakeId]) REFERENCES [StockTake] ([StockTakeId]) ON DELETE CASCADE
                    );
                    
                    CREATE INDEX [IX_StockTakeDetail_ProductId] ON [StockTakeDetail] ([ProductId]);
                    CREATE INDEX [IX_StockTakeDetail_StockTakeId] ON [StockTakeDetail] ([StockTakeId]);
                END
            ");

            // Thêm cột DamageQuantity nếu chưa có
            migrationBuilder.Sql(@"
                IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'[dbo].[StockTakeDetail]') AND name = 'DamageQuantity')
                BEGIN
                    ALTER TABLE [StockTakeDetail] ADD [DamageQuantity] int NOT NULL DEFAULT 0;
                END
            ");

            // Thêm cột DamageReason nếu chưa có
            migrationBuilder.Sql(@"
                IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'[dbo].[StockTakeDetail]') AND name = 'DamageReason')
                BEGIN
                    ALTER TABLE [StockTakeDetail] ADD [DamageReason] nvarchar(500) NULL;
                END
            ");
        }

        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "StockTakeDetail");

            migrationBuilder.DropTable(
                name: "StockTake");

            migrationBuilder.CreateTable(
                name: "Inventory",
                columns: table => new
                {
                    InventoryId = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    ProductId = table.Column<int>(type: "int", nullable: false),
                    LastUpdate = table.Column<DateTime>(type: "datetime", nullable: false, defaultValueSql: "(getdate())"),
                    Quantity = table.Column<int>(type: "int", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Inventory", x => x.InventoryId);
                    table.ForeignKey(
                        name: "FK_Inventory_Product_ProductId",
                        column: x => x.ProductId,
                        principalTable: "Product",
                        principalColumn: "ProductId");
                });

            migrationBuilder.CreateIndex(
                name: "IX_Inventory_ProductId",
                table: "Inventory",
                column: "ProductId");
        }
    }
}
