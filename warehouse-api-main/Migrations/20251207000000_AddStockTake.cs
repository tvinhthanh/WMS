using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace WMS1.Migrations
{
    public partial class AddStockTake : Migration
    {
        protected override void Up(MigrationBuilder migrationBuilder)
        {
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
                        CONSTRAINT [FK_StockTake_User_CreatedByUserId] FOREIGN KEY ([CreatedByUserId]) REFERENCES [Users] ([UserId])
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
                        CONSTRAINT [FK_StockTakeDetail_StockTake_StockTakeId] FOREIGN KEY ([StockTakeId]) REFERENCES [StockTake] ([StockTakeId]) ON DELETE CASCADE,
                        CONSTRAINT [FK_StockTakeDetail_Product_ProductId] FOREIGN KEY ([ProductId]) REFERENCES [Product] ([ProductId])
                    );
                    
                    CREATE INDEX [IX_StockTakeDetail_ProductId] ON [StockTakeDetail] ([ProductId]);
                    CREATE INDEX [IX_StockTakeDetail_StockTakeId] ON [StockTakeDetail] ([StockTakeId]);
                END
            ");
        }

        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "StockTakeDetail");

            migrationBuilder.DropTable(
                name: "StockTake");
        }
    }
}

