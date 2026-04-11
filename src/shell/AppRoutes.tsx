import { lazy, Suspense } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { WritingSlugRedirect } from "./WritingSlugRedirect";

const LandingPage = lazy(() =>
  import("../app/landing").then((m) => ({ default: m.LandingPage })),
);
const AboutPage = lazy(() =>
  import("../app/about/page").then((m) => ({ default: m.AboutPage })),
);
const PrivacyPage = lazy(() =>
  import("../app/privacy/page").then((m) => ({ default: m.PrivacyPage })),
);
const WritingPage = lazy(() =>
  import("../app/writing").then((m) => ({ default: m.WritingPage })),
);
const WritingPostPage = lazy(() =>
  import("../app/writing/components/post").then((m) => ({ default: m.WritingPostPage })),
);

const appWorkspace = () => import("../app/app");
const WorkspaceLayout = lazy(() =>
  appWorkspace().then((m) => ({ default: m.WorkspaceLayout })),
);
const HomePage = lazy(() => appWorkspace().then((m) => ({ default: m.HomePage })));
const ProductsLayout = lazy(() =>
  appWorkspace().then((m) => ({ default: m.ProductsLayout })),
);
const ProductsPage = lazy(() =>
  appWorkspace().then((m) => ({ default: m.ProductsPage })),
);
const ConsignorsPage = lazy(() =>
  appWorkspace().then((m) => ({ default: m.ConsignorsPage })),
);
const ContractsPage = lazy(() =>
  appWorkspace().then((m) => ({ default: m.ContractsPage })),
);
const BillingPage = lazy(() => appWorkspace().then((m) => ({ default: m.BillingPage })));

const SignInRoute = lazy(() =>
  import("./auth-routes").then((m) => ({ default: m.SignInRoute })),
);

function RoutesFallback() {
  return <div className="min-h-screen bg-[#f2f3f1]" aria-hidden />;
}

export function AppRoutes() {
  return (
    <Suspense fallback={<RoutesFallback />}>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/about" element={<AboutPage />} />
        <Route path="/privacy" element={<PrivacyPage />} />
        <Route path="/blog" element={<WritingPage />} />
        <Route path="/blog/:slug" element={<WritingPostPage />} />
        <Route path="/writing" element={<Navigate to="/blog" replace />} />
        <Route path="/writing/:slug" element={<WritingSlugRedirect />} />
        <Route path="/app" element={<WorkspaceLayout />}>
          <Route index element={<HomePage />} />
          <Route path="products" element={<ProductsLayout />}>
            <Route index element={<ProductsPage />} />
            <Route path=":listingId" element={<ProductsPage />} />
          </Route>
          <Route path="consignors" element={<ConsignorsPage />} />
          <Route path="contracts" element={<ContractsPage />} />
          <Route path="billing" element={<BillingPage />} />
          <Route path="listings" element={<Navigate to="/app/products" replace />} />
        </Route>
        <Route path="/sign-in" element={<SignInRoute />} />
        <Route path="/sign-up" element={<Navigate to="/sign-in" replace />} />
      </Routes>
    </Suspense>
  );
}
