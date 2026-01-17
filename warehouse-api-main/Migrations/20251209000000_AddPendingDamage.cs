using Microsoft.EntityFrameworkCore.Migrations;

namespace WMS1.Migrations
{
    public partial class AddPendingDamage : Migration
    {
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.Sql(@"
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'PendingDamage')
BEGIN
    CREATE TABLE [PendingDamage](
        [PendingDamageId] INT IDENTITY(1,1) NOT NULL PRIMARY KEY,
        [ProductId] INT NOT NULL,
        [PartnerId] INT NOT NULL,
        [ReceivingDetailId] INT NULL,
        [Quantity] INT NOT NULL,
        [DamageReason] NVARCHAR(255) NULL,
        [DamageDate] DATETIME NOT NULL DEFAULT (GETDATE()),
        [ReceivedDate] DATETIME NULL,
        [SourceType] NVARCHAR(50) NOT NULL DEFAULT('STOCKTAKE'),
        [SourceId] INT NULL,
        [Status] NVARCHAR(50) NOT NULL DEFAULT('Pending'),
        [PickingOrderId] INT NULL,
        [CreatedDate] DATETIME NOT NULL DEFAULT(GETDATE())
    );

    ALTER TABLE [PendingDamage] WITH CHECK ADD CONSTRAINT [FK_PendingDamage_Product] FOREIGN KEY([ProductId])
        REFERENCES [Product] ([ProductId]) ON DELETE NO ACTION;
    ALTER TABLE [PendingDamage] WITH CHECK ADD CONSTRAINT [FK_PendingDamage_Partner] FOREIGN KEY([PartnerId])
        REFERENCES [Partners] ([PartnerId]) ON DELETE NO ACTION;
    ALTER TABLE [PendingDamage] WITH CHECK ADD CONSTRAINT [FK_PendingDamage_ReceivingDetail] FOREIGN KEY([ReceivingDetailId])
        REFERENCES [ReceivingDetail] ([ReceivingDetailId]) ON DELETE SET NULL;
    ALTER TABLE [PendingDamage] WITH CHECK ADD CONSTRAINT [FK_PendingDamage_PickingOrder] FOREIGN KEY([PickingOrderId])
        REFERENCES [PickingOrder] ([PickingOrderId]) ON DELETE SET NULL;
END
");
        }

        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.Sql(@"
IF EXISTS (SELECT * FROM sys.tables WHERE name = 'PendingDamage')
BEGIN
    DROP TABLE [PendingDamage];
END
");
        }
    }
}

