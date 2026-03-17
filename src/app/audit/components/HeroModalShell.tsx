import { useEffect } from "react";
import { motion } from "framer-motion";

export function HeroModalShell({
  onClose,
  children,
  size = "default",
}: {
  onClose: () => void;
  children: React.ReactNode;
  size?: "default" | "large";
}) {
  const isLarge = size === "large";

  useEffect(() => {
    const previousBodyOverflow = document.body.style.overflow;
    const previousHtmlOverflow = document.documentElement.style.overflow;

    document.body.style.overflow = "hidden";
    document.documentElement.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = previousBodyOverflow;
      document.documentElement.style.overflow = previousHtmlOverflow;
    };
  }, []);

  return (
    <motion.div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 p-4 backdrop-blur-md"
      onClick={onClose}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2, ease: "easeOut" }}
    >
      <motion.div
        className={`hero-model-shell w-full ${isLarge ? "" : "max-w-lg"}`}
        style={{ maxWidth: isLarge ? "1000px" : undefined }}
        onClick={(e) => e.stopPropagation()}
        initial={{ opacity: 0, scale: 0.96, y: 16 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.985, y: 10 }}
        transition={{
          type: "spring",
          stiffness: 360,
          damping: 28,
          mass: 0.85,
        }}
      >
        <div className="hero-model-label">
          <button
            type="button"
            onClick={onClose}
            className="hero-model-label__dots cursor-pointer hover:opacity-80"
            aria-label="Close"
          >
            <span className="hero-model-label__dot hero-model-label__dot--red" />
            <span className="hero-model-label__dot hero-model-label__dot--yellow" />
            <span className="hero-model-label__dot hero-model-label__dot--green" />
          </button>
          <span className="hero-model-label__text">Clawpify</span>
        </div>
        <div
          className="hero-model-frame"
          style={
            isLarge
              ? { minHeight: "36rem", padding: "3rem 3.5rem 2.5rem" }
              : { minHeight: "auto", padding: "2.5rem 2.75rem 2rem" }
          }
        >
          {children}
        </div>
      </motion.div>
    </motion.div>
  );
}
