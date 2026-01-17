using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace WMS1.Migrations
{
    public partial class AddInventoryDetailAndInventoryLog : Migration
    {
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "InventoryDetail",
                columns: table => new
                {
                    InventoryDetailId = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    ProductId = table.Column<int>(type: "int", nullable: false),
                    ReceivingDetailId = table.Column<int>(type: "int", nullable: false),
                    QuantityIn = table.Column<int>(type: "int", nullable: false),
                    QuantityRemaining = table.Column<int>(type: "int", nullable: false),
                    Unit = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: true),
                    Price = table.Column<decimal>(type: "decimal(10,2)", precision: 10, scale: 2, nullable: false),
                    ReceivedDate = table.Column<DateTime>(type: "datetime", nullable: false, defaultValueSql: "(getdate())")
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_InventoryDetail", x => x.InventoryDetailId);
                    table.ForeignKey(
                        name: "FK_InventoryDetail_Product_ProductId",
                        column: x => x.ProductId,
                        principalTable: "Product",
                        principalColumn: "ProductId");
                    table.ForeignKey(
                        name: "FK_InventoryDetail_ReceivingDetail_ReceivingDetailId",
                        column: x => x.ReceivingDetailId,
                        principalTable: "ReceivingDetail",
                        principalColumn: "ReceivingDetailId");
                });

            migrationBuilder.CreateTable(
                name: "InventoryLog",
                columns: table => new
                {
                    InventoryLogId = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    ProductId = table.Column<int>(type: "int", nullable: false),
                    InventoryDetailId = table.Column<int>(type: "int", nullable: true),
                    TransactionDate = table.Column<DateTime>(type: "datetime", nullable: false, defaultValueSql: "(getdate())"),
                    TransactionType = table.Column<string>(type: "nvarchar(10)", maxLength: 10, nullable: false),
                    QuantityChange = table.Column<int>(type: "int", nullable: false),
                    BalanceAfter = table.Column<int>(type: "int", nullable: false),
                    ReferenceId = table.Column<int>(type: "int", nullable: true),
                    ReferenceType = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: true),
                    UserId = table.Column<int>(type: "int", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_InventoryLog", x => x.InventoryLogId);
                    table.ForeignKey(
                        name: "FK_InventoryLog_InventoryDetail_InventoryDetailId",
                        column: x => x.InventoryDetailId,
                        principalTable: "InventoryDetail",
                        principalColumn: "InventoryDetailId");
                    table.ForeignKey(
                        name: "FK_InventoryLog_Product_ProductId",
                        column: x => x.ProductId,
                        principalTable: "Product",
                        principalColumn: "ProductId");
                    table.ForeignKey(
                        name: "FK_InventoryLog_Users_UserId",
                        column: x => x.UserId,
                        principalTable: "Users",
                        principalColumn: "UserId");
                });

            migrationBuilder.CreateIndex(
                name: "IX_InventoryDetail_ProductId",
                table: "InventoryDetail",
                column: "ProductId");

            migrationBuilder.CreateIndex(
                name: "IX_InventoryDetail_ReceivingDetailId",
                table: "InventoryDetail",
                column: "ReceivingDetailId");

            migrationBuilder.CreateIndex(
                name: "IX_InventoryLog_InventoryDetailId",
                table: "InventoryLog",
                column: "InventoryDetailId");

            migrationBuilder.CreateIndex(
                name: "IX_InventoryLog_ProductId",
                table: "InventoryLog",
                column: "ProductId");

            migrationBuilder.CreateIndex(
                name: "IX_InventoryLog_UserId",
                table: "InventoryLog",
                column: "UserId");
        }

        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "InventoryLog");

            migrationBuilder.DropTable(
                name: "InventoryDetail");
        }
    }
}
