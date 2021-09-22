import { exists } from "fs";
import { createContext, ReactNode, useContext, useState } from "react";
import { toast } from "react-toastify";
import { api } from "../services/api";
import { Product, Stock } from "../types";

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
    const storagedCart = localStorage.getItem("@RocketShoes:cart");

    if (storagedCart) {
      return JSON.parse(storagedCart);
    }

    return [];
  });

  const addProduct = async (productId: number) => {
    try {
      const productResponse = await api.get<Product>(`/products/${productId}`);
      const stockResponse = await api.get<Stock>(`/stock/${productId}`);

      const data = { ...productResponse.data, amount: 1 };
      const productAmountStock = stockResponse.data.amount;
      const productExists = cart.find((product) => product.id === productId);

      if (data.amount === productAmountStock) {
        toast.error("Quantidade solicitada fora de estoque");
        return;
      }

      if (productExists) {
        const updatedCart = cart.map((product) =>
          product.id === productId
            ? { ...product, amount: product.amount + 1 }
            : product
        );

        setCart(updatedCart);

        localStorage.setItem("@RocketShoes:cart", JSON.stringify(updatedCart))
      } else {
        setCart([...cart, data]);
      }

      const ifProductExistsInStock = cart.find(
        (product) => product.amount <= 0
      );

      if (ifProductExistsInStock) {
        toast.error("Quantidade solicitada fora de estoque");
      }

      localStorage.setItem(
        "@RocketShoes:cart",
        JSON.stringify([...cart, data])
      );
    } catch {
      toast.error("Erro na adição do produto");
    }
  };

  const removeProduct = (productId: number) => {
    try {
      const removeProduct = cart.filter((product) => product.id !== productId);

      setCart(removeProduct);

      const isNotExists = cart.some((product) => product.id === productId);

      if (!isNotExists) {
        toast.error("Erro na remoção do produto");
        return;
      }

      localStorage.setItem("@RocketShoes:cart", JSON.stringify(removeProduct));
    } catch {
      toast.error("Erro na remoção do produto");
    }
  };

  const updateProductAmount = async ({
    productId,
    amount,
  }: UpdateProductAmount) => {
    try {
      const response = await api.get<Stock>(`/stock/${productId}`);
      const productAmountStock = response.data.amount;

      if (amount > productAmountStock) {
        toast.error("Quantidade solicitada fora de estoque");
        return;
      }

      if (amount < 1) {
        toast.error("Quantidade solicitada fora de estoque");
        return;
      }

      const productUpdated = cart.map((product) =>
        product.id === productId ? { ...product, amount } : product
      );

      setCart(productUpdated);

      localStorage.setItem("@RocketShoes:cart", JSON.stringify(productUpdated));
    } catch {
      toast.error("Erro na alteração de quantidade do produto");
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
