import { useCallback, useEffect, useState } from "react";
import Image from "next/image";
import "./index.css";
import Screen0 from "./screen0";
import { toast } from "react-toastify";

// Reusable header component for survey screens
function SurveyHeader({
    step,
    totalSteps,
    onClose,
    onBack
}: {
    step: number;
    totalSteps: number;
    onClose: () => void;
    onBack?: () => void;
}) {
    const isCompleted = step === totalSteps;

    return (
        <div className="survey-header">
            <button className="survey-close-btn" onClick={onClose}></button>
            <div className="survey-header-content">
                <div className="survey-title">
                    {isCompleted ? "Subscription Cancelled" : "Subscription Cancellation"}
                </div>
                <div className="survey-progress">
                    <div className="progress-dots">
                        {Array.from({ length: totalSteps }, (_, i) => {
                            let className = 'progress-dot';
                            if (isCompleted) {
                                className += ' completed'; // All dots green when completed
                            } else if (i < step - 1) {
                                className += ' completed'; // Completed steps (green)
                            } else if (i === step - 1) {
                                className += ' current'; // Current step (dark grey)
                            }
                            // Pending steps remain with default styling (light grey)
                            return (
                                <div key={i} className={className}></div>
                            );
                        })}
                    </div>
                    <div className="step-counter">
                        {isCompleted ? "Completed" : `Step ${step} of ${totalSteps}`}
                    </div>
                </div>
            </div>
            {onBack && (
                <div className="survey-back-btn" onClick={onBack}>
                    <div className="back-arrow"></div>
                    <div className="back-text">Back</div>
                </div>
            )}
        </div>
    );
}

// Mobile header component for 1-yes-flow screen
function MobileHeader({
    step,
    totalSteps,
    onClose
}: {
    step: number;
    totalSteps: number;
    onClose: () => void;
}) {
    return (
        <div className="mobile-header">
            <button className="mobile-close-btn" onClick={onClose}></button>
            <div className="mobile-header-content">
                <div className="mobile-title">Subscription Cancellation</div>
                <div className="mobile-progress">
                    <div className="mobile-progress-dots">
                        {Array.from({ length: totalSteps }, (_, i) => {
                            let className = 'mobile-progress-dot';
                            if (i < step - 1) {
                                className += ' completed'; // Completed steps (green)
                            } else if (i === step - 1) {
                                className += ' current'; // Current step (dark grey)
                            }
                            return (
                                <div key={i} className={className}></div>
                            );
                        })}
                    </div>
                    <div className="mobile-step-counter">
                        Step {step} of {totalSteps}
                    </div>
                </div>
            </div>
        </div>
    );
}

// Mobile header component for completed screens (no-help-with-visa)
function MobileHeaderCompleted({
    onClose
}: {
    onClose: () => void;
}) {
    return (
        <div className="mobile-header">
            <button className="mobile-close-btn" onClick={onClose}></button>
            <div className="mobile-header-content">
                <div className="mobile-title">Subscription Cancelled</div>
                <div className="mobile-progress">
                    <div className="mobile-progress-dots">
                        <div className="mobile-progress-dot completed"></div>
                        <div className="mobile-progress-dot completed"></div>
                        <div className="mobile-progress-dot completed"></div>
                    </div>
                    <div className="mobile-step-counter">Completed</div>
                </div>
            </div>
        </div>
    );
}

// Simple header component for offer-accepted screen
function SimpleHeader({ onClose }: { onClose: () => void }) {
    return (
        <div className="simple-header">
            <button className="simple-close-btn" onClick={onClose}></button>
            <div className="simple-header-content">
                <div className="simple-title">Subscription</div>
            </div>
        </div>
    );
}

export type CancelFlowState = {
    screen: "0",
    foundJob: boolean | undefined,
} | {
    screen: "1-yes-flow",
    foundJobUsingMM: boolean | undefined,
    rangeOfRolesApplied: string | undefined,
    rangeOfEmails: string | undefined,
    rangeOfCompanies: string | undefined,
} | {
    screen: "feedback",
    feedback: string | undefined,
    foundJobUsingMM: boolean | undefined,
} | {
    screen: "yes-with-mm",
    hasImmigrationLawyer: boolean | undefined,
} | {
    screen: "yes-after-yes-with-mm",
    visaType: string | undefined,
} | {
    screen: "no-after-yes-with-mm",
    visaType: string | undefined,
} | {
    screen: "no-without-mm",
    hasImmigrationLawyer: boolean | undefined,
} | {
    screen: "yes-after-no-without-mm",
    visaType: string | undefined,
} | {
    screen: "no-after-no-without-mm",
    visaType: string | undefined,
} | {
    screen: "no-help-with-visa",
} | {
    screen: "help-with-visa",
} | {
    screen: "1-no-flow",
} | {
    screen: "offer-accepted",
} | {
    screen: "offer-declined",
    rolesApplied: string | undefined,
    companiesEmailed: string | undefined,
    companiesInterviewed: string | undefined,
} | {
    screen: "cancellation-reason",
    reason: string | undefined,
} | {
    screen: "reason-too-expensive",
    maxPrice: string | undefined,
} | {
    screen: "reason-platform-not-helpful",
    feedback: string | undefined,
} | {
    screen: "reason-not-enough-jobs",
    feedback: string | undefined,
} | {
    screen: "reason-not-moving",
    feedback: string | undefined,
} | {
    screen: "reason-other",
    feedback: string | undefined,
} | {
    screen: "cancellation-complete-after-reason",
};


