/* ===============================
   USER + AUTH
================================*/
export interface UserDTO {
  userId?: number;
  employeeCode?: string;

  userName?: string;
  email?: string;
  role?: string;

  fullName?: string;
  phone?: string;
  address?: string;
  gender?: string;
  birthDate?: string;
  position?: string;
  salary?: number;

  createdDate?: string;

  password?: string;
  newPassword?: string;
  confirmPassword?: string;
  currentPassword?: string;

  isChangePassword?: boolean;
}

export interface LoginPayload {
  email: string;
  password: string;
}

export interface RegisterPayload {
  fullName: string;
  email: string;
  password: string;
  phone?: string;
  address?: string;
  gender?: string;
  birthDate?: string;
  salary?: number;
  role?: string; // Default = Staff
}

export interface AuthResponse {
  token: string;
  user: UserDTO;
  expiresAt?: string;
}
// Pagination response type
export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    pageSize: number;
    totalCount: number;
    totalPages: number;
  };
}

export interface PurchaseOrderDTO {
  purchaseOrderId: number;
  purchaseOrderCode: string;
  purchaseOrderDate: string;
  purchaseOrderStatus: string;
  purchaseOrderTotal: number;
  purchaseOrderDetails: PurchaseOrderDetailDTO[];
}
export interface PurchaseOrderDetailDTO {
  purchaseOrderDetailId: number;
  purchaseOrderId: number;
  productId: number;
  productName: string;
  quantity: number;
}

export interface PurchaseOrderCreateDTO {
  purchaseOrderCode: string;
  purchaseOrderDate: string;
  purchaseOrderStatus: string;
  purchaseOrderTotal: number;
  purchaseOrderDetails: PurchaseOrderDetailCreateDTO[];
}
export interface PurchaseOrderDetailCreateDTO {
  productId: number;
  quantity: number;
}
export interface PurchaseOrderUpdateDTO {
  purchaseOrderCode: string;
  purchaseOrderDate: string;
  purchaseOrderStatus: string;
  purchaseOrderTotal: number;
  purchaseOrderDetails: PurchaseOrderDetailCreateDTO[];
}

export interface PasswordResetRequestDTO {
  passwordResetRequestId: number;
  userId?: number;
  loginInfo: string;
  userFullName?: string;
  userEmployeeCode?: string;
  status: "Pending" | "Approved" | "Rejected";
  requestDate: string;
  processedDate?: string;
  processedByUserId?: number;
  processedByUserName?: string;
  notes?: string;
}

export interface CreatePasswordResetRequestDTO {
  loginInfo: string; // Email, Username hoặc EmployeeCode
}

export interface ProcessPasswordResetRequestDTO {
  action: "approve" | "reject";
  notes?: string;
}

export interface ChangePasswordPayload {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

/* ===============================
   LOCATION
================================*/
export interface LocationDTO {
  locationId: number;
  locationName: string;
}

/* ===============================
   CATEGORY
================================*/
export interface ProductCategoryDTO {
  categoryId: number;
  categoryName: string;
}

export interface ProductCategoryCreateDTO {
  categoryName: string;
}

export interface ProductCategoryUpdateDTO {
  categoryName: string;
}

/* ===============================
   PRODUCT
================================*/
export interface ProductDTO {
  productId: number;
  productCode: string;
  productName: string;

  categoryId: number;
  categoryName: string;

  unit?: string;
  description?: string;
  imageUrl?: string;
  warrantyPeriod?: number;

}

export interface ProductCreateDTO {
  productCode: string;
  productName: string;
  categoryId: number;
  unit?: string;
  description?: string;
  warrantyPeriod?: number;
}

export interface ProductUpdateDTO {
  productCode?: string;
  productName?: string;
  categoryId?: number;
  unit?: string;
  description?: string;
  warrantyPeriod?: number;
}

// Product Series
export interface ProductSeriesDTO {
  productSeriesId: number;
  productId: number;
  serialNumber: string;
  status: string;
  receivedDate?: string;
  pickedDate?: string;
  notes?: string;
  inventoryDetailId?: number;
  pickingDetailId?: number;
}

// Product Partner
export interface ProductPartnerDTO {
  productPartnerId: number;
  productId: number;
  partnerId: number;
  partnerName?: string;
  defaultPrice?: number;
  partnerProductCode?: string;
  createdDate?: string;
}

/* ===============================
   INVENTORY (THEO BACKEND)
================================*/
export interface InventoryDTO {
  inventoryId: number;
  productId: number;
  productName: string;
  quantity: number;
  lastUpdate: string; // DateTime
}

export interface SerialNumberInfo {
  productSeriesId: number;
  serialNumber: string;
  status: string;
  pickedDate?: string; // Ngày xuất
}

export interface InventoryDetailDTO {
  inventoryDetailId: number;
  productId: number;
  productName: string;
  receivingDetailId: number | null;
  quantityIn: number;
  quantityRemaining: number;
  unit?: string;
  price: number;
  receivedDate: string;
  partnerId?: number;
  partnerName?: string;
  serialNumbers?: SerialNumberInfo[];
}

export interface InventoryLogDTO {
  inventoryLogId: number;
  productId: number;
  productName: string;
  inventoryDetailId?: number;
  transactionDate: string;
  transactionType: "IN" | "OUT" | "ADJUST";
  quantityChange: number;
  balanceAfter: number;
  referenceId?: number;
  referenceType?: string;
  userId?: number;
  userName?: string;
}

export interface InventorySummaryDTO {
  productId: number;
  productName: string;
  beginningBalance: number;
  totalIN: number;
  totalOUT: number;
  totalAdjust: number;
  endingBalance: number;
  fromDate?: string;
  toDate?: string;
}

/* ===============================
   RECEIVING
================================*/
export interface ReceivingDetailDTO {
  receivingDetailId: number;
  productId: number;
  productName: string;
  unit: string;
  quantity: number;
  actualQuantity?: number;
  damageQuantity?: number;
  damageReason?: string;
  price: number;
  serialNumbers?: string[]; // Danh sách số series của lô hàng
}

export interface ReceivingDTO {
  receivingId: number;
  orderCode: string;

