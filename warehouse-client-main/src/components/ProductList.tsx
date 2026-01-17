import React, { useEffect, useState } from 'react';
import { productService } from '../services/product.service';
import { getImageUrl } from '../utils/imageUrl';

interface Product {
  product_id: number;
  product_name: string;
  price: number;
  description: string;
  image: string;
}

const ProductList: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [favorites, setFavorites] = useState<Product[]>([]);
  const [cart, setCart] = useState<Product[]>([]);
  const [error, setError] = useState<string>('');

  useEffect(() => {
    const getProducts = async () => {
      try {
        const data = await productService.getAll();
        // Map ProductDTO to Product interface
        const mappedData = data.map((p: any) => ({
          product_id: p.productId,
          product_name: p.productName,
          price: 0, // Price not available in ProductDTO
          description: p.description || '',
          image: getImageUrl(p.imageUrl) || ''
        }));
        setProducts(mappedData);
      } catch (err) {
        setError((err as Error).message);
      }
    };

    getProducts();
  }, []);

  const toggleFavorite = (product: Product) => {
    setFavorites((prevFavorites) => {
      if (prevFavorites.some((fav) => fav.product_id === product.product_id)) {
        return prevFavorites.filter((fav) => fav.product_id !== product.product_id); // xóa khỏi danh sách yêu thích
      } else {
        return [...prevFavorites, product]; // Thêm danh sách yêu thích
      }
    });
  };

  const toggleCart = (product: Product) => {
    setCart((prevCart) => {
      if (prevCart.some((item) => item.product_id === product.product_id)) {
        return prevCart.filter((item) => item.product_id !== product.product_id);
      } else {
        return [...prevCart, product]; // Thêm vào giỏ hàng
      }
    });
  };

  if (error) {
    return <div className="text-red-500">{error}</div>;
  }

  return (
    <div className="container mx-auto p-5">
      <h1 className="text-3xl font-bold mb-5">Danh sách sản phẩm</h1>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {products.map((product) => (
          <div
            key={product.product_id}
            className="border rounded-lg p-4 shadow-lg flex flex-col items-center"
          >
            <img
              src={product.image}
              alt={product.product_name}
              className="w-40 h-40 object-cover mb-4"
            />
            <h2 className="text-xl font-semibold">{product.product_name}</h2>
            <p className="text-red-500 font-bold">{product.price}đ</p>
            <p className="text-gray-500">{product.description}</p>
            <div className="flex space-x-2">
              <button
                onClick={() => toggleFavorite(product)}
                className="mt-4 py-2 px-4 bg-transparent text-red-500 rounded border border-red-500 hover:bg-red-50 transition"
                title={favorites.some((fav) => fav.product_id === product.product_id) ? 'Bỏ yêu thích' : 'Thêm yêu thích'}
              >
                <span className="text-sm font-medium">
                  {favorites.some((fav) => fav.product_id === product.product_id) ? 'Đã yêu thích' : 'Yêu thích'}
                </span>
              </button>
              <button
                onClick={() => toggleCart(product)}
                className="mt-4 py-2 px-4 bg-green-500 text-white rounded"
              >
                {cart.some((item) => item.product_id === product.product_id)
                  ? 'Bỏ vào giỏ hàng'
                  : 'Thêm vào giỏ hàng'}
              </button>
            </div>
          </div>
        ))}
      </div>

      <h1 className="text-3xl font-bold mt-10 mb-5">Danh sách yêu thích</h1>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {favorites.map((product) => (
          <div
            key={product.product_id}
            className="border rounded-lg p-4 shadow-lg flex flex-col items-center"
          >
            <img
              src={product.image}
              alt={product.product_name}
              className="w-40 h-40 object-cover mb-4"
            />
            <h2 className="text-xl font-semibold">{product.product_name}</h2>
            <p className="text-red-500 font-bold">{product.price}đ</p>
            <p className="text-gray-500">{product.description}</p>
          </div>
        ))}
      </div>

      <h1 className="text-3xl font-bold mt-10 mb-5">Danh sách giỏ hàng</h1>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {cart.map((product) => (
          <div
            key={product.product_id}
            className="border rounded-lg p-4 shadow-lg flex flex-col items-center"
          >
            <img
              src={product.image}
              alt={product.product_name}
              className="w-40 h-40 object-cover mb-4"
            />
            <h2 className="text-xl font-semibold">{product.product_name}</h2>
            <p className="text-red-500 font-bold">{product.price}đ</p>
            <p className="text-gray-500">{product.description}</p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ProductList;
