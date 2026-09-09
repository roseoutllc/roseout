type GuidedJourneyStep = 1 | 2 | 3 | 4;

const steps: Array<{ number: GuidedJourneyStep; label: string }> = [
  { number: 1, label: "PLAN" },
  { number: 2, label: "MAKE IT YOURS" },
  { number: 3, label: "PICK" },
  { number: 4, label: "COMPLETE OUTING" },
];

export default function GuidedJourneySteps({
  activeStep,
  className = "",
}: {
  activeStep: GuidedJourneyStep;
  className?: string;
}) {
  const active = steps.find((step) => step.number === activeStep) || steps[0];

  return (
    <div className={`guided-journey-steps relative z-40 mx-auto w-full sm:sticky sm:top-16 ${className}`}>
      <div
        className="rounded-[1rem] border border-white/10 bg-[#0a0a0b]/94 px-3.5 py-2.5 shadow-[0_10px_28px_rgba(0,0,0,0.28)] backdrop-blur-2xl sm:rounded-[1.15rem] sm:px-5 sm:py-3"
        aria-label={`Step ${activeStep} of 4: ${active.label}`}
      >
        <div className="flex items-center gap-2 sm:gap-3" aria-hidden="true">
          {steps.map((step, index) => {
            const isActive = activeStep === step.number;
            const complete = activeStep > step.number;

            return (
              <div key={step.number} className="contents">
                <div className="flex min-w-0 items-center gap-2 sm:gap-2.5">
                  <span
                    className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full border text-xs font-black transition-all duration-300 sm:h-9 sm:w-9 sm:text-sm ${
                      isActive
                        ? "border-[#ff4665] bg-[#e1062a] text-white shadow-[0_0_0_3px_rgba(225,6,42,0.11)]"
                        : complete
                          ? "border-[#e1062a]/45 bg-[#16070a] text-[#ff7188]"
                          : "border-white/12 bg-[#111113] text-white/35"
                    }`}
                  >
                    {complete ? "✓" : step.number}
                  </span>

                  <span
                    className={`hidden whitespace-nowrap text-[11px] font-black uppercase tracking-[0.08em] sm:inline ${
                      isActive ? "text-white" : complete ? "text-white/45" : "text-white/25"
                    }`}
                  >
                    {step.label}
                  </span>
                </div>

                {index < steps.length - 1 ? (
                  <span className={`h-px min-w-0 flex-1 ${activeStep > step.number ? "bg-[#e1062a]/45" : "bg-white/12"}`} />
                ) : null}
              </div>
            );
          })}
        </div>

        <div className="mt-2 flex items-center justify-between gap-3 border-t border-white/[0.06] pt-2 sm:hidden">
          <p className="truncate text-[10px] font-black uppercase tracking-[0.14em] text-white/82">{active.label}</p>
          <p className="shrink-0 text-[10px] font-black uppercase tracking-[0.12em] text-[#ff8297]">{activeStep} of 4</p>
        </div>
      </div>
    </div>
  );
}
