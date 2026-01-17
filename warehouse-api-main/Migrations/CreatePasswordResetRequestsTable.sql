-- SQL Script to create PasswordResetRequests table manually
-- Run this script directly in SQL Server Management Studio or Azure Data Studio

IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[PasswordResetRequests]') AND type in (N'U'))
BEGIN
    CREATE TABLE [dbo].[PasswordResetRequests](
        [PasswordResetRequestId] [int] IDENTITY(1,1) NOT NULL,
        [UserId] [int] NULL,
        [LoginInfo] [nvarchar](200) NOT NULL,
        [UserFullName] [nvarchar](255) NULL,
        [UserEmployeeCode] [nvarchar](50) NULL,
        [Status] [nvarchar](50) NOT NULL DEFAULT 'Pending',
        [RequestDate] [datetime] NOT NULL DEFAULT (getdate()),
        [ProcessedDate] [datetime] NULL,
        [ProcessedByUserId] [int] NULL,
        [Notes] [nvarchar](500) NULL,
        CONSTRAINT [PK_PasswordResetRequests] PRIMARY KEY CLUSTERED ([PasswordResetRequestId] ASC)
    );

    -- Create Foreign Keys
    -- Use NO ACTION to avoid multiple cascade paths error
    ALTER TABLE [dbo].[PasswordResetRequests]
    ADD CONSTRAINT [FK_PasswordResetRequests_Users_UserId] 
    FOREIGN KEY([UserId]) REFERENCES [dbo].[Users] ([UserId]) ON DELETE NO ACTION;

    ALTER TABLE [dbo].[PasswordResetRequests]
    ADD CONSTRAINT [FK_PasswordResetRequests_Users_ProcessedByUserId] 
    FOREIGN KEY([ProcessedByUserId]) REFERENCES [dbo].[Users] ([UserId]) ON DELETE NO ACTION;

    -- Create Indexes
    CREATE NONCLUSTERED INDEX [IX_PasswordResetRequests_UserId] 
    ON [dbo].[PasswordResetRequests] ([UserId]);

    CREATE NONCLUSTERED INDEX [IX_PasswordResetRequests_ProcessedByUserId] 
    ON [dbo].[PasswordResetRequests] ([ProcessedByUserId]);

    PRINT 'Table PasswordResetRequests created successfully';
END
ELSE
BEGIN
    PRINT 'Table PasswordResetRequests already exists';
END
