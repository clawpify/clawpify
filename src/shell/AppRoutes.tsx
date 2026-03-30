import { Routes, Route, Navigate } from "react-router-dom";
import { SignIn, SignUp } from "@clerk/react";
import { LandingPage } from "../app/landing";
import { AboutPage } from "../app/about/page";
import {
  WorkspaceLayout,
  HomePage,
  ProductsPage,
  ConsignorsPage,
  ContractsPage,
} from "../app/app";
import { WritingPage } from "../app/writing";
import { WritingPostPage } from "../app/writing/components/post";
import { AuthPageLayout } from "./AuthPageLayout";
import { WritingSlugRedirect } from "./WritingSlugRedirect";

export function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/about" element={<AboutPage />} />
      <Route path="/blog" element={<WritingPage />} />
      <Route path="/blog/:slug" element={<WritingPostPage />} />
      <Route path="/writing" element={<Navigate to="/blog" replace />} />
      <Route path="/writing/:slug" element={<WritingSlugRedirect />} />
      <Route path="/app" element={<WorkspaceLayout />}>
        <Route index element={<HomePage />} />
        <Route path="products" element={<ProductsPage />} />
        <Route path="consignors" element={<ConsignorsPage />} />
        <Route path="contracts" element={<ContractsPage />} />
        <Route path="listings" element={<Navigate to="/app/products" replace />} />
      </Route>
      <Route
        path="/sign-in"
        element={
          <AuthPageLayout>
            <SignIn fallbackRedirectUrl="/app" signUpUrl="/sign-up" />
          </AuthPageLayout>
        }
      />
      <Route
        path="/sign-up"
        element={
          <AuthPageLayout>
            <SignUp fallbackRedirectUrl="/app" signInUrl="/sign-in" />
          </AuthPageLayout>
        }
      />
    </Routes>
  );
}