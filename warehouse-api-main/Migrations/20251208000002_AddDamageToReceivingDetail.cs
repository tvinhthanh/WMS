using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace WMS1.Migrations
{
    public partial class AddDamageToReceivingDetail : Migration
    {
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            // Thêm cột DamageQuantity nếu chưa có
            migrationBuilder.Sql(@"
                IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'[dbo].[ReceivingDetail]') AND name = 'DamageQuantity')
                BEGIN
                    ALTER TABLE [ReceivingDetail] ADD [DamageQuantity] int NULL DEFAULT 0;
                END
            ");

            // Thêm cột DamageReason nếu chưa có
            migrationBuilder.Sql(@"
                IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'[dbo].[ReceivingDetail]') AND name = 'DamageReason')
                BEGIN
                    ALTER TABLE [ReceivingDetail] ADD [DamageReason] nvarchar(500) NULL;
                END
            ");
        }

        protected override void Down(MigrationBuilder migrationBuilder)
        {
            // Xóa cột khi rollback
            migrationBuilder.Sql(@"
                IF EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'[dbo].[ReceivingDetail]') AND name = 'DamageQuantity')
                BEGIN
                    ALTER TABLE [ReceivingDetail] DROP COLUMN [DamageQuantity];
                END
            ");

            migrationBuilder.Sql(@"
                IF EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'[dbo].[ReceivingDetail]') AND name = 'DamageReason')
                BEGIN
                    ALTER TABLE [ReceivingDetail] DROP COLUMN [DamageReason];
                END
            ");
        }
    }
}