  userId: number;
  userName: string;
  createdDate: string;
  deliveryCode?: string;
  partnerId: number;
  partnerName: string;

  receivedDate: string;
  status: number; // 0 = temp, 1 = completed
  note?: string;

  details: ReceivingDetailDTO[];
}

export interface ReceivingCreateDetailDTO {
  productId: number;
  quantity: number;   // BE: Quantity
  unit: string;       // BE: Unit
  price: number;      // BE: Price
}

export interface ReceivingCreateDTO {
  userId: number;
  partnerId: number;
  deliveryCode?: string;
  note?: string;
  details: ReceivingCreateDetailDTO[];
}

export interface ReceivingActualItemDTO {
  receivingDetailId: number;
  actualQuantity: number;
  damageQuantity: number;
  damageReason?: string;
  price?: number;
}

export interface ReceivingActualUpdateDTO {
  receivingId: number;
  items: ReceivingActualItemDTO[];
}

export interface ReceivingReportDetailDTO {
  productName: string;
  productCode: string;
  quantity: number;
  actualQuantity: number;
  damageQuantity: number;
  damageReason?: string;
  unit?: string;
  price: number;
  totalAmount: number;
}

export interface ReceivingReportDTO {
  receivingId: number;
  orderCode: string;
  receivedDate: string;
  createdDate: string;
  partnerName: string;
  deliveryCode?: string;
  status: number;
  note?: string;
  userName: string;
  details: ReceivingReportDetailDTO[];
}

/* ===============================
   PICKING
================================*/
export interface PickingDetailDTO {
  pickingDetailId: number;
  productId: number;
  productCode: string;
  productName: string;
  quantityPicked: number;
  unitPrice?: number;
  serialNumbers?: string; // Comma-separated string (legacy)
  serialNumberDetails?: SerialNumberInfo[]; // New: với ProductSeriesId
}

export interface PickingOrderDTO {
  pickingOrderId: number;
  orderCode: string;
  createByUserId: number;
  createByUser?: {
    userId: number;
    userName: string;
    fullName: string;
    email: string;
  };
  createDate: string;
  pickedDate?: string; // Ngày xuất
  status: string;
  partnerId: number;
  partnerName: string;
  details: PickingDetailDTO[];
}

export interface PickingCreateDTO {
  createByUserId: number;
  partnerId: number;
}

export interface PickingAddItemDTO {
  pickingOrderId: number;
  productId: number;
  quantityPicked: number;
}

/* ===============================
   LOGIN HISTORY
================================*/
export interface LoginHistoryDTO {
  loginHistoryId: number;
  userId: number;
  loginTime: string;
  ipAddress?: string;
  userAgent?: string;
}

export interface LoginHistoryResponse {
  logs: LoginHistoryDTO[];
}


// types/partner.ts

export interface PartnerDTO {
  partnerId: number;
  partnerName: string;
  address: string;
  partnerType: string;
  phoneNumber: string;
  representative: string;
  createdDate: string; // DateTime sẽ nhận dạng dưới dạng string
}

// DTO để tạo mới
export interface PartnerCreateDTO {
  partnerName: string;
  address?: string;
  partnerType?: string;
  phoneNumber?: string;
  representative?: string;
}

// DTO để cập nhật
export interface PartnerUpdateDTO {
  partnerName: string;
  address?: string;
  partnerType?: string;
  phoneNumber?: string;
  representative?: string;
}

/* ===============================
   STOCK TAKE (KIỂM KÊ)
================================*/
export interface StockTakeDetailDTO {
  stockTakeDetailId: number;
  productId: number;
  productName: string;
  productCode: string;
  systemQuantity: number;
  actualQuantity: number;
  damageQuantity: number;
  damageReason?: string;
  variance: number;
  note?: string;
  serialNumbers?: SerialNumberInfo[];
}

export interface StockTakeDTO {
  stockTakeId: number;
  stockTakeCode: string;
  stockTakeDate: string;
  createdByUserId: number;
  createdByUserName: string;
  createdDate: string;
  status: string;
  note?: string;
  details: StockTakeDetailDTO[];
}

export interface StockTakeDetailCreateDTO {
  productId: number;
  actualQuantity: number;
  damageQuantity: number;
  damageReason?: string;
  note?: string;
}

export interface StockTakeCreateDTO {
  createdByUserId: number;
  stockTakeDate: string;
  note?: string;
  details: StockTakeDetailCreateDTO[];
}

export interface StockTakeReviewDTO {
  adminNote?: string;
}

/* ===============================
   PENDING DAMAGE (Hàng hư chờ xuất trả)
================================*/
export interface PendingDamageItemDTO {
  pendingDamageId: number;
  productId: number;
  productName: string;
  partnerId: number;
  partnerName: string;
  quantity: number;
  damageReason?: string;
  damageDate: string;
  receivedDate?: string;
  sourceType: string;
  sourceId?: number;
  status: string;
}

export interface PendingDamageSummaryDTO {
  productId: number;
  productName: string;
  partnerId: number;
  partnerName: string;
  totalPending: number;
  threshold: number;
  earliestReceivedDate?: string;
  latestDamageDate?: string;
  items: PendingDamageItemDTO[];
}
