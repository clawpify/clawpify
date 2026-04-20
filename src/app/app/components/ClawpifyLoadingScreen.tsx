import { copy } from "../utils/copy";

type ClawpifyLoadingScreenProps = {
  variant?: "fullscreen" | "fill";
  message?: string;
  className?: string;
};

export function ClawpifyLoadingScreen({
  variant = "fullscreen",
  message = copy.settingUpWorkspace,
  className = "",
}: ClawpifyLoadingScreenProps) {
  const outer =
    variant === "fullscreen"
      ? `flex min-h-screen items-center justify-center bg-white px-6 ${className}`.trim()
      : `flex min-h-0 flex-1 w-full items-center justify-center bg-inherit ${className}`.trim();

  return (
    <div role="status" aria-live="polite" className={outer}>
      <p className="text-center text-sm text-zinc-500">{message}</p>
    </div>
  );
}
