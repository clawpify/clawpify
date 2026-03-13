import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { useLocalStorage } from "../../../hooks/useLocalStorage";
import { useAuth } from "@clerk/react";
import { logAgentActivity, useAuthenticatedFetch } from "../../../lib/api";
import {
  createCitation,
  generatePromptsAndCompetitors,
  pollCitation,
} from "../utils/networkFns";
import { citationFormSchema, type CitationData, type CitationForm } from "../types";

export type AuditStep = "form" | "loading" | "results" | "generating";

export type FormStep = 1 | 2 | 3;

type AuditContextValue = {
  step: AuditStep;
  formStep: FormStep;
  setFormStep: React.Dispatch<React.SetStateAction<FormStep>>;
  form: CitationForm;
  setForm: React.Dispatch<React.SetStateAction<CitationForm>>;
  generatedPrompts: string[];
  setGeneratedPrompts: React.Dispatch<React.SetStateAction<string[]>>;
  generatedCompetitors: string[];
  setGeneratedCompetitors: React.Dispatch<React.SetStateAction<string[]>>;
  runChatGPTSearch: boolean;
  setRunChatGPTSearch: React.Dispatch<React.SetStateAction<boolean>>;
  data: CitationData | null;
  error: string | null;
  showWaitlistModal: boolean;
  setShowWaitlistModal: React.Dispatch<React.SetStateAction<boolean>>;
  closeWaitlistModal: () => void;
  generate: () => Promise<void>;
  submit: () => Promise<void>;
  reset: () => void;
};

const defaultForm: CitationForm = {
  company_name: "",
  website_url: "",
  product_description: "",
};

const AuditContext = createContext<AuditContextValue | null>(null);

export function AuditProvider({ children }: { children: ReactNode }) {
  const { getToken, isSignedIn } = useAuth();
  const fetchAuth = useAuthenticatedFetch();
  const [step, setStep] = useState<AuditStep>("results");
  const [formStep, setFormStep] = useState<FormStep>(1);
  const [form, setForm] = useState<CitationForm>(defaultForm);
  const [generatedPrompts, setGeneratedPrompts] = useState<string[]>([]);
  const [generatedCompetitors, setGeneratedCompetitors] = useState<string[]>([]);
  const [runChatGPTSearch, setRunChatGPTSearch] = useState(true);
  const [data, setData] = useState<CitationData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showWaitlistModal, setShowWaitlistModal] = useState(false);
  const [waitlistDismissed, setWaitlistDismissed] = useLocalStorage(
    "clawpify-waitlist-dismissed",
    false
  );
  const waitlistModalTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (waitlistModalTimeoutRef.current) {
        clearTimeout(waitlistModalTimeoutRef.current);
      }
    };
  }, []);

  const closeWaitlistModal = useCallback(() => {
    setShowWaitlistModal(false);
    setWaitlistDismissed(true);
  }, [setWaitlistDismissed]);

  const reset = useCallback(() => {
    if (waitlistModalTimeoutRef.current) {
      clearTimeout(waitlistModalTimeoutRef.current);
      waitlistModalTimeoutRef.current = null;
    }
    setStep("form");
    setFormStep(1);
    setForm(defaultForm);
    setGeneratedPrompts([]);
    setGeneratedCompetitors([]);
    setRunChatGPTSearch(true);
    setData(null);
    setError(null);
    setShowWaitlistModal(false);
  }, []);

  const generate = useCallback(async () => {
    const parsed = citationFormSchema.pick({
      company_name: true,
      website_url: true,
    }).safeParse({ company_name: form.company_name, website_url: form.website_url });
    if (!parsed.success) {
      setError(parsed.error.errors[0]?.message ?? "Invalid form");
      return;
    }

    setError(null);
    setStep("generating");

    try {
      const token = await getToken();
      const { prompts, competitors } = await generatePromptsAndCompetitors(
        parsed.data.website_url,
        parsed.data.company_name,
        token
      );
      setGeneratedPrompts(prompts);
      const normalized = competitors.slice(0, 7);
      while (normalized.length < 7) normalized.push("");
      setGeneratedCompetitors(normalized);
      setFormStep(2);
      setStep("form");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to generate");
      setStep("results");
    }
  }, [form.company_name, form.website_url, getToken]);

  const submit = useCallback(async () => {
    const parsed = citationFormSchema.safeParse(form);
    if (!parsed.success) {
      setError(parsed.error.errors[0]?.message ?? "Invalid form");
      return;
    }

    const hasCustomPrompts = generatedPrompts.length > 0;
    if (!hasCustomPrompts && !parsed.data.product_description.trim()) {
      setError("Generate prompts first, or enter a product description.");
      return;
    }

    setError(null);
    setData(null);
    setStep("loading");

    try {
      const token = await getToken();
      const { id } = await createCitation(
        {
          ...parsed.data,
          product_description: parsed.data.product_description || "—",
        },
        hasCustomPrompts ? generatedPrompts : undefined,
        runChatGPTSearch,
        token
      );

      const poll = async () => {
        const d = await pollCitation(id);
        if (d.status === "completed") {
          setData(d);
          setStep("results");
          setFormStep(1);
          if (isSignedIn) {
            logAgentActivity(fetchAuth, {
              agent_name: "Citation Auditor",
              action_type: "audit_completed",
              payload: { citation_id: id, company_name: parsed.data.company_name },
            });
          }
          if (!waitlistDismissed) {
            waitlistModalTimeoutRef.current = setTimeout(
              () => setShowWaitlistModal(true),
              3000
            );
          }
          return;
        }
        if (d.status === "failed") {
          setError("The citation check failed. Please try again.");
          setStep("results");
          setFormStep(1);
          if (!waitlistDismissed) {
            waitlistModalTimeoutRef.current = setTimeout(
              () => setShowWaitlistModal(true),
              3000
            );
          }
          return;
        }
        if (d.results && d.results.length > 0) {
          setData(d);
        }
        setTimeout(poll, 1500);
      };

      await poll();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong");
      setStep("results");
      setFormStep(1);
    }
  }, [
    form,
    generatedPrompts,
    runChatGPTSearch,
    getToken,
    waitlistDismissed,
    isSignedIn,
    fetchAuth,
  ]);

  const value: AuditContextValue = {
    step,
    formStep,
    setFormStep,
    form,
    setForm,
    generatedPrompts,
    setGeneratedPrompts,
    generatedCompetitors,
    setGeneratedCompetitors,
    runChatGPTSearch,
    setRunChatGPTSearch,
    data,
    error,
    showWaitlistModal,
    setShowWaitlistModal,
    closeWaitlistModal,
    generate,
    submit,
    reset,
  };

  return (
    <AuditContext.Provider value={value}>
      {children}
    </AuditContext.Provider>
  );
}

export function useAudit(): AuditContextValue {
  const ctx = useContext(AuditContext);
  if (!ctx) throw new Error("useAudit must be used within AuditProvider");
  return ctx;
}