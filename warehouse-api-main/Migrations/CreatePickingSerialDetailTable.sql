-- SQL Script to create PickingSerialDetail table manually
-- Run this script directly in SQL Server Management Studio or Azure Data Studio

IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[PickingSerialDetail]') AND type in (N'U'))
BEGIN
    CREATE TABLE [dbo].[PickingSerialDetail](
        [PickingSerialDetailId] [int] IDENTITY(1,1) NOT NULL,
        [PickingDetailId] [int] NOT NULL,
        [ProductSeriesId] [int] NOT NULL,
        [ProductId] [int] NOT NULL,
        [SerialNumber] [nvarchar](100) NOT NULL,
        [PickedDate] [datetime] NOT NULL DEFAULT (getdate()),
        [Status] [nvarchar](50) NOT NULL DEFAULT 'Picked',
        CONSTRAINT [PK_PickingSerialDetail] PRIMARY KEY CLUSTERED ([PickingSerialDetailId] ASC)
    );

    -- Create Foreign Keys
    ALTER TABLE [dbo].[PickingSerialDetail]
    ADD CONSTRAINT [FK_PickingSerialDetail_PickingDetail_PickingDetailId] 
    FOREIGN KEY([PickingDetailId]) REFERENCES [dbo].[PickingDetail] ([PickingDetailId]) ON DELETE CASCADE;

    ALTER TABLE [dbo].[PickingSerialDetail]
    ADD CONSTRAINT [FK_PickingSerialDetail_ProductSeries_ProductSeriesId] 
    FOREIGN KEY([ProductSeriesId]) REFERENCES [dbo].[ProductSeries] ([ProductSeriesId]) ON DELETE NO ACTION;

    ALTER TABLE [dbo].[PickingSerialDetail]
    ADD CONSTRAINT [FK_PickingSerialDetail_Product_ProductId] 
    FOREIGN KEY([ProductId]) REFERENCES [dbo].[Product] ([ProductId]) ON DELETE NO ACTION;

    -- Create Indexes
    CREATE NONCLUSTERED INDEX [IX_PickingSerialDetail_PickingDetailId] 
    ON [dbo].[PickingSerialDetail] ([PickingDetailId]);

    CREATE UNIQUE NONCLUSTERED INDEX [IX_PickingSerialDetail_ProductSeriesId] 
    ON [dbo].[PickingSerialDetail] ([ProductSeriesId]);

    CREATE NONCLUSTERED INDEX [IX_PickingSerialDetail_ProductId] 
    ON [dbo].[PickingSerialDetail] ([ProductId]);

    PRINT 'Table PickingSerialDetail created successfully';
END
ELSE
BEGIN
    PRINT 'Table PickingSerialDetail already exists';
END
