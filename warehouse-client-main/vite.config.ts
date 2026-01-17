import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react-swc'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          // Vendor chunks
          'react-vendor': ['react', 'react-dom', 'react-router-dom'],
          'query-vendor': ['react-query'],
          'ui-vendor': ['lucide-react'],
          'utils-vendor': ['axios'],
          'xlsx-vendor': ['xlsx'],
          
          // Feature chunks
          'product': [
            './src/pages/user/sanpham/Sanpham',
            './src/pages/user/sanpham/SanphamModal',
            './src/pages/user/sanpham/ProductSeriesModal',
            './src/pages/user/sanpham/ProductPartnersModal'
          ],
          'inventory': [
            './src/pages/user/inventory/KhoHang',
            './src/pages/user/nhaphang/Nhaphang',
            './src/pages/user/phieuxuat/Xuathang'
          ],
          'admin': [
            './src/pages/admin/nhanvien/Nhanvien'
          ]
        }
      }
    },
    chunkSizeWarningLimit: 600, // Tăng limit để giảm warning
  }
})
