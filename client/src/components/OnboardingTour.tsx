import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ChevronRight, ChevronLeft, X, Check } from "lucide-react";

interface TourStep {
  id: number;
  title: string;
  description: string;
  targetElement?: string;
  position?: "top" | "bottom" | "left" | "right";
  action?: string;
  actionTarget?: string;
  order: number;
}

interface OnboardingTourProps {
  tourId: number;
  title: string;
  steps: TourStep[];
  onComplete: () => void;
  onSkip: () => void;
}

interface ElementPosition {
  top: number;
  left: number;
  width: number;
  height: number;
}

export const OnboardingTour: React.FC<OnboardingTourProps> = ({
  tourId,
  title,
  steps,
  onComplete,
  onSkip,
}) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [elementPosition, setElementPosition] = useState<ElementPosition | null>(null);
  const [tooltipPosition, setTooltipPosition] = useState<{ top: number; left: number }>({ top: 0, left: 0 });
  const tooltipRef = useRef<HTMLDivElement>(null);

  const step = steps[currentStep];

  // Find and position the target element
  useEffect(() => {
    if (!step.targetElement) {
      setElementPosition(null);
      return;
    }

    const findAndPositionElement = () => {
      const element = document.querySelector(step.targetElement!);
      if (element) {
        const rect = element.getBoundingClientRect();
        setElementPosition({
          top: rect.top + window.scrollY,
          left: rect.left + window.scrollX,
          width: rect.width,
          height: rect.height,
        });

        // Calculate tooltip position
        const tooltipHeight = tooltipRef.current?.offsetHeight || 200;
        const tooltipWidth = tooltipRef.current?.offsetWidth || 300;
        const position = step.position || "bottom";
        const padding = 16;

        let top = rect.top + window.scrollY;
        let left = rect.left + window.scrollX;

        switch (position) {
          case "top":
            top -= tooltipHeight + padding;
            left += rect.width / 2 - tooltipWidth / 2;
            break;
          case "bottom":
            top += rect.height + padding;
            left += rect.width / 2 - tooltipWidth / 2;
            break;
          case "left":
            top += rect.height / 2 - tooltipHeight / 2;
            left -= tooltipWidth + padding;
            break;
          case "right":
            top += rect.height / 2 - tooltipHeight / 2;
            left += rect.width + padding;
            break;
        }

        // Keep tooltip within viewport
        const maxLeft = window.innerWidth - tooltipWidth - 16;
        const maxTop = window.innerHeight - tooltipHeight - 16;
        left = Math.max(16, Math.min(left, maxLeft));
        top = Math.max(16, Math.min(top, maxTop));

        setTooltipPosition({ top, left });
      }
    };

    findAndPositionElement();
    window.addEventListener("resize", findAndPositionElement);
    return () => window.removeEventListener("resize", findAndPositionElement);
  }, [step, currentStep]);

  // Highlight element
  useEffect(() => {
    if (!elementPosition) return;

    const overlay = document.createElement("div");
    overlay.id = "tour-highlight-overlay";
    overlay.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(0, 0, 0, 0.7);
      z-index: 999;
      pointer-events: none;
    `;

    const hole = document.createElement("div");
    hole.style.cssText = `
      position: absolute;
      top: ${elementPosition.top - window.scrollY}px;
      left: ${elementPosition.left - window.scrollX}px;
      width: ${elementPosition.width}px;
      height: ${elementPosition.height}px;
      background: transparent;
      border: 3px solid #d4af37;
      box-shadow: 0 0 0 9999px rgba(0, 0, 0, 0.7);
      border-radius: 4px;
      pointer-events: none;
    `;

    overlay.appendChild(hole);
    document.body.appendChild(overlay);

    return () => {
      const existing = document.getElementById("tour-highlight-overlay");
      if (existing) existing.remove();
    };
  }, [elementPosition]);

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      onComplete();
    }
  };

  const handlePrev = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const progress = ((currentStep + 1) / steps.length) * 100;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[1000] pointer-events-none"
      >
        {/* Tooltip */}
        <motion.div
          ref={tooltipRef}
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.9 }}
          style={{
            position: "fixed",
            top: tooltipPosition.top,
            left: tooltipPosition.left,
            zIndex: 1001,
            pointerEvents: "auto",
          }}
          className="w-80"
        >
          <Card className="bg-white shadow-2xl border-2 border-gold">
            <div className="p-6 space-y-4">
              {/* Header */}
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-bold text-lg text-gray-900">{step.title}</h3>
                  <p className="text-sm text-gray-600 mt-1">{step.description}</p>
                </div>
                <button
                  onClick={onSkip}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Progress Bar */}
              <div className="space-y-2">
                <div className="flex justify-between text-xs text-gray-500">
                  <span>Step {currentStep + 1} of {steps.length}</span>
                  <span>{Math.round(progress)}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
                  <motion.div
                    className="h-full bg-gradient-to-r from-gold to-yellow-400"
                    initial={{ width: 0 }}
                    animate={{ width: `${progress}%` }}
                    transition={{ duration: 0.3 }}
                  />
                </div>
              </div>

              {/* Navigation Buttons */}
              <div className="flex gap-3 pt-2">
                <Button
                  onClick={handlePrev}
                  disabled={currentStep === 0}
                  variant="outline"
                  size="sm"
                  className="flex-1"
                >
                  <ChevronLeft className="w-4 h-4 mr-1" />
                  Previous
                </Button>

                {currentStep === steps.length - 1 ? (
                  <Button
                    onClick={onComplete}
                    size="sm"
                    className="flex-1 bg-green-600 hover:bg-green-700"
                  >
                    <Check className="w-4 h-4 mr-1" />
                    Complete
                  </Button>
                ) : (
                  <Button onClick={handleNext} size="sm" className="flex-1 bg-gold hover:bg-yellow-500">
                    Next
                    <ChevronRight className="w-4 h-4 ml-1" />
                  </Button>
                )}
              </div>

              {/* Skip Link */}
              <button
                onClick={onSkip}
                className="w-full text-center text-sm text-gray-500 hover:text-gray-700 transition-colors py-2"
              >
                Skip Tour
              </button>
            </div>
          </Card>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default OnboardingTour;
