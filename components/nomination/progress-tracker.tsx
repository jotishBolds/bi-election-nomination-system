// components/nomination/progress-tracker.tsx
"use client";

import { motion } from "framer-motion";
import { Check } from "lucide-react";

interface ProgressTrackerProps {
  steps: string[];
  currentStep: number;
}

export function ProgressTracker({ steps, currentStep }: ProgressTrackerProps) {
  return (
    <div className="w-full py-4 flex justify-center">
      {" "}
      {/* Added flex justify-center */}
      <div className="w-full max-w-4xl">
        {" "}
        {/* Added max-width container */}
        {/* Desktop/Tablet View */}
        <div className="hidden sm:flex items-start justify-center">
          {" "}
          {/* Changed justify-between to justify-center */}
          {steps.map((step, index) => {
            const isCompleted = index < currentStep;
            const isCurrent = index === currentStep;
            const isLast = index === steps.length - 1;

            return (
              <div
                key={index}
                className="flex items-start"
                style={{
                  flex: index === steps.length - 1 ? "0 1 auto" : "1 1 0",
                }} // Added flexible sizing
              >
                {/* Step Circle + Label Container */}
                <div className="flex flex-col items-center flex-shrink-0">
                  {" "}
                  {/* Added flex-shrink-0 */}
                  {/* Circle */}
                  <motion.div
                    initial={false}
                    animate={{
                      scale: isCurrent ? 1.05 : 1,
                    }}
                    transition={{ duration: 0.3 }}
                    className={`
                      relative z-10 w-12 h-12 rounded-full flex items-center justify-center 
                      text-sm font-bold border-2 transition-all duration-300
                      ${
                        isCompleted
                          ? "bg-primary border-primary text-primary-foreground shadow-md"
                          : isCurrent
                            ? "bg-primary border-primary text-primary-foreground shadow-lg ring-4 ring-primary/20"
                            : "bg-background border-muted-foreground/30 text-muted-foreground"
                      }
                    `}
                  >
                    {isCompleted ? (
                      <Check className="w-5 h-5" strokeWidth={3} />
                    ) : (
                      <span>{index + 1}</span>
                    )}
                  </motion.div>
                  {/* Label */}
                  <span
                    className={`
                      mt-3 text-xs font-medium text-center max-w-[90px] leading-tight
                      transition-colors duration-300
                      ${
                        isCompleted || isCurrent
                          ? "text-primary"
                          : "text-muted-foreground"
                      }
                    `}
                  >
                    {step}
                  </span>
                </div>

                {/* Connector Line (not on last item) */}
                {!isLast && (
                  <div className="flex-1 flex items-center h-12 px-2 min-w-[40px]">
                    {" "}
                    {/* Added min-width */}
                    <div className="relative w-full h-1 bg-muted-foreground/20 rounded-full overflow-hidden">
                      <motion.div
                        className="absolute top-0 left-0 h-full bg-primary rounded-full"
                        initial={{ width: "0%" }}
                        animate={{
                          width: isCompleted ? "100%" : "0%",
                        }}
                        transition={{ duration: 0.4, ease: "easeInOut" }}
                      />
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
        {/* Mobile View - Already centered but keeping for consistency */}
        <div className="flex sm:hidden flex-col space-y-4">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="flex items-center justify-center w-8 h-8 rounded-full bg-primary text-primary-foreground text-sm font-bold">
                {currentStep + 1}
              </span>
              <div className="flex flex-col">
                <span className="text-xs text-muted-foreground">
                  Step {currentStep + 1} of {steps.length}
                </span>
                <span className="text-sm font-semibold text-foreground">
                  {steps[currentStep]}
                </span>
              </div>
            </div>
            <span className="text-xs text-muted-foreground">
              {Math.round(((currentStep + 1) / steps.length) * 100)}% Complete
            </span>
          </div>

          {/* Progress Bar */}
          <div className="relative h-2 w-full bg-muted rounded-full overflow-hidden">
            <motion.div
              className="absolute left-0 top-0 h-full bg-primary rounded-full"
              initial={{ width: "0%" }}
              animate={{
                width: `${((currentStep + 1) / steps.length) * 100}%`,
              }}
              transition={{ duration: 0.4, ease: "easeInOut" }}
            />
          </div>

          {/* Step Indicators */}
          <div className="flex justify-between">
            {steps.map((step, index) => {
              const isCompleted = index < currentStep;
              const isCurrent = index === currentStep;

              return (
                <div key={index} className="flex flex-col items-center gap-1">
                  <div
                    className={`
                      w-3 h-3 rounded-full transition-all duration-300
                      ${
                        isCompleted
                          ? "bg-primary"
                          : isCurrent
                            ? "bg-primary ring-2 ring-primary/30 ring-offset-2"
                            : "bg-muted-foreground/30"
                      }
                    `}
                  />
                  <span
                    className={`
                      text-[10px] max-w-[60px] text-center leading-tight
                      ${
                        isCompleted || isCurrent
                          ? "text-primary font-medium"
                          : "text-muted-foreground"
                      }
                    `}
                  >
                    {step}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
