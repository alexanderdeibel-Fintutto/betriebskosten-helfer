import { Check } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Step {
  id: number;
  title: string;
  description?: string;
}

interface WizardStepperProps {
  steps: Step[];
  currentStep: number;
  onStepClick?: (step: number) => void;
}

export function WizardStepper({ steps, currentStep, onStepClick }: WizardStepperProps) {
  return (
    <nav aria-label="Fortschritt" className="w-full">
      <ol className="flex items-center justify-between">
        {steps.map((step, index) => {
          const isCompleted = currentStep > step.id;
          const isCurrent = currentStep === step.id;
          const isClickable = onStepClick && (isCompleted || isCurrent || currentStep > step.id - 1);

          return (
            <li key={step.id} className="flex-1 relative">
              <div className="flex flex-col items-center">
                {/* Connector line */}
                {index < steps.length - 1 && (
                  <div 
                    className={cn(
                      "absolute top-5 left-1/2 w-full h-0.5 -translate-y-1/2",
                      isCompleted ? "bg-stepper-completed" : "bg-stepper-pending"
                    )}
                    style={{ left: '50%' }}
                  />
                )}
                
                {/* Step circle */}
                <button
                  type="button"
                  onClick={() => isClickable && onStepClick?.(step.id)}
                  disabled={!isClickable}
                  className={cn(
                    "relative z-10 flex h-10 w-10 items-center justify-center rounded-full border-2 text-sm font-semibold transition-all",
                    isCompleted && "bg-stepper-completed border-stepper-completed text-white",
                    isCurrent && "bg-stepper-active border-stepper-active text-white",
                    !isCompleted && !isCurrent && "bg-background border-stepper-pending text-muted-foreground",
                    isClickable && "cursor-pointer hover:opacity-80",
                    !isClickable && "cursor-default"
                  )}
                >
                  {isCompleted ? (
                    <Check className="h-5 w-5" />
                  ) : (
                    step.id
                  )}
                </button>

                {/* Step label */}
                <div className="mt-2 text-center">
                  <span 
                    className={cn(
                      "text-xs font-medium",
                      (isCurrent || isCompleted) ? "text-foreground" : "text-muted-foreground"
                    )}
                  >
                    {step.title}
                  </span>
                </div>
              </div>
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
