using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace WMS1.Migrations
{
    public partial class AddDamageFieldsToStockTakeDetail : Migration
    {
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            // Thêm cột DamageQuantity nếu chưa có (idempotent)
            migrationBuilder.Sql(@"
                IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'[dbo].[StockTakeDetail]') AND name = 'DamageQuantity')
                BEGIN
                    ALTER TABLE [StockTakeDetail] ADD [DamageQuantity] int NOT NULL DEFAULT 0;
                END
            ");

            // Thêm cột DamageReason nếu chưa có (idempotent)
            migrationBuilder.Sql(@"
                IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'[dbo].[StockTakeDetail]') AND name = 'DamageReason')
                BEGIN
                    ALTER TABLE [StockTakeDetail] ADD [DamageReason] nvarchar(500) NULL;
                END
            ");
        }

        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "DamageQuantity",
                table: "StockTakeDetail");

            migrationBuilder.DropColumn(
                name: "DamageReason",
                table: "StockTakeDetail");
        }
    }
}

