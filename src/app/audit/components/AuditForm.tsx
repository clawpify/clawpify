import { useAudit } from "../context";

const GlobeIcon = () => (
  <svg
    width="20"
    height="20"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className="shrink-0 text-zinc-500"
  >
    <circle cx="12" cy="12" r="10" />
    <path d="M2 12h20" />
    <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
  </svg>
);

const DocumentIcon = () => (
  <svg
    width="20"
    height="20"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className="shrink-0 text-zinc-500"
  >
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
    <path d="M14 2v6h6" />
    <path d="M16 13H8" />
    <path d="M16 17H8" />
    <path d="M10 9H8" />
  </svg>
);

const ListIcon = () => (
  <svg
    width="20"
    height="20"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className="shrink-0 text-zinc-500"
  >
    <path d="M8 6h13" />
    <path d="M8 12h13" />
    <path d="M8 18h13" />
    <path d="M3 6h.01" />
    <path d="M3 12h.01" />
    <path d="M3 18h.01" />
  </svg>
);

const ChevronDownIcon = () => (
  <svg
    width="16"
    height="16"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className="shrink-0 text-zinc-400"
  >
    <path d="m6 9 6 6 6-6" />
  </svg>
);

const MetricIcon = () => (
  <svg
    width="20"
    height="20"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className="shrink-0 text-zinc-500"
  >
    <path d="M12 20V10" />
    <path d="M18 20V4" />
    <path d="M6 20v-4" />
  </svg>
);

function InputField({
  icon: Icon,
  value,
  onChange,
  placeholder,
  disabled,
}: {
  icon: React.ComponentType;
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
  disabled?: boolean;
}) {
  return (
    <div className="flex items-center gap-2 rounded-lg border border-zinc-200 bg-white px-3 py-2.5">
      <Icon />
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        disabled={disabled}
        className="min-w-0 flex-1 bg-transparent text-sm text-zinc-900 placeholder-zinc-400 focus:outline-none"
      />
      <ChevronDownIcon />
    </div>
  );
}

function DashedButton({
  icon: Icon,
  children,
  onClick,
}: {
  icon: React.ComponentType;
  children: React.ReactNode;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex w-full items-center gap-2 rounded-lg border border-dashed border-zinc-300 px-3 py-2 text-sm text-zinc-500 transition hover:border-zinc-400 hover:bg-zinc-50"
    >
      <Icon />
      {children}
    </button>
  );
}

