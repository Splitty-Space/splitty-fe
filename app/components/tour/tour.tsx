"use client"

import React, {useCallback, useEffect, useMemo, useRef, useState} from "react";
import {Tour, type StepType} from "@reactour/tour";

type TutorialStep = Omit<StepType, "selector" | "action"> & {
    selector?: string;
    action?: () => void;
};

interface TutorialProps {
    steps: TutorialStep[];
    isOpen: boolean;
    onRequestClose: () => void;
}

export default function Tutorial({steps, isOpen, onRequestClose}: TutorialProps) {
    const [currentStep, setCurrentStep] = useState(0);
    const [disabledActions, setDisabledActions] = useState(false);
    const enteredStep = useRef<number | null>(null);

    // Profile updates rebuild the steps. Only run mutations on step entry,
    // including when React Strict Mode replays an effect.
    useEffect(() => {
        if (!isOpen) {
            enteredStep.current = null;
            return;
        }
        if (enteredStep.current !== currentStep) {
            enteredStep.current = currentStep;
            steps[currentStep]?.action?.();
        }
    }, [currentStep, isOpen, steps]);

    const tourSteps = useMemo<StepType[]>(() => steps.map((step) => {
        const {action, ...presentation} = step;
        return {
            ...presentation,
            selector: step.selector ?? "[data-tour-no-target]",
            // Steps can navigate before their highlighted element is mounted.
            mutationObservables: step.selector ? [step.selector] : [],
        };
    }), [steps]);

    const setIsOpen = useCallback<React.Dispatch<React.SetStateAction<boolean>>>((next) => {
        if (!(typeof next === "function" ? next(isOpen) : next)) {
            setCurrentStep(0);
            onRequestClose();
        }
    }, [isOpen, onRequestClose]);

    return isOpen ? (
        <Tour
            styles={{
                popover: (base) => ({
                    ...base,
                    backgroundColor: "var(--tgui--secondary_bg_color, #1c1c1d)",
                    color: "var(--tgui--text_color, #fff)",
                    whiteSpace: "pre-line",
                }),
                close: (base) => ({...base, color: "var(--tgui--text_color, #fff)"}),
                arrow: (base, state) => ({
                    ...base,
                    color: state?.disabled
                        ? "var(--tgui--hint_color, #8e8e93)"
                        : "var(--tgui--text_color, #fff)",
                }),
            }}
            steps={tourSteps}
            isOpen={isOpen}
            setIsOpen={setIsOpen}
            currentStep={currentStep}
            setCurrentStep={setCurrentStep}
            disabledActions={disabledActions}
            setDisabledActions={setDisabledActions}
            onClickMask={() => {}}
            showDots={false}
            disableInteraction
        />
    ) : null;
}
