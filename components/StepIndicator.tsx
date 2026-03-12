"use client";

import { AppStep } from "@/app/page";
import { Link2, Search, Lightbulb, FileText, CheckCircle, Film, Upload } from "lucide-react";

interface StepIndicatorProps {
  currentStep: AppStep;
}

const steps = [
  { key: "input", label: "영상 입력", icon: Link2 },
  { key: "analyzing", label: "분석", icon: Search },
  { key: "topics", label: "주제 선택", icon: Lightbulb },
  { key: "result", label: "결과물", icon: FileText },
  { key: "confirm", label: "확정", icon: CheckCircle },
  { key: "production", label: "제작", icon: Film },
  { key: "upload", label: "업로드", icon: Upload },
];

// AppStep을 표시용 스텝 키에 매핑
function mapToDisplayStep(step: AppStep): string {
  switch (step) {
    case "input": return "input";
    case "analyzing": return "analyzing";
    case "topics": return "topics";
    case "generating": return "result";
    case "result": return "result";
    case "confirm": return "confirm";
    case "producing": return "production";
    case "production": return "production";
    case "upload": return "upload";
    default: return "input";
  }
}

export default function StepIndicator({ currentStep }: StepIndicatorProps) {
  const displayKeys = steps.map((s) => s.key);
  const currentDisplay = mapToDisplayStep(currentStep);
  const currentDisplayIdx = displayKeys.indexOf(currentDisplay);

  const getStepStatus = (stepKey: string) => {
    const stepIdx = displayKeys.indexOf(stepKey);

    if (stepIdx < currentDisplayIdx) return "complete";
    if (stepKey === currentDisplay) return "active";
    return "upcoming";
  };

  return (
    <div className="py-8">
      <div className="flex items-center justify-center gap-1 sm:gap-2">
        {steps.map((step, i) => {
          const status = getStepStatus(step.key);
          const Icon = step.icon;

          return (
            <div key={step.key} className="flex items-center gap-1 sm:gap-2">
              <div className="flex items-center gap-1.5 sm:gap-2.5">
                <div
                  className={`
                    w-7 h-7 sm:w-8 sm:h-8 rounded-lg flex items-center justify-center transition-all duration-300
                    ${status === "active" ? "bg-accent text-white shadow-lg shadow-accent/30" : ""}
                    ${status === "complete" ? "bg-success/15 text-success border border-success/30" : ""}
                    ${status === "upcoming" ? "bg-bg-card text-text-muted border border-border" : ""}
                  `}
                >
                  <Icon size={13} />
                </div>
                <span
                  className={`text-xs sm:text-sm font-medium hidden md:block transition-colors ${
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
                  className={`w-4 sm:w-8 h-px mx-0.5 sm:mx-1 transition-colors ${
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
