import React, {
  createContext,
  useState,
  useCallback,
  useContext,
  useEffect,
} from 'react';

import AsyncStorage from '@react-native-community/async-storage';

interface Product {
  id: string;
  title: string;
  image_url: string;
  price: number;
  quantity: number;
}

interface CartContext {
  products: Product[];
  addToCart(item: Omit<Product, 'quantity'>): void;
  increment(id: string): void;
  decrement(id: string): void;
}

const CartContext = createContext<CartContext | null>(null);

const CartProvider: React.FC = ({ children }) => {
  const [products, setProducts] = useState<Product[]>([]);

  useEffect(() => {
    async function loadProducts(): Promise<void> {
      const product = await AsyncStorage.getItem('@GoMarketPlace:cartProducts');

      if (product) {
        setProducts(JSON.parse(product));
      }
    }

    loadProducts();
  }, []);

  const addToCart = useCallback(
    async (product: Product) => {
      const duplicatedProduct = products.filter(pdt => pdt.id === product.id);

      if (!duplicatedProduct.length) {
        setProducts([...products, { ...product, quantity: 1 }]);

        await AsyncStorage.setItem(
          '@GoMarketPlace:cartProducts',
          JSON.stringify([...products, { ...product, quantity: 1 }]),
        );
      } else {
        setProducts(prevState =>
          prevState.map((pdt: Product) => {
            return pdt.id === product.id
              ? { ...pdt, quantity: pdt.quantity + 1 }
              : pdt;
          }),
        );

        const updatedIncrementedProducts = products.map((pdt: Product) => {
          return pdt.id === product.id
            ? { ...pdt, quantity: pdt.quantity + 1 }
            : pdt;
        });

        await AsyncStorage.setItem(
          '@GoMarketPlace:cartProducts',
          JSON.stringify(updatedIncrementedProducts),
        );
      }
    },
    [products],
  );

  const increment = useCallback(
    async id => {
      setProducts(prevState =>
        prevState.map((pdt: Product) => {
          return pdt.id === id ? { ...pdt, quantity: pdt.quantity + 1 } : pdt;
        }),
      );

      const updatedIncrementedProducts = products.map((pdt: Product) => {
        return pdt.id === id ? { ...pdt, quantity: pdt.quantity + 1 } : pdt;
      });

      await AsyncStorage.setItem(
        '@GoMarketPlace:cartProducts',
        JSON.stringify(updatedIncrementedProducts),
      );
    },
    [products],
  );

  const decrement = useCallback(
    async id => {
      setProducts(prevState =>
        prevState.map((pdt: Product) => {
          return pdt.id === id && pdt.quantity > 0
            ? { ...pdt, quantity: pdt.quantity - 1 }
            : pdt;
        }),
      );

      const updatedDecrementedProducts = products.map((pdt: Product) => {
        return pdt.id === id ? { ...pdt, quantity: pdt.quantity - 1 } : pdt;
      });

      await AsyncStorage.setItem(
        '@GoMarketPlace:cartProducts',
        JSON.stringify(updatedDecrementedProducts),
      );
    },
    [products],
  );

  const value = React.useMemo(
    () => ({ addToCart, increment, decrement, products }),
    [products, addToCart, increment, decrement],
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
};

function useCart(): CartContext {
  const context = useContext(CartContext);

  if (!context) {
    throw new Error(`useCart must be used within a CartProvider`);
  }

  return context;
}

export { CartProvider, useCart };
