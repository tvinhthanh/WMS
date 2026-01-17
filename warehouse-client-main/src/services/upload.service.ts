import api from "./api-client";

export const uploadService = {
  // Upload product image
  uploadProductImage: (productId: number, file: File) => {
    const formData = new FormData();
    formData.append("file", file);
    return api.post(`/FileUpload/product/${productId}`, formData, {
      headers: { "Content-Type": "multipart/form-data" },
    }).then((r) => r.data);
  },

  // Upload receiving image
  uploadReceivingImage: (receivingId: number, file: File) => {
    const formData = new FormData();
    formData.append("file", file);
    return api.post(`/FileUpload/receiving/${receivingId}`, formData, {
      headers: { "Content-Type": "multipart/form-data" },
    }).then((r) => r.data);
  },

  // Delete product image
  deleteProductImage: (productId: number) =>
    api.delete(`/FileUpload/product/${productId}`).then((r) => r.data),

  // Delete receiving image
  deleteReceivingImage: (receivingId: number) =>
    api.delete(`/FileUpload/receiving/${receivingId}`).then((r) => r.data),
};

