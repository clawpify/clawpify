import { Navigate, useParams } from "react-router-dom";

export function WritingSlugRedirect() {
  const { slug } = useParams<{ slug: string }>();
  return <Navigate to={`/blog/${slug ?? ""}`} replace />;
}
