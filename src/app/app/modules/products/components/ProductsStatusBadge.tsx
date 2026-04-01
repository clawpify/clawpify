import { statusBadgeClass } from "../utils/productStatusTab";

type Props = {
  status: string;
};

export function ProductsStatusBadge({ status }: Props) {
  return (
    <span
      className={`inline-flex max-w-full items-center rounded-full px-2 py-0.5 text-xs font-medium capitalize ${statusBadgeClass(status)}`}
    >
      {status.replaceAll("_", " ")}
    </span>
  );
}
