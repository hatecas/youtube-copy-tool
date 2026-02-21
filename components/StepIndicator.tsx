"use client";

import { AppStep } from "@/app/page";
import { Link2, Search, Lightbulb, FileText } from "lucide-react";

interface StepIndicatorProps {
  currentStep: AppStep;
}

const steps = [
  { key: "input", label: "영상 입력", icon: Link2 },
  { key: "analyzing", label: "분석중", icon: Search },
  { key: "topics", label: "주제 선택", icon: Lightbulb },
  { key: "result", label: "결과물", icon: FileText },
];

export default function StepIndicator({ currentStep }: StepIndicatorProps) {
  const getStepStatus = (stepKey: string) => {
    const displaySteps = ["input", "analyzing", "topics", "result"];
    const stepIdx = displaySteps.indexOf(stepKey);
    const currentDisplay =
      currentStep === "generating" ? "result" : currentStep;
    const currentDisplayIdx = displaySteps.indexOf(currentDisplay);

    if (stepIdx < currentDisplayIdx) return "complete";
    if (stepKey === currentDisplay) return "active";
    if (currentStep === "generating" && stepKey === "result") return "active";
    return "upcoming";
  };

  return (
    <div className="py-8">
      <div className="flex items-center justify-center gap-2">
        {steps.map((step, i) => {
          const status = getStepStatus(step.key);
          const Icon = step.icon;

          return (
            <div key={step.key} className="flex items-center gap-2">
              <div className="flex items-center gap-2.5">
                <div
                  className={`
                    w-8 h-8 rounded-lg flex items-center justify-center transition-all duration-300
                    ${status === "active" ? "bg-accent text-white shadow-lg shadow-accent/30" : ""}
                    ${status === "complete" ? "bg-success/15 text-success border border-success/30" : ""}
                    ${status === "upcoming" ? "bg-bg-card text-text-muted border border-border" : ""}
                  `}
                >
                  <Icon size={14} />
                </div>
                <span
                  className={`text-sm font-medium hidden sm:block transition-colors ${
                    status === "active" ? "text-text-primary" : ""
                  } ${status === "complete" ? "text-success" : ""} ${
                    status === "upcoming" ? "text-text-muted" : ""
                  }`}
                >
                  {step.label}
                </span>
              </div>

              {i < steps.length - 1 && (
                <div
                  className={`w-8 h-px mx-1 transition-colors ${
                    status === "complete" ? "bg-success/40" : "bg-border"
                  }`}
                />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