export default function CancelFlow({ userId, closeView, downsellVariant, monthlyPrice }: { userId: string, closeView: () => void, downsellVariant: "A" | "B", monthlyPrice: number }) {
    console.log("monthlyPrice", monthlyPrice);
    console.log("downsellVariant", downsellVariant);
    const [state, setState] = useState<CancelFlowState[]>([{
        screen: "0",
        foundJob: undefined,
    }]);
    const [lastSavedState, setLastSavedState] = useState<CancelFlowState[]>(state);

    useEffect(() => {
        async function saveState() {
            const stateToSave = [...state];
            const response = await fetch("/api/cancellation-flow-state", {
                method: "PUT",
                body: JSON.stringify({ userId, state: stateToSave }),
            });
            if (response.ok) {
                setLastSavedState(stateToSave);
            } else {
                toast.error("Something went wrong, please try again.");
                setState(lastSavedState);
            }
        }
        if (JSON.stringify(state) !== JSON.stringify(lastSavedState)) {
            saveState()
        }
    }, [state, userId, lastSavedState]);

    const goBack = useCallback(() => {
        const newState = [...state];
        const currScreen = newState[newState.length - 1].screen;
        while (newState.length > 0 && newState[newState.length - 1].screen === currScreen) {
            newState.pop();
        }
        if (newState[newState.length - 1].screen !== currScreen) {
            setState(newState);
        }
    }, [state]);

    const latestState = state[state.length - 1];

    if (latestState.screen === "0") {
        return <Screen0 closeView={closeView} setState={setState} state={state} downsellVariant={downsellVariant} />;
    } else if (latestState.screen === "1-yes-flow") {
        const canContinue = latestState.foundJobUsingMM !== undefined &&
            latestState.rangeOfRolesApplied !== undefined &&
            latestState.rangeOfEmails !== undefined &&
            latestState.rangeOfCompanies !== undefined;

        return (
            <div className="cancellation-popup">
                <div className="popup-overlay">
                    <div className="survey-container">
                        {/* Desktop Header */}
                        <SurveyHeader
                            step={1}
                            totalSteps={3}
                            onClose={closeView}
                            onBack={goBack}
                        />
                        {/* Mobile Header */}
                        <MobileHeader
                            step={1}
                            totalSteps={3}
                            onClose={closeView}
                        />
                        <div className="survey-content">
                            <div className="survey-left">
                                {/* Mobile Back Button - Only visible on mobile */}
                                <div className="mobile-back-button" onClick={goBack}>
                                    <div className="mobile-back-arrow"></div>
                                    <div className="mobile-back-text">Back</div>
                                </div>

                                <div className="congratulations-message">
                                    <div className="congrats-text">Congrats on the new role! 🎉</div>
                                </div>

                                <div className="survey-questions">
                                    {/* Question 1 */}
                                    <div className="question-group">
                                        <div className="question-text">Did you find this job with MigrateMate?*</div>
                                        <div className="radio-options">
                                            <button
                                                className={`radio-option ${latestState.foundJobUsingMM === true ? 'selected' : ''}`}
                                                onClick={() => {
                                                    console.log("Yes button clicked, current state:", latestState);
                                                    setState([...state, {
                                                        ...latestState,
                                                        foundJobUsingMM: true,
                                                    }]);
                                                }}
                                            >
                                                <div className="radio-text">Yes</div>
                                            </button>
                                            <button
                                                className={`radio-option ${latestState.foundJobUsingMM === false ? 'selected' : ''}`}
                                                onClick={() => setState([...state, {
                                                    ...latestState,
                                                    foundJobUsingMM: false,
                                                }])}
                                            >
                                                <div className="radio-text">No</div>
                                            </button>
                                        </div>
                                    </div>

                                    {/* Question 2 */}
                                    <div className="question-group">
                                        <div className="question-text">
                                            How many roles did you <u>apply</u> for through Migrate Mate?*
                                        </div>
                                        <div className="radio-options">
                                            {['0', '1-5', '6-20', '20+'].map((option) => (
                                                <button
                                                    key={option}
                                                    className={`radio-option ${latestState.rangeOfRolesApplied === option ? 'selected' : ''}`}
                                                    onClick={() => setState([...state, {
                                                        ...latestState,
                                                        rangeOfRolesApplied: option,
                                                    }])}
                                                >
                                                    <div className="radio-text">{option}</div>
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Question 3 */}
                                    <div className="question-group">
                                        <div className="question-text">
                                            How many companies did you <u>email</u> directly?*
                                        </div>
                                        <div className="radio-options">
                                            {['0', '1-5', '6-20', '20+'].map((option) => (
                                                <button
                                                    key={option}
                                                    className={`radio-option ${latestState.rangeOfEmails === option ? 'selected' : ''}`}
                                                    onClick={() => setState([...state, {
                                                        ...latestState,
                                                        rangeOfEmails: option,
                                                    }])}
                                                >
                                                    <div className="radio-text">{option}</div>
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Question 4 */}
                                    <div className="question-group">
                                        <div className="question-text">
                                            How many different companies did you <u>interview</u> with?*
                                        </div>
                                        <div className="radio-options">
                                            {['0', '1-2', '3-5', '5+'].map((option) => (
                                                <button
                                                    key={option}
                                                    className={`radio-option ${latestState.rangeOfCompanies === option ? 'selected' : ''}`}
                                                    onClick={() => setState([...state, {
                                                        ...latestState,
                                                        rangeOfCompanies: option,
                                                    }])}
                                                >
                                                    <div className="radio-text">{option}</div>
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                </div>

                                <div className="continue-section">
                                    <button
                                        className={`continue-btn ${canContinue ? 'enabled' : 'disabled'}`}
                                        disabled={!canContinue}
                                        onClick={() => {
                                            if (canContinue) {
                                                console.log("1-yes-flow continue clicked, latestState:", latestState);
                                                console.log("foundJobUsingMM value:", latestState.foundJobUsingMM);
                                                setState([...state, {
                                                    screen: "feedback",
                                                    feedback: undefined,
                                                    foundJobUsingMM: latestState.foundJobUsingMM,
                                                }]);
                                            }
                                        }}
                                    >
                                        <div className="continue-text">Continue</div>
                                    </button>
                                </div>
                            </div>

                            <div className="survey-right">
                                <Image
                                    src="/empire-state-compressed.jpg"
                                    alt="New York City skyline with Empire State Building at dusk"
                                    className="survey-image"
                                    width={400}
                                    height={437}
                                />
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        )
    } else if (latestState.screen === "feedback") {
        const canContinue = latestState.feedback !== undefined && latestState.feedback.length >= 25;

        return (
            <div className="cancellation-popup">
                <div className="popup-overlay">
                    <div className="feedback-container">
                        {/* Desktop Header */}
                        <SurveyHeader
                            step={2}
                            totalSteps={3}
                            onClose={closeView}
                            onBack={goBack}
                        />
                        {/* Mobile Header */}
                        <MobileHeader
                            step={2}
                            totalSteps={3}
                            onClose={closeView}
                        />
                        <div className="feedback-content">
                            <div className="feedback-left">
                                {/* Mobile Back Button - Only visible on mobile */}
                                <div className="mobile-back-button" onClick={goBack}>
                                    <div className="mobile-back-arrow"></div>
                                    <div className="mobile-back-text">Back</div>
                                </div>
                                <div className="feedback-message">
                                    <div className="feedback-title">What&apos;s one thing you wish we could&apos;ve helped you with?</div>
                                </div>

                                <div className="feedback-description">
                                    We&apos;re always looking to improve, your thoughts can help us make Migrate Mate more useful for others.*
                                </div>

                                <div className="feedback-textarea-container">
                                    <textarea
                                        className="feedback-textarea"
                                        placeholder=""
                                        value={latestState.feedback || ''}
                                        onChange={(e) => setState([...state, {
                                            ...latestState,
                                            feedback: e.target.value,
                                        }])}
                                    />
                                    <div className="character-counter">
                                        Min 25 characters ({latestState.feedback?.length || 0}/25)
                                    </div>
                                </div>

                                <div className="feedback-continue-section">
                                    <button
                                        className={`feedback-continue-btn ${canContinue ? 'enabled' : 'disabled'}`}
                                        disabled={!canContinue}
                                        onClick={() => {
                                            if (canContinue) {
                                                // Check if user found job with MigrateMate to determine next screen
                                                console.log("Current state foundJobUsingMM:", latestState.foundJobUsingMM);

                                                if (latestState.foundJobUsingMM === true) {
                                                    console.log("Transitioning to yes-with-mm");
                                                    setState([...state, {
                                                        screen: "yes-with-mm",
                                                        hasImmigrationLawyer: undefined,
                                                    }]);
                                                } else {
                                                    console.log("Transitioning to no-without-mm");
                                                    setState([...state, {
                                                        screen: "no-without-mm",
                                                        hasImmigrationLawyer: undefined,
                                                    }]);
                                                }
                                            }
                                        }}
                                    >
                                        <div className="feedback-continue-text">Continue</div>
                                    </button>
                                </div>
                            </div>

                            <div className="feedback-right">
                                <Image
                                    src="/empire-state-compressed.jpg"
                                    alt="New York City skyline with Empire State Building at dusk"
                                    className="feedback-image"
                                    width={400}
                                    height={437}
                                />
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        )
    } else if (latestState.screen === "yes-with-mm") {
        const canComplete = latestState.hasImmigrationLawyer !== undefined;

        return (
            <div className="cancellation-popup">
                <div className="popup-overlay">
                    <div className="visa-container">
                        {/* Desktop Header */}
                        <SurveyHeader
                            step={3}
                            totalSteps={3}
                            onClose={closeView}
                            onBack={goBack}
                        />
                        {/* Mobile Header */}
                        <MobileHeader
                            step={3}
                            totalSteps={3}
                            onClose={closeView}
                        />
                        <div className="visa-content">
                            <div className="visa-left">
                                {/* Mobile Back Button - Only visible on mobile */}
                                <div className="mobile-back-button" onClick={goBack}>
                                    <div className="mobile-back-arrow"></div>
                                    <div className="mobile-back-text">Back</div>
                                </div>
                                <div className="visa-message">
                                    <div className="visa-title">We helped you land the job, now let&apos;s help you secure your visa.</div>
                                </div>

                                <div className="visa-question">
                                    <div className="visa-question-text">Is your company providing an immigration lawyer to help with your visa?</div>
                                </div>

                                <div className="visa-options">
                                    <div className="visa-option" onClick={() => setState([...state, {
                                        screen: "yes-after-yes-with-mm",
                                        visaType: undefined,
                                    }])}>
                                        <div className="visa-radio">
                                            <div className={`visa-radio-circle ${latestState.hasImmigrationLawyer === true ? 'selected' : ''}`}></div>
                                        </div>
                                        <div className="visa-option-text">Yes</div>
                                    </div>
                                    <div className="visa-option" onClick={() => setState([...state, {
                                        screen: "no-after-yes-with-mm",
                                        visaType: undefined,
                                    }])}>
                                        <div className="visa-radio">
                                            <div className={`visa-radio-circle ${latestState.hasImmigrationLawyer === false ? 'selected' : ''}`}></div>
                                        </div>
                                        <div className="visa-option-text">No</div>
                                    </div>
                                </div>

                                <div className="visa-complete-section">
                                    <button
                                        className={`visa-complete-btn ${canComplete ? 'enabled' : 'disabled'}`}
                                        disabled={!canComplete}
                                        onClick={() => {
                                            if (canComplete) {
                                                setState([...state, {
                                                    ...latestState,
                                                    hasImmigrationLawyer: latestState.hasImmigrationLawyer,
                                                }]);
                                            }
                                        }}
                                    >
                                        <div className="visa-complete-text">Complete cancellation</div>
                                    </button>
                                </div>
                            </div>

                            <div className="visa-right">
                                <Image
                                    src="/empire-state-compressed.jpg"
                                    alt="New York City skyline with Empire State Building at dusk"
                                    className="visa-image"
                                    width={400}
                                    height={437}
                                />
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        )

    } else if (latestState.screen === "yes-after-yes-with-mm") {
        const canComplete = latestState.visaType !== undefined && latestState.visaType.length > 0;

        return (
            <div className="cancellation-popup">
                <div className="popup-overlay">
                    <div className="visa-container">
                        {/* Desktop Header */}
                        <SurveyHeader
                            step={3}
                            totalSteps={3}
                            onClose={closeView}
                            onBack={goBack}
                        />
                        {/* Mobile Header */}
                        <MobileHeader
                            step={3}
                            totalSteps={3}
                            onClose={closeView}
                        />
                        <div className="visa-content">
                            <div className="visa-left">
                                {/* Mobile Back Button - Only visible on mobile */}
                                <div className="mobile-back-button" onClick={goBack}>
                                    <div className="mobile-back-arrow"></div>
                                    <div className="mobile-back-text">Back</div>
                                </div>
                                <div className="visa-message">
                                    <div className="visa-title">We helped you land the job, now let&apos;s help you secure your visa.</div>
                                </div>

                                <div className="visa-question">
                                    <div className="visa-question-text">Is your company providing an immigration lawyer to help with your visa?</div>
                                </div>

                                <div className="visa-options">
                                    <div className="visa-option">
                                        <div className="visa-radio">
                                            <div className="visa-radio-circle selected"></div>
                                        </div>
                                        <div className="visa-option-text">Yes</div>
                                    </div>
                                    <div className="visa-visa-type-question">
                                        <div className="visa-type-label">What visa will you be applying for?*</div>
                                        <input
                                            type="text"
                                            className="visa-type-input"
                                            placeholder="Enter visa type..."
                                            value={latestState.visaType || ''}
                                            onChange={(e) => setState([...state, {
                                                ...latestState,
                                                visaType: e.target.value,
                                            }])}
                                        />
                                    </div>
                                </div>

                                <div className="visa-complete-section">
                                    <button
                                        className={`visa-complete-btn ${canComplete ? 'enabled' : 'disabled'}`}
                                        disabled={!canComplete}
                                        onClick={() => {
                                            if (canComplete) {
                                                setState([...state, {
                                                    screen: "no-help-with-visa",
                                                }]);
                                            }
                                        }}
                                    >
                                        <div className="visa-complete-text">Complete cancellation</div>
                                    </button>
                                </div>
                            </div>

                            <div className="visa-right">
                                <Image
                                    src="/empire-state-compressed.jpg"
                                    alt="New York City skyline with Empire State Building at dusk"
                                    className="visa-image"
                                    width={400}
                                    height={437}
                                />
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        )
    } else if (latestState.screen === "no-after-yes-with-mm") {
        const canComplete = latestState.visaType !== undefined && latestState.visaType.length > 0;

        return (
            <div className="cancellation-popup">
                <div className="popup-overlay">
                    <div className="visa-container">
                        {/* Desktop Header */}
                        <SurveyHeader
                            step={3}
                            totalSteps={3}
                            onClose={closeView}
                            onBack={goBack}
                        />
                        {/* Mobile Header */}
                        <MobileHeader
                            step={3}
                            totalSteps={3}
                            onClose={closeView}
                        />
                        <div className="visa-content">
                            <div className="visa-left">
                                {/* Mobile Back Button - Only visible on mobile */}
                                <div className="mobile-back-button" onClick={goBack}>
                                    <div className="mobile-back-arrow"></div>
                                    <div className="mobile-back-text">Back</div>
                                </div>
                                <div className="visa-message">
                                    <div className="visa-title">We helped you land the job, now let&apos;s help you secure your visa.</div>
                                </div>

                                <div className="visa-question">
                                    <div className="visa-question-text">Is your company providing an immigration lawyer to help with your visa?</div>
                                </div>

                                <div className="visa-options">
                                    <div className="visa-option">
                                        <div className="visa-radio">
                                            <div className="visa-radio-circle selected"></div>
                                        </div>
                                        <div className="visa-option-text">No</div>
                                    </div>
                                    <div className="visa-visa-type-question">
                                        <div className="visa-type-label">We can connect you with one of our trusted partners. Which visa would you like to apply for?*</div>
                                        <input
                                            type="text"
                                            className="visa-type-input"
                                            placeholder="Enter visa type..."
                                            value={latestState.visaType || ''}
                                            onChange={(e) => setState([...state, {
                                                ...latestState,
                                                visaType: e.target.value,
                                            }])}
                                        />
                                    </div>
                                </div>

                                <div className="visa-complete-section">
                                    <button
                                        className={`visa-complete-btn ${canComplete ? 'enabled' : 'disabled'}`}
                                        disabled={!canComplete}
                                        onClick={() => {
                                            if (canComplete) {
                                                setState([...state, {
                                                    screen: "help-with-visa",
                                                }]);
                                            }
                                        }}
                                    >
                                        <div className="visa-complete-text">Complete cancellation</div>
                                    </button>
                                </div>
                            </div>

                            <div className="visa-right">
                                <Image
                                    src="/empire-state-compressed.jpg"
                                    alt="New York City skyline with Empire State Building at dusk"
                                    className="visa-image"
                                    width={400}
                                    height={437}
                                />
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        )
    } else if (latestState.screen === "no-without-mm") {
        const canComplete = latestState.hasImmigrationLawyer !== undefined;

        return (
            <div className="cancellation-popup">
                <div className="popup-overlay">
                    <div className="visa-container">
                        {/* Desktop Header */}
                        <SurveyHeader
                            step={3}
                            totalSteps={3}
                            onClose={closeView}
                            onBack={goBack}
                        />
                        {/* Mobile Header */}
                        <MobileHeader
                            step={3}
                            totalSteps={3}
                            onClose={closeView}
                        />
                        <div className="visa-content">
                            <div className="visa-left">
                                {/* Mobile Back Button - Only visible on mobile */}
                                <div className="mobile-back-button" onClick={goBack}>
                                    <div className="mobile-back-arrow"></div>
                                    <div className="mobile-back-text">Back</div>
                                </div>
                                <div className="visa-message">
                                    <div className="visa-title">
                                        <span>You landed the job! <br /></span>
                                        <span style={{ fontStyle: 'italic' }}>That&apos;s what we live for.</span>
                                    </div>
                                </div>

                                <div className="visa-subtitle">
                                    <div className="visa-subtitle-text">
                                        <span>Even if it wasn&apos;t through MigrateMate, let us help get your </span>
                                        <span style={{ textDecoration: 'underline' }}>visa</span>
                                        <span> sorted.</span>
                                    </div>
                                </div>

                                <div className="visa-question">
                                    <div className="visa-question-text">Is your company providing an immigration lawyer to help with your visa?</div>
                                </div>

                                <div className="visa-options">
                                    <div className="visa-option" onClick={() => setState([...state, {
                                        screen: "yes-after-no-without-mm",
                                        visaType: undefined,
                                    }])}>
                                        <div className="visa-radio">
                                            <div className={`visa-radio-circle ${latestState.hasImmigrationLawyer === true ? 'selected' : ''}`}></div>
                                        </div>
                                        <div className="visa-option-text">Yes</div>
                                    </div>
                                    <div className="visa-option" onClick={() => setState([...state, {
                                        screen: "no-after-no-without-mm",
                                        visaType: undefined,
                                    }])}>
                                        <div className="visa-radio">
                                            <div className={`visa-radio-circle ${latestState.hasImmigrationLawyer === false ? 'selected' : ''}`}></div>
                                        </div>
                                        <div className="visa-option-text">No</div>
                                    </div>
                                </div>

                                <div className="visa-complete-section">
                                    <button
                                        className={`visa-complete-btn ${canComplete ? 'enabled' : 'disabled'}`}
                                        disabled={!canComplete}
                                        onClick={() => {
                                            if (canComplete) {
                                                setState([...state, {
                                                    screen: "no-help-with-visa",
                                                }]);
                                            }
                                        }}
                                    >
                                        <div className="visa-complete-text">Complete cancellation</div>
                                    </button>
                                </div>
                            </div>

                            <div className="visa-right">
                                <Image
                                    src="/empire-state-compressed.jpg"
                                    alt="New York City skyline with Empire State Building at dusk"
                                    className="visa-image"
                                    width={400}
                                    height={437}
                                />
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        )
    } else if (latestState.screen === "yes-after-no-without-mm") {
        const canComplete = latestState.visaType !== undefined && latestState.visaType.length > 0;

        return (
            <div className="cancellation-popup">
                <div className="popup-overlay">
                    <div className="visa-container">
                        {/* Desktop Header */}
                        <SurveyHeader
                            step={3}
                            totalSteps={3}
                            onClose={closeView}
                            onBack={goBack}
                        />
                        {/* Mobile Header */}
                        <MobileHeader
                            step={3}
                            totalSteps={3}
                            onClose={closeView}
                        />
                        <div className="visa-content">
                            <div className="visa-left">
                                {/* Mobile Back Button - Only visible on mobile */}
                                <div className="mobile-back-button" onClick={goBack}>
                                    <div className="mobile-back-arrow"></div>
                                    <div className="mobile-back-text">Back</div>
                                </div>
                                <div className="visa-message">
                                    <div className="visa-title">
                                        <span>You landed the job! <br /></span>
                                        <span style={{ fontStyle: 'italic' }}>That&apos;s what we live for.</span>
                                    </div>
                                </div>

                                <div className="visa-subtitle">
                                    <div className="visa-subtitle-text">Even if it wasn&apos;t through Migrate Mate, <br />let us help get your visa sorted.</div>
                                </div>

                                <div className="visa-question">
                                    <div className="visa-question-text">Is your company providing an immigration lawyer to help with your visa?</div>
                                </div>

                                <div className="visa-options">
                                    <div className="visa-option">
                                        <div className="visa-radio">
                                            <div className="visa-radio-circle selected"></div>
                                        </div>
                                        <div className="visa-option-text">Yes</div>
                                    </div>
                                    <div className="visa-visa-type-question">
                                        <div className="visa-type-label">What visa will you be applying for?*</div>
                                        <input
                                            type="text"
                                            className="visa-type-input"
                                            placeholder="Enter visa type..."
                                            value={latestState.visaType || ''}
                                            onChange={(e) => setState([...state, {
                                                ...latestState,
                                                visaType: e.target.value,
                                            }])}
                                        />
                                    </div>
                                </div>

                                <div className="visa-complete-section">
                                    <button
                                        className={`visa-complete-btn ${canComplete ? 'enabled' : 'disabled'}`}
                                        disabled={!canComplete}
                                        onClick={() => {
                                            if (canComplete) {
                                                setState([...state, {
                                                    screen: "no-help-with-visa",
                                                }]);
                                            }
                                        }}
                                    >
                                        <div className="visa-complete-text">Complete cancellation</div>
                                    </button>
                                </div>
                            </div>

                            <div className="visa-right">
                                <Image
                                    src="/empire-state-compressed.jpg"
                                    alt="New York City skyline with Empire State Building at dusk"
                                    className="visa-image"
                                    width={400}
                                    height={437}
                                />
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        )
    } else if (latestState.screen === "no-after-no-without-mm") {
        const canComplete = latestState.visaType !== undefined && latestState.visaType.length > 0;

        return (
            <div className="cancellation-popup">
                <div className="popup-overlay">
                    <div className="visa-container">
                        {/* Desktop Header */}
                        <SurveyHeader
                            step={3}
                            totalSteps={3}
                            onClose={closeView}
                            onBack={goBack}
                        />
                        {/* Mobile Header */}
                        <MobileHeader
                            step={3}
                            totalSteps={3}
                            onClose={closeView}
                        />
                        <div className="visa-content">
                            <div className="visa-left">
                                {/* Mobile Back Button - Only visible on mobile */}
                                <div className="mobile-back-button" onClick={goBack}>
                                    <div className="mobile-back-arrow"></div>
                                    <div className="mobile-back-text">Back</div>
                                </div>
                                <div className="visa-message">
                                    <div className="visa-title">
                                        <span>You landed the job! <br /></span>
                                        <span style={{ fontStyle: 'italic' }}>That&apos;s what we live for.</span>
                                    </div>
                                </div>

                                <div className="visa-subtitle">
                                    <div className="visa-subtitle-text">Even if it wasn&apos;t through Migrate Mate, <br />let us help get your visa sorted.</div>
                                </div>

                                <div className="visa-question">
                                    <div className="visa-question-text">Is your company providing an immigration lawyer to help with your visa?</div>
                                </div>

                                <div className="visa-options">
                                    <div className="visa-option">
                                        <div className="visa-radio">
                                            <div className="visa-radio-circle selected"></div>
                                        </div>
                                        <div className="visa-option-text">No</div>
                                    </div>
                                    <div className="visa-visa-type-question">
                                        <div className="visa-type-label">We can connect you with one of our trusted partners. Which visa would you like to apply for?*</div>
                                        <input
                                            type="text"
                                            className="visa-type-input"
                                            placeholder="Enter visa type..."
                                            value={latestState.visaType || ''}
                                            onChange={(e) => setState([...state, {
                                                ...latestState,
                                                visaType: e.target.value,
                                            }])}
                                        />
                                    </div>
                                </div>

                                <div className="visa-complete-section">
                                    <button
                                        className={`visa-complete-btn ${canComplete ? 'enabled' : 'disabled'}`}
                                        disabled={!canComplete}
                                        onClick={() => {
                                            if (canComplete) {
                                                setState([...state, {
                                                    screen: "help-with-visa",
                                                }]);
                                            }
                                        }}
                                    >
                                        <div className="visa-complete-text">Complete cancellation</div>
                                    </button>
                                </div>
                            </div>

                            <div className="visa-right">
                                <Image
                                    src="/empire-state-compressed.jpg"
                                    alt="New York City skyline with Empire State Building at dusk"
                                    className="visa-image"
                                    width={400}
                                    height={437}
                                />
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        )
    } else if (latestState.screen === "no-help-with-visa") {
        return (
            <div className="cancellation-popup">
                <div className="popup-overlay">
                    <div className="visa-container">
                        {/* Desktop Header */}
                        <SurveyHeader
                            step={3}
                            totalSteps={3}
                            onClose={closeView}
                        />
                        {/* Mobile Header */}
                        <MobileHeaderCompleted
                            onClose={closeView}
                        />
                        <div className="visa-content">
                            <div className="visa-left">
                                {/* Mobile Image - Only visible on mobile */}
                                <Image
                                    src="/empire-state-compressed.jpg"
                                    alt="New York City skyline with Empire State Building at dusk"
                                    className="visa-image mobile-only"
                                    width={296}
                                    height={122}
                                />

                                <div className="visa-message">
                                    <div className="visa-title">All done, your cancellation&apos;s <br />been processed.</div>
                                </div>

                                <div className="visa-subtitle">
                                    <div className="visa-subtitle-text">We&apos;re stoked to hear you&apos;ve landed a job and sorted your visa. Big congrats from the team. 🙌</div>
                                </div>

                                <div className="visa-complete-section">
                                    <button
                                        className="visa-complete-btn enabled"
                                        onClick={closeView}
                                    >
                                        <div className="visa-complete-text">Finish</div>
                                    </button>
                                </div>
                            </div>

                            <div className="visa-right">
                                <Image
                                    src="/empire-state-compressed.jpg"
                                    alt="New York City skyline with Empire State Building at dusk"
                                    className="visa-image"
                                    width={400}
                                    height={437}
                                />
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        )
    } else if (latestState.screen === "help-with-visa") {
        return (
            <div className="cancellation-popup">
                <div className="popup-overlay">
                    <div className="visa-container">
                        {/* Desktop Header */}
                        <SurveyHeader
                            step={3}
                            totalSteps={3}
                            onClose={closeView}
                        />
                        {/* Mobile Header */}
                        <MobileHeaderCompleted
                            onClose={closeView}
                        />
                        <div className="visa-content">
                            <div className="visa-left">
                                <div className="visa-message">
                                    <div className="visa-title">Your cancellation&apos;s all sorted, mate, no more charges.</div>
                                </div>

                                <div className="visa-contact-card">
                                    <div className="visa-contact-header">
                                        <Image
                                            src="/mihailo-profile.jpeg"
                                            alt="Mihailo Bozic profile"
                                            className="visa-contact-avatar"
                                            width={40}
                                            height={40}
                                        />
                                        <div className="visa-contact-info">
                                            <div className="visa-contact-name">Mihailo Bozic</div>
                                            <div className="visa-contact-email">&lt;mihailo@migratemate.co&gt;</div>
                                        </div>
                                    </div>
                                    <div className="visa-contact-message">
                                        <div className="visa-message-content">
                                            <span className="visa-message-bold">I&apos;ll be reaching out soon to help with the visa side of things.<br /></span>
                                            <span className="visa-message-normal"><br />We&apos;ve got your back, whether it&apos;s questions, paperwork, or just figuring out your options.<br /><br /></span>
                                            <span className="visa-message-medium">Keep an eye on your inbox, I&apos;ll be in touch </span>
                                            <span className="visa-message-underline">shortly</span>
                                            <span className="visa-message-medium">.</span>
                                        </div>
                                    </div>
                                </div>

                                <div className="visa-complete-section">
                                    <button
                                        className="visa-complete-btn enabled"
                                        onClick={closeView}
                                    >
                                        <div className="visa-complete-text">Finish</div>
                                    </button>
                                </div>
                            </div>

                            <div className="visa-right">
                                <Image
                                    src="/empire-state-compressed.jpg"
                                    alt="New York City skyline with Empire State Building at dusk"
                                    className="visa-image"
                                    width={400}
                                    height={437}
                                />
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        )
    } else if (latestState.screen === "1-no-flow") {
        return (
            <div className="cancellation-popup">
                <div className="popup-overlay">
                    <div className="discount-container">
                        {/* Desktop Header */}
                        <SurveyHeader
                            step={1}
                            totalSteps={3}
                            onClose={closeView}
                            onBack={goBack}
                        />
                        {/* Mobile Header */}
                        <MobileHeader
                            step={1}
                            totalSteps={3}
                            onClose={closeView}
                        />
                        <div className="discount-content">
                            <div className="discount-left">
                                {/* Mobile Back Button - Only visible on mobile */}
                                <div className="mobile-back-button" onClick={goBack}>
                                    <div className="mobile-back-arrow"></div>
                                    <div className="mobile-back-text">Back</div>
                                </div>
                                <div className="discount-message">
                                    <div className="discount-title">We built this to help you land the job, this makes it a little easier.</div>
                                </div>

                                <div className="discount-subtitle">
                                    We&apos;ve been there and we&apos;re here to help you.
                                </div>

                                <div className="discount-offer-card">
                                    <div className="discount-offer-content">
                                        <div className="discount-offer-title">
                                            <span className="discount-title-text">Here&apos;s</span>
                                            <span className="discount-title-underline">$10 off</span>
                                            <span className="discount-title-text">until you find a job.</span>
                                        </div>
                                        <div className="discount-pricing">
                                            <div className="discount-price">
                                                <span className="discount-price-amount">${(monthlyPrice / 100) - 10}</span>
                                                <span className="discount-price-period">/month</span>
                                            </div>
                                            <div className="discount-original-price">${monthlyPrice / 100}/month</div>
                                        </div>
                                    </div>
                                    <div className="discount-actions">
                                        <button
                                            className="discount-accept-btn"
                                            onClick={() => setState([...state, {
                                                screen: "offer-accepted",
                                            }])}
                                        >
                                            <div className="discount-accept-text">Get $10 off</div>
                                        </button>
                                        <div className="discount-note">You wont be charged until your next billing date.</div>
                                    </div>
                                </div>

                                <div className="discount-decline-section">
                                    <button
                                        className="discount-decline-btn"
                                        onClick={() => setState([...state, {
                                            screen: "offer-declined",
                                            rolesApplied: undefined,
                                            companiesEmailed: undefined,
                                            companiesInterviewed: undefined,
                                        }])}
                                    >
                                        <div className="discount-decline-text">No thanks</div>
                                    </button>
                                </div>
                            </div>

                            <div className="discount-right">
                                <Image
                                    src="/empire-state-compressed.jpg"
                                    alt="New York City skyline with Empire State Building at dusk"
                                    className="discount-image"
                                    width={400}
                                    height={437}
                                />
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        )
    } else if (latestState.screen === "offer-accepted") {
        return (
            <div className="cancellation-popup">
                <div className="popup-overlay">
                    <div className="offer-accepted-container">
                        <SimpleHeader onClose={closeView} />
                        <div className="offer-accepted-content">
                            <div className="offer-accepted-left">
                                <div className="offer-accepted-message">
                                    <div className="offer-accepted-title">
                                        <span className="offer-title-line1">Great choice, mate!<br /></span>
                                        <span className="offer-title-line2">You&apos;re still on the path to your dream role. </span>
                                        <span className="offer-title-highlight">Let&apos;s make it happen together!</span>
                                    </div>
                                </div>

                                <div className="offer-accepted-details">
                                    <span className="offer-details-main">You&apos;ve got XX days left on your current plan.    Starting from XX date, your monthly payment will be $12.50.<br /><br /></span>
                                    <span className="offer-details-note">You can cancel anytime before then.</span>
                                </div>

                                <div className="offer-accepted-actions">
                                    <div className="offer-actions-container">
                                        <div className="offer-actions-content">
                                            <button className="offer-cta-btn">
                                                <div className="offer-cta-text">Land your dream role</div>
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="offer-accepted-right">
                                <Image
                                    src="/empire-state-compressed.jpg"
                                    alt="New York City skyline with Empire State Building at dusk"
                                    className="offer-accepted-image"
                                    width={400}
                                    height={437}
                                />
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        )
    } else if (latestState.screen === "offer-declined") {
        const canContinue = latestState.rolesApplied !== undefined &&
            latestState.companiesEmailed !== undefined &&
            latestState.companiesInterviewed !== undefined;

        return (
            <div className="cancellation-popup">
                <div className="popup-overlay">
                    <div className="offer-declined-container">
                        <SurveyHeader
                            step={2}
                            totalSteps={3}
                            onClose={closeView}
                            onBack={goBack}
                        />
                        <div className="offer-declined-content">
                            <div className="offer-declined-left">
                                <div className="offer-declined-message">
                                    <div className="offer-declined-title">Help us understand how you <br />were using Migrate Mate.</div>
                                </div>

                                <div className="offer-declined-questions">
                                    {/* Question 1 */}
                                    <div className="offer-question-group">
                                        <div className="offer-question-text">
                                            <span className="offer-question-normal">How many roles did you </span>
                                            <span className="offer-question-underline">apply</span>
                                            <span className="offer-question-normal"> for through Migrate Mate?</span>
                                        </div>
                                        <div className="offer-radio-options">
                                            {['0', '1-5', '6-20', '20+'].map((option) => (
                                                <button
                                                    key={option}
                                                    className={`offer-radio-option ${latestState.rolesApplied === option ? 'selected' : ''}`}
                                                    onClick={() => setState([...state, {
                                                        ...latestState,
                                                        rolesApplied: option,
                                                    }])}
                                                >
                                                    <div className="offer-radio-text">{option}</div>
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Question 2 */}
                                    <div className="offer-question-group">
                                        <div className="offer-question-text">
                                            <span className="offer-question-normal">How many companies did you </span>
                                            <span className="offer-question-underline">email</span>
                                            <span className="offer-question-normal"> directly?</span>
                                        </div>
                                        <div className="offer-radio-options">
                                            {['0', '1-5', '6-20', '20+'].map((option) => (
                                                <button
                                                    key={option}
                                                    className={`offer-radio-option ${latestState.companiesEmailed === option ? 'selected' : ''}`}
                                                    onClick={() => setState([...state, {
                                                        ...latestState,
                                                        companiesEmailed: option,
                                                    }])}
                                                >
                                                    <div className="offer-radio-text">{option}</div>
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Question 3 */}
                                    <div className="offer-question-group">
                                        <div className="offer-question-text">
                                            <span className="offer-question-normal">How many different companies did you </span>
                                            <span className="offer-question-underline">interview</span>
                                            <span className="offer-question-normal"> with?</span>
                                        </div>
                                        <div className="offer-radio-options">
                                            {['0', '1-2', '3-5', '5+'].map((option) => (
                                                <button
                                                    key={option}
                                                    className={`offer-radio-option ${latestState.companiesInterviewed === option ? 'selected' : ''}`}
                                                    onClick={() => setState([...state, {
                                                        ...latestState,
                                                        companiesInterviewed: option,
                                                    }])}
                                                >
                                                    <div className="offer-radio-text">{option}</div>
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                </div>

                                <div className="offer-declined-actions">
                                    {downsellVariant === "B" && <button
                                        className="offer-accept-btn"
                                        onClick={() => setState([...state, {
                                            screen: "offer-accepted",
                                        }])}
                                    >
                                        <div className="offer-accept-text">
                                            <span className="offer-accept-main">Get $10 off | $ {monthlyPrice / 100} </span>
                                            <span className="offer-accept-strikethrough">${(monthlyPrice / 100) - 10}</span>
                                        </div>
                                    </button>}
                                    <button
                                        className={`offer-continue-btn ${canContinue ? 'enabled' : 'disabled'}`}
                                        disabled={!canContinue}
                                        onClick={() => {
                                            if (canContinue) {
                                                setState([...state, {
                                                    screen: "cancellation-reason",
                                                    reason: undefined,
                                                }]);
                                            }
                                        }}
                                    >
                                        <div className="offer-continue-text">Continue</div>
                                    </button>
                                </div>
                            </div>

                            <div className="offer-declined-right">
                                <Image
                                    src="/empire-state-compressed.jpg"
                                    alt="New York City skyline with Empire State Building at dusk"
                                    className="offer-declined-image"
                                    width={400}
                                    height={437}
                                />
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        )
    } else if (latestState.screen === "cancellation-reason") {
        const canContinue = latestState.reason !== undefined;

        return (
            <div className="cancellation-popup">
                <div className="popup-overlay">
                    <div className="cancellation-reason-container">
                        <SurveyHeader
                            step={3}
                            totalSteps={3}
                            onClose={closeView}
                            onBack={goBack}
                        />
                        <div className="cancellation-reason-content">
                            <div className="cancellation-reason-left">
                                <div className="cancellation-reason-message">
                                    <div className="cancellation-reason-title">What&apos;s the main <br />reason for cancelling?</div>
                                    <div className="cancellation-reason-subtitle">Please take a minute to let us know why:</div>
                                </div>

                                <div className="cancellation-reason-options">
                                    {[
                                        "Too expensive",
                                        "Platform not helpful",
                                        "Not enough relevant jobs",
                                        "Decided not to move",
                                        "Other"
                                    ].map((option) => (
                                        <div
                                            key={option}
                                            className={`cancellation-reason-option ${latestState.reason === option ? 'selected' : ''}`}
                                            onClick={() => {
                                                if (option === "Too expensive") {
                                                    setState([...state, {
                                                        screen: "reason-too-expensive",
                                                        maxPrice: undefined,
                                                    }]);
                                                } else if (option === "Platform not helpful") {
                                                    setState([...state, {
                                                        screen: "reason-platform-not-helpful",
                                                        feedback: undefined,
                                                    }]);
                                                } else if (option === "Not enough relevant jobs") {
                                                    setState([...state, {
                                                        screen: "reason-not-enough-jobs",
                                                        feedback: undefined,
                                                    }]);
                                                } else if (option === "Decided not to move") {
                                                    setState([...state, {
                                                        screen: "reason-not-moving",
                                                        feedback: undefined,
                                                    }]);
                                                } else if (option === "Other") {
                                                    setState([...state, {
                                                        screen: "reason-other",
                                                        feedback: undefined,

                                                    }]);
                                                } else {
                                                    setState([...state, {
                                                        ...latestState,
                                                        reason: option,
                                                    }]);
                                                }
                                            }}
                                        >
                                            <div className="cancellation-reason-radio">
                                                <div className={`cancellation-reason-radio-circle ${latestState.reason === option ? 'selected' : ''}`}></div>
                                            </div>
                                            <div className="cancellation-reason-text">{option}</div>
                                        </div>
                                    ))}
                                </div>

                                <div className="cancellation-reason-actions">
                                    <button
                                        className="cancellation-accept-btn"
                                        onClick={() => setState([...state, {
                                            screen: "offer-accepted",
                                        }])}
                                    >
                                        <div className="cancellation-accept-text">
                                            <span className="cancellation-accept-main">Get $10 off | $ {monthlyPrice / 100}  </span>
                                            <span className="cancellation-accept-strikethrough">${(monthlyPrice / 100) - 10}</span>
                                        </div>
                                    </button>
                                    <button
                                        className={`cancellation-complete-btn ${canContinue ? 'enabled' : 'disabled'}`}
                                        disabled={!canContinue}
                                        onClick={() => {
                                            closeView();
                                        }}
                                    >
                                        <div className="cancellation-complete-text">Complete cancellation</div>
                                    </button>
                                </div>
                            </div>

                            <div className="cancellation-reason-right">
                                <Image
                                    src="/empire-state-compressed.jpg"
                                    alt="New York City skyline with Empire State Building at dusk"
                                    className="cancellation-reason-image"
                                    width={400}
                                    height={437}
                                />
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        )
    } else if (latestState.screen === "reason-too-expensive") {
        const canContinue = latestState.maxPrice !== undefined && latestState.maxPrice.length > 0;

        return (
            <div className="cancellation-popup">
                <div className="popup-overlay">
                    <div className="reason-too-expensive-container">
                        <SurveyHeader
                            step={3}
                            totalSteps={3}
                            onClose={closeView}
                            onBack={goBack}
                        />
                        <div className="reason-too-expensive-content">
                            <div className="reason-too-expensive-left">
                                <div className="reason-too-expensive-main-container">
                                    <div className="reason-too-expensive-message">
                                        <div className="reason-too-expensive-title">What&apos;s the main <br />reason for cancelling?</div>
                                        <div className="reason-too-expensive-subtitle">Please take a minute to let us know why:</div>
                                    </div>

                                    <div className="reason-too-expensive-option-section">
                                        <div className="reason-too-expensive-option-content">
                                            <div className="reason-too-expensive-radio">
                                                <div className="reason-too-expensive-radio-circle selected"></div>
                                            </div>
                                            <div className="reason-too-expensive-option-text">Too expensive</div>
                                        </div>
                                        <div className="reason-too-expensive-question-text">What would be the maximum you would be willing to pay?*</div>
                                        <div className="reason-too-expensive-input-container">
                                            <div className="reason-too-expensive-currency">$</div>
                                            <input
                                                type="text"
                                                className="reason-too-expensive-input"
                                                placeholder=""
                                                value={latestState.maxPrice || ''}
                                                onChange={(e) => {
                                                    const value = e.target.value;
                                                    // Only allow numbers and one decimal point
                                                    const numericValue = value.replace(/[^0-9.]/g, '');
                                                    // Ensure only one decimal point
                                                    const parts = numericValue.split('.');
                                                    const validValue = parts.length > 2
                                                        ? parts[0] + '.' + parts.slice(1).join('')
                                                        : numericValue;

                                                    setState([...state, {
                                                        ...latestState,
                                                        maxPrice: validValue,
                                                    }]);
                                                }}
                                            />
                                        </div>
                                    </div>

                                    <div className="reason-too-expensive-actions">
                                        {downsellVariant === "B" && <button
                                            className="reason-too-expensive-accept-btn"
                                            onClick={() => setState([...state, {
                                                screen: "offer-accepted",
                                            }])}
                                        >
                                            <div className="reason-too-expensive-accept-text">
                                                <span className="reason-too-expensive-accept-main">Get $10 off | $ {monthlyPrice / 100}</span>
                                                <span className="reason-too-expensive-accept-strikethrough">${(monthlyPrice / 100) - 10}</span>
                                            </div>
                                        </button>}
                                        <button
                                            className={`reason-too-expensive-complete-btn ${canContinue ? 'enabled' : 'disabled'}`}
                                            disabled={!canContinue}
                                            onClick={() => {
                                                if (canContinue) {
                                                    setState([...state, {
                                                        screen: "cancellation-complete-after-reason",
                                                    }]);
                                                }
                                            }}
                                        >
                                            <div className="reason-too-expensive-complete-text">Complete cancellation</div>
                                        </button>
                                    </div>
                                </div>
                            </div>

                            <div className="reason-too-expensive-right">
                                <Image
                                    src="/empire-state-compressed.jpg"
                                    alt="New York City skyline with Empire State Building at dusk"
                                    className="reason-too-expensive-image"
                                    width={400}
                                    height={437}
                                />
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        )
    } else if (latestState.screen === "reason-platform-not-helpful") {
        const canContinue = latestState.feedback !== undefined && latestState.feedback.length >= 25;

        return (
            <div className="cancellation-popup">
                <div className="popup-overlay">
                    <div className="reason-platform-not-helpful-container">
                        <SurveyHeader
                            step={3}
                            totalSteps={3}
                            onClose={closeView}
                            onBack={goBack}
                        />
                        <div className="reason-platform-not-helpful-content">
                            <div className="reason-platform-not-helpful-left">
                                <div className="reason-platform-not-helpful-main-container">
                                    <div className="reason-platform-not-helpful-message">
                                        <div className="reason-platform-not-helpful-title">What&apos;s the main reason?</div>
                                        <div className="reason-platform-not-helpful-subtitle">Please take a minute to let us know why:</div>
                                    </div>

                                    <div className="reason-platform-not-helpful-option-section">
                                        <div className="reason-platform-not-helpful-option-content">
                                            <div className="reason-platform-not-helpful-radio">
                                                <div className="reason-platform-not-helpful-radio-circle selected"></div>
                                            </div>
                                            <div className="reason-platform-not-helpful-option-text">Platform not helpful</div>
                                        </div>
                                        <div className="reason-platform-not-helpful-question-text">What can we change to make the platform more helpful?*</div>
                                        <div className="reason-platform-not-helpful-requirement-text">Please enter at least 25 characters so we can understand your feedback*</div>
                                        <div className="reason-platform-not-helpful-textarea-container">
                                            <textarea
                                                className="reason-platform-not-helpful-textarea"
                                                placeholder=""
                                                value={latestState.feedback || ''}
                                                onChange={(e) => setState([...state, {
                                                    ...latestState,
                                                    feedback: e.target.value,
                                                }])}
                                            />
                                            <div className="reason-platform-not-helpful-character-counter">
                                                Min 25 characters ({latestState.feedback?.length || 0}/25)
                                            </div>
                                        </div>
                                    </div>

                                    <div className="reason-platform-not-helpful-actions">
                                        {downsellVariant === "B" && <button
                                            className="reason-platform-not-helpful-accept-btn"
                                            onClick={() => setState([...state, {
                                                screen: "offer-accepted",
                                            }])}
                                        >
                                            <div className="reason-platform-not-helpful-accept-text">
                                                <span className="reason-platform-not-helpful-accept-main">Get $10 off | $ {monthlyPrice / 100} </span>
                                                <span className="reason-platform-not-helpful-accept-strikethrough">${(monthlyPrice / 100) - 10}</span>
                                            </div>
                                        </button>}
                                        <button
                                            className={`reason-platform-not-helpful-complete-btn ${canContinue ? 'enabled' : 'disabled'}`}
                                            disabled={!canContinue}
                                            onClick={() => {
                                                if (canContinue) {
                                                    setState([...state, {
                                                        screen: "cancellation-complete-after-reason",
                                                    }]);
                                                }
                                            }}
                                        >
                                            <div className="reason-platform-not-helpful-complete-text">Complete cancellation</div>
                                        </button>
                                    </div>
                                </div>
                            </div>

                            <div className="reason-platform-not-helpful-right">
                                <Image
                                    src="/empire-state-compressed.jpg"
                                    alt="New York City skyline with Empire State Building at dusk"
                                    className="reason-platform-not-helpful-image"
                                    width={400}
                                    height={437}
                                />
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        )
    } else if (latestState.screen === "reason-not-enough-jobs") {
        const canContinue = latestState.feedback !== undefined && latestState.feedback.length >= 25;

        return (
            <div className="cancellation-popup">
                <div className="popup-overlay">
                    <div className="reason-not-enough-jobs-container">
                        <SurveyHeader
                            step={3}
                            totalSteps={3}
                            onClose={closeView}
                            onBack={goBack}
                        />
                        <div className="reason-not-enough-jobs-content">
                            <div className="reason-not-enough-jobs-left">
                                <div className="reason-not-enough-jobs-main-container">
                                    <div className="reason-not-enough-jobs-message">
                                        <div className="reason-not-enough-jobs-title">What&apos;s the main reason?</div>
                                        <div className="reason-not-enough-jobs-subtitle">Please take a minute to let us know why:</div>
                                    </div>

                                    <div className="reason-not-enough-jobs-option-section">
                                        <div className="reason-not-enough-jobs-option-content">
                                            <div className="reason-not-enough-jobs-radio">
                                                <div className="reason-not-enough-jobs-radio-circle selected"></div>
                                            </div>
                                            <div className="reason-not-enough-jobs-option-text">Not enough relevant jobs</div>
                                        </div>
                                        <div className="reason-not-enough-jobs-question-text">In which way can we make the jobs more relevant?*</div>
                                        <div className="reason-not-enough-jobs-textarea-container">
                                            <textarea
                                                className="reason-not-enough-jobs-textarea"
                                                placeholder=""
                                                value={latestState.feedback || ''}
                                                onChange={(e) => setState([...state, {
                                                    ...latestState,
                                                    feedback: e.target.value,
                                                }])}
                                            />
                                            <div className="reason-not-enough-jobs-character-counter">
                                                Min 25 characters ({latestState.feedback?.length || 0}/25)
                                            </div>
                                        </div>
                                    </div>

                                    <div className="reason-not-enough-jobs-actions">
                                        {downsellVariant === "B" && <button
                                            className="reason-not-enough-jobs-accept-btn"
                                            onClick={() => setState([...state, {
                                                screen: "offer-accepted",
                                            }])}
                                        >
                                            <div className="reason-not-enough-jobs-accept-text">
                                                <span className="reason-not-enough-jobs-accept-main">Get $10 off | $ {monthlyPrice / 100} </span>
                                                <span className="reason-not-enough-jobs-accept-strikethrough">$ {(monthlyPrice / 100) - 10}</span>
                                            </div>
                                        </button>}
                                        <button
                                            className={`reason-not-enough-jobs-complete-btn ${canContinue ? 'enabled' : 'disabled'}`}
                                            disabled={!canContinue}
                                            onClick={() => {
                                                if (canContinue) {
                                                    setState([...state, {
                                                        screen: "cancellation-complete-after-reason",
                                                    }]);
                                                }
                                            }}
                                        >
                                            <div className="reason-not-enough-jobs-complete-text">Complete cancellation</div>
                                        </button>
                                    </div>
                                </div>
                            </div>

                            <div className="reason-not-enough-jobs-right">
                                <Image
                                    src="/empire-state-compressed.jpg"
                                    alt="New York City skyline with Empire State Building at dusk"
                                    className="reason-not-enough-jobs-image"
                                    width={400}
                                    height={437}
                                />
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        )
    } else if (latestState.screen === "reason-not-moving") {
        const canContinue = latestState.feedback !== undefined && latestState.feedback.length >= 25;

        return (
            <div className="cancellation-popup">
                <div className="popup-overlay">
                    <div className="reason-not-moving-container">
                        <SurveyHeader
                            step={3}
                            totalSteps={3}
                            onClose={closeView}
                            onBack={goBack}
                        />
                        <div className="reason-not-moving-content">
                            <div className="reason-not-moving-left">
                                <div className="reason-not-moving-main-container">
                                    <div className="reason-not-moving-message">
                                        <div className="reason-not-moving-title">What&apos;s the main reason?</div>
                                        <div className="reason-not-moving-subtitle">Please take a minute to let us know why:</div>
                                    </div>

                                    <div className="reason-not-moving-option-section">
                                        <div className="reason-not-moving-option-content">
                                            <div className="reason-not-moving-radio">
                                                <div className="reason-not-moving-radio-circle selected"></div>
                                            </div>
                                            <div className="reason-not-moving-option-text">Decided not to move</div>
                                        </div>
                                        <div className="reason-not-moving-question-text">What changed for you to decide to not move?*</div>
                                        <div className="reason-not-moving-textarea-container">
                                            <textarea
                                                className="reason-not-moving-textarea"
                                                placeholder=""
                                                value={latestState.feedback || ''}
                                                onChange={(e) => setState([...state, {
                                                    ...latestState,
                                                    feedback: e.target.value,
                                                }])}
                                            />
                                            <div className="reason-not-moving-character-counter">
                                                Min 25 characters ({latestState.feedback?.length || 0}/25)
                                            </div>
                                        </div>
                                    </div>

                                    <div className="reason-not-moving-actions">
                                        {downsellVariant === "B" && <button
                                            className="reason-not-moving-accept-btn"
                                            onClick={() => setState([...state, {
                                                screen: "offer-accepted",
                                            }])}
                                        >
                                            <div className="reason-not-moving-accept-text">
                                                <span className="reason-not-moving-accept-main">Get $10 off | ${monthlyPrice / 100} </span>
                                                <span className="reason-not-moving-accept-strikethrough">{(monthlyPrice / 100) - 10}</span>
                                            </div>
                                        </button>}
                                        <button
                                            className={`reason-not-moving-complete-btn ${canContinue ? 'enabled' : 'disabled'}`}
                                            disabled={!canContinue}
                                            onClick={() => {
                                                if (canContinue) {
                                                    setState([...state, {
                                                        screen: "cancellation-complete-after-reason",
                                                    }]);
                                                }
                                            }}
                                        >
                                            <div className="reason-not-moving-complete-text">Complete cancellation</div>
                                        </button>
                                    </div>
                                </div>
                            </div>

                            <div className="reason-not-moving-right">
                                <Image
                                    src="/empire-state-compressed.jpg"
                                    alt="New York City skyline with Empire State Building at dusk"
                                    className="reason-not-moving-image"
                                    width={400}
                                    height={437}
                                />
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        )
    } else if (latestState.screen === "reason-other") {
        const canContinue = latestState.feedback !== undefined && latestState.feedback.length >= 25;

        return (
            <div className="cancellation-popup">
                <div className="popup-overlay">
                    <div className="reason-other-container">
                        <SurveyHeader
                            step={3}
                            totalSteps={3}
                            onClose={closeView}
                            onBack={goBack}
                        />
                        <div className="reason-other-content">
                            <div className="reason-other-left">
                                <div className="reason-other-main-container">
                                    <div className="reason-other-message">
                                        <div className="reason-other-title">What&apos;s the main reason?</div>
                                        <div className="reason-other-subtitle">Please take a minute to let us know why:</div>
                                    </div>

                                    <div className="reason-other-option-section">
                                        <div className="reason-other-option-content">
                                            <div className="reason-other-radio">
                                                <div className="reason-other-radio-circle selected"></div>
                                            </div>
                                            <div className="reason-other-option-text">Other</div>
                                        </div>
                                        <div className="reason-other-question-text">What would have helped you the most?*</div>
                                        <div className="reason-other-textarea-container">
                                            <textarea
                                                className="reason-other-textarea"
                                                placeholder=""
                                                value={latestState.feedback || ''}
                                                onChange={(e) => setState([...state, {
                                                    ...latestState,
                                                    feedback: e.target.value,
                                                }])}
                                            />
                                            <div className="reason-other-character-counter">
                                                Min 25 characters ({latestState.feedback?.length || 0}/25)
                                            </div>
                                        </div>
                                    </div>

                                    <div className="reason-other-actions">
                                        {downsellVariant === "B" && <button
                                            className="reason-other-accept-btn"
                                            onClick={() => setState([...state, {
                                                screen: "offer-accepted",
                                            }])}
                                        >
                                            <div className="reason-other-accept-text">
                                                <span className="reason-other-accept-main">Get $10 off | ${monthlyPrice / 100}  </span>
                                                <span className="reason-other-accept-strikethrough">${(monthlyPrice / 100) - 10} </span>
                                            </div>
                                        </button>}
                                        <button
                                            className={`reason-other-complete-btn ${canContinue ? 'enabled' : 'disabled'}`}
                                            disabled={!canContinue}
                                            onClick={() => {
                                                if (canContinue) {
                                                    setState([...state, {
                                                        screen: "cancellation-complete-after-reason",
                                                    }]);
                                                }
                                            }}
                                        >
                                            <div className="reason-other-complete-text">Complete cancellation</div>
                                        </button>
                                    </div>
                                </div>
                            </div>

                            <div className="reason-other-right">
                                <Image
                                    src="/empire-state-compressed.jpg"
                                    alt="New York City skyline with Empire State Building at dusk"
                                    className="reason-other-image"
                                    width={400}
                                    height={437}
                                />
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        )
    } else if (latestState.screen === "cancellation-complete-after-reason") {
        return (
            <div className="cancellation-popup">
                <div className="popup-overlay">
                    <div className="cancellation-complete-after-reason-container">
                        <SurveyHeader
                            step={3}
                            totalSteps={3}
                            onClose={closeView}
                            onBack={goBack}
                        />
                        <div className="cancellation-complete-after-reason-content">
                            <div className="cancellation-complete-after-reason-left">
                                <div className="cancellation-complete-after-reason-main-container">
                                    <div className="cancellation-complete-after-reason-message">
                                        <div className="cancellation-complete-after-reason-title">
                                            <span className="cancellation-complete-after-reason-title-line1">Sorry to see you go, mate.<br /></span>
                                            <span className="cancellation-complete-after-reason-title-line2">Thanks for being with us, and you&apos;re always welcome back.</span>
                                        </div>
                                        <div className="cancellation-complete-after-reason-subtitle">
                                            <span className="cancellation-complete-after-reason-subtitle-bold">Your subscription is set to end on XX date. You&apos;ll still have full access until then. No further charges after that.<br /><br /></span>
                                            <span className="cancellation-complete-after-reason-subtitle-normal">Changed your mind? You can reactivate anytime before your end date.</span>
                                        </div>
                                    </div>

                                    <div className="cancellation-complete-after-reason-actions">
                                        <button
                                            className="cancellation-complete-after-reason-back-btn"
                                            onClick={closeView}
                                        >
                                            <div className="cancellation-complete-after-reason-back-text">Back to Jobs</div>
                                        </button>
                                    </div>
                                </div>
                            </div>

                            <div className="cancellation-complete-after-reason-right">
                                <Image
                                    src="/empire-state-compressed.jpg"
                                    alt="New York City skyline with Empire State Building at dusk"
                                    className="cancellation-complete-after-reason-image"
                                    width={400}
                                    height={437}
                                />
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        )
    }

    return null;
}