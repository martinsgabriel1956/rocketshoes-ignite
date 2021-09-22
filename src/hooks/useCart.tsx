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

  // localStorage.setItem("@RocketShoes:cart", JSON.stringify(cart));

  const addProduct = async (productId: number) => {
    try {
      const productExists = cart.find((product) => product.id === productId);

      if (productExists) {
        setCart(
          cart.map((product) =>
            product.id === productId
              ? { ...product, amount: product.amount + 1 }
              : product
          )
        );
      } else {
        const response = await api.get<Product>(`/products/${productId}`);

        setCart([...cart, {...response.data, amount: 1}]);
      }

      const ifProductExistsInStock = cart.find(
        (product) => product.amount <= 0
      );

      if (ifProductExistsInStock) {
        toast.error("Quantidade solicitada fora de estoque");
      }

      localStorage.setItem("@RocketShoes:cart", JSON.stringify(cart));
    } catch {
      toast.error("Erro na adição do produto");
    }
  };

  const removeProduct = (productId: number) => {
    try {
      const removeProduct = cart.filter((product) => product.id !== productId);

      setCart(removeProduct);

      localStorage.setItem("@RocketShoes:cart", JSON.stringify(cart));
    } catch {
      toast.error("Erro na remoção do produto");
    }
  };

  const updateProductAmount = async ({
    productId,
    amount,
  }: UpdateProductAmount) => {
    try {
      const findProductById = cart.findIndex(
        (product) => product.id === productId
      );

      if (amount <= 0) {
        toast.error("Quantidade solicitada fora de estoque");
      }
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