export function AuditForm() {
  const {
    form,
    setForm,
    error,
    formStep,
    setFormStep,
    generate,
    submit,
    generatedPrompts,
    setGeneratedPrompts,
    generatedCompetitors,
    runChatGPTSearch,
    setRunChatGPTSearch,
    step,
  } = useAudit();

  const isGenerating = step === "generating";

  const handleStep1Next = async () => {
    if (!form.website_url.trim() || !form.company_name.trim()) return;
    await generate();
  };

  const addPrompt = () => {
    setGeneratedPrompts((prev) => [...prev, ""]);
  };

  const removePrompt = (i: number) => {
    setGeneratedPrompts((prev) => prev.filter((_, idx) => idx !== i));
  };

  const canProceedStep1 = form.website_url.trim() && form.company_name.trim();
  const canProceedStep2 =
    generatedPrompts.length > 0 &&
    generatedPrompts.some((p) => p.trim().length > 0);

  const showError =
    error && !error.includes("OPENAI_API_KEY not configured");

  return (
    <div className="flex flex-col gap-6">
      {showError && (
        <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </p>
      )}

      {formStep === 1 && (
        <>
          <section className="space-y-4">
            <label className="block text-sm font-normal text-zinc-600">
              Data source
            </label>
            <div className="space-y-3">
              <InputField
                icon={GlobeIcon}
                value={form.website_url}
                onChange={(v) => setForm((f) => ({ ...f, website_url: v }))}
                placeholder="example.com or https://example.com"
                disabled={isGenerating}
              />
              <InputField
                icon={DocumentIcon}
                value={form.company_name}
                onChange={(v) => setForm((f) => ({ ...f, company_name: v }))}
                placeholder="Acme Inc"
                disabled={isGenerating}
              />
            </div>
          </section>

          <button
            type="button"
            onClick={handleStep1Next}
            disabled={!canProceedStep1 || isGenerating}
            className="w-full rounded-lg border border-zinc-200 bg-white px-4 py-2.5 text-sm font-medium text-zinc-900 transition hover:bg-zinc-50 disabled:opacity-50"
          >
            {isGenerating ? "Generating..." : "Next"}
          </button>
        </>
      )}

      {formStep === 2 && (
        <>
          <section className="space-y-4">
            <label className="block text-sm font-normal text-zinc-600">
              Prompts
            </label>
            <div className="space-y-3">
              <div className="flex items-center gap-2 rounded-lg border border-zinc-200 bg-white px-3 py-2.5">
                <MetricIcon />
                <span className="flex-1 text-sm text-zinc-600">
                  {generatedPrompts.length} prompt
                  {generatedPrompts.length !== 1 ? "s" : ""}
                </span>
                <ChevronDownIcon />
              </div>

              <div className="space-y-2">
                {generatedPrompts.map((p, i) => (
                  <div
                    key={i}
                    className="flex items-start gap-2 rounded-lg border border-zinc-200 bg-white px-3 py-2.5"
                  >
                    <textarea
                      value={p}
                      onChange={(e) =>
                        setGeneratedPrompts((prev) => {
                          const next = [...prev];
                          next[i] = e.target.value;
                          return next;
                        })
                      }
                      placeholder="What are the best X tools?"
                      rows={2}
                      className="min-h-[2.5rem] min-w-0 flex-1 resize-none bg-transparent text-sm text-zinc-900 placeholder-zinc-400 focus:outline-none"
                    />
                    {generatedPrompts.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removePrompt(i)}
                        className="shrink-0 rounded p-1 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-900"
                        aria-label="Remove prompt"
                      >
                        ×
                      </button>
                    )}
                  </div>
                ))}
              </div>

              <DashedButton icon={ListIcon} onClick={addPrompt}>
                Add prompt
              </DashedButton>
            </div>
          </section>

          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setFormStep(1)}
              className="rounded-lg border border-zinc-200 px-4 py-2.5 text-sm font-medium text-zinc-900 transition hover:bg-zinc-50"
            >
              Back
            </button>
            <button
              type="button"
              onClick={() => setFormStep(3)}
              disabled={!canProceedStep2}
              className="flex-1 rounded-lg border border-zinc-200 bg-white px-4 py-2.5 text-sm font-medium text-zinc-900 transition hover:bg-zinc-50 disabled:opacity-50"
            >
              Next
            </button>
          </div>
        </>
      )}

      {formStep === 3 && (
        <>
          <section className="space-y-4">
            <label className="block text-sm font-normal text-zinc-600">
              Competitors & Analyze
            </label>
            <div className="flex items-center gap-2 rounded-lg border border-zinc-200 bg-white px-3 py-3">
              <MetricIcon />
              <span className="flex-1 text-sm text-zinc-600">
                {generatedCompetitors.length > 0 ? (
                  generatedCompetitors.join(", ")
                ) : (
                  <span className="text-zinc-400">No competitors suggested</span>
                )}
              </span>
              <ChevronDownIcon />
            </div>
          </section>

          <label className="flex cursor-pointer items-center justify-between gap-3 rounded-lg border border-zinc-200 bg-white px-3 py-3">
            <div>
              <span className="block text-sm font-medium text-zinc-900">
                Run ChatGPT search
              </span>
              <span className="block text-xs text-zinc-500">
                Query ChatGPT with web search for citations
              </span>
            </div>
            <input
              type="checkbox"
              checked={runChatGPTSearch}
              onChange={(e) => setRunChatGPTSearch(e.target.checked)}
              className="h-4 w-4 rounded border-zinc-300 text-zinc-900 focus:ring-zinc-500"
            />
          </label>

          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setFormStep(2)}
              className="rounded-lg border border-zinc-200 px-4 py-2.5 text-sm font-medium text-zinc-900 transition hover:bg-zinc-50"
            >
              Back
            </button>
            <button
              type="button"
              onClick={submit}
              className="flex-1 rounded-lg bg-zinc-900 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-zinc-800"
            >
              Analyze
            </button>
          </div>
        </>
      )}
    </div>
  );
}
