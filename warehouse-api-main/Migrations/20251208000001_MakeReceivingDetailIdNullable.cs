using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace WMS1.Migrations
{
    public partial class MakeReceivingDetailIdNullable : Migration
    {
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            // Kiểm tra xem bảng InventoryDetail có tồn tại không
            migrationBuilder.Sql(@"
                IF EXISTS (SELECT * FROM sys.tables WHERE name = 'InventoryDetail')
                BEGIN
                    -- Xóa foreign key constraint cũ nếu tồn tại
                    IF EXISTS (SELECT * FROM sys.foreign_keys WHERE name = 'FK_InventoryDetail_ReceivingDetail_ReceivingDetailId')
                    BEGIN
                        ALTER TABLE [dbo].[InventoryDetail]
                        DROP CONSTRAINT [FK_InventoryDetail_ReceivingDetail_ReceivingDetailId];
                    END

                    -- Kiểm tra xem cột có cho phép NULL chưa
                    IF EXISTS (SELECT * FROM sys.columns 
                               WHERE object_id = OBJECT_ID(N'[dbo].[InventoryDetail]') 
                               AND name = 'ReceivingDetailId' 
                               AND is_nullable = 0)
                    BEGIN
                        -- Sửa cột thành nullable
                        ALTER TABLE [dbo].[InventoryDetail]
                        ALTER COLUMN [ReceivingDetailId] INT NULL;
                    END

                    -- Tạo lại foreign key constraint với ON DELETE SET NULL (nếu chưa có)
                    IF NOT EXISTS (SELECT * FROM sys.foreign_keys WHERE name = 'FK_InventoryDetail_ReceivingDetail_ReceivingDetailId')
                    BEGIN
                        ALTER TABLE [dbo].[InventoryDetail]
                        ADD CONSTRAINT [FK_InventoryDetail_ReceivingDetail_ReceivingDetailId]
                            FOREIGN KEY ([ReceivingDetailId])
                            REFERENCES [dbo].[ReceivingDetail] ([ReceivingDetailId])
                            ON DELETE SET NULL;
                    END
                END
            ");
        }

        protected override void Down(MigrationBuilder migrationBuilder)
        {
            // Xóa foreign key constraint
            migrationBuilder.Sql(@"
                IF EXISTS (SELECT * FROM sys.foreign_keys WHERE name = 'FK_InventoryDetail_ReceivingDetail_ReceivingDetailId')
                BEGIN
                    ALTER TABLE [dbo].[InventoryDetail]
                    DROP CONSTRAINT [FK_InventoryDetail_ReceivingDetail_ReceivingDetailId];
                END
            ");

            // Sửa lại cột thành NOT NULL
            migrationBuilder.AlterColumn<int>(
                name: "ReceivingDetailId",
                table: "InventoryDetail",
                type: "int",
                nullable: false,
                defaultValue: 0,
                oldClrType: typeof(int),
                oldType: "int",
                oldNullable: true);

            // Tạo lại foreign key constraint
            migrationBuilder.Sql(@"
                ALTER TABLE [dbo].[InventoryDetail]
                ADD CONSTRAINT [FK_InventoryDetail_ReceivingDetail_ReceivingDetailId]
                    FOREIGN KEY ([ReceivingDetailId])
                    REFERENCES [dbo].[ReceivingDetail] ([ReceivingDetailId]);
            ");
        }
    }
}

