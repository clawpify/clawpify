import { Outlet } from "react-router-dom";
import { ProductsProvider } from "../context/ProductsContext";

export function ProductsLayout() {
  return (
    <ProductsProvider>
      <Outlet />
    </ProductsProvider>
  );
}
