import { createContext, ReactNode, useContext, useState } from 'react';
import { toast } from 'react-toastify';
import { api } from '../services/api';
import { Product, Stock } from '../types';

interface CartProviderProps {
  children: ReactNode;
}

interface UpdateProductAmount {
  productId: number;
  amount: number;
}

interface CartContextData {
  cart: Product[];
  addProduct: (productId: number) => Promise<void>;
  removeProduct: (productId: number) => void;
  updateProductAmount: ({ productId, amount }: UpdateProductAmount) => void;
}

const CartContext = createContext<CartContextData>({} as CartContextData);

export function CartProvider({ children }: CartProviderProps): JSX.Element {
  const [cart, setCart] = useState<Product[]>(() => {
    const storagedCart = localStorage.getItem('@RocketShoes:cart')

    if (storagedCart) {
      return JSON.parse(storagedCart);
    }

    return [];
  });

  const addProduct = async (productId: number) => {
    try {
      const productAlreadyInCart = cart.find(product => productId === product.id);

      if (productAlreadyInCart) {
        updateProductAmount({
          productId, 
          amount: productAlreadyInCart.amount + 1
        })
        return;
      }

      const response = await api.get(`/products/${productId}`);

      const product = response.data

      const updatedCart = [...cart, {
        ...product,
        amount: 1
      }]

      setCart(updatedCart)

      localStorage.setItem('@RocketShoes:cart', JSON.stringify(updatedCart))
      return 
    } catch {
      toast.error('Erro na adição do produto');
    }
  };

  const removeProduct = (productId: number) => {
    try {
      const productExists = cart.find(product => productId === product.id);

      if (!productExists) {
        throw new Error()
      }

      const updatedCart = cart.filter(product => productId !== product.id);

      setCart(updatedCart)

      localStorage.setItem('@RocketShoes:cart', JSON.stringify(updatedCart))
      
    } catch {
      toast.error('Erro na remoção do produto');
    }
  };

  const updateProductAmount = async ({
    productId,
    amount,
  }: UpdateProductAmount) => {
    try {

      if (amount <= 0) {
        return
      }

      const product = cart.find(product => productId === product.id);
      
      if (!product) {
        throw new Error()
      }
      
      const response = await api.get(`/stock/${productId}`);

      const amountInStock = response.data.amount

      if (amount > amountInStock) {
        toast.error('Quantidade solicitada fora de estoque');
        return;
      }

      const updatedProduct = {
        ...product,
        amount: amount
      }

      const filteredCart = cart.filter(product => productId !== product.id);

      const updatedCart = [...filteredCart, updatedProduct].sort((a, b) => (a.id < b.id) ? -1 : 1)

      setCart(updatedCart)

      localStorage.setItem('@RocketShoes:cart', JSON.stringify(updatedCart))
    } catch {
      toast.error('Erro na alteração de quantidade do produto');
    }
  };

  return (
    <CartContext.Provider
      value={{ cart, addProduct, removeProduct, updateProductAmount }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart(): CartContextData {
  const context = useContext(CartContext);

  return context;
}
