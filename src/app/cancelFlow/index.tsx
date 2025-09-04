import assert from "assert";
import { useCallback, useEffect, useState } from "react";
import FormWrapper from "./FormWrapper";
import "./index.css";

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
    onBack: () => void; 
}) {
    return (
        <div className="survey-header">
            <button className="survey-close-btn" onClick={onClose}></button>
            <div className="survey-header-content">
                <div className="survey-title">Subscription Cancellation</div>
                <div className="survey-progress">
                    <div className="progress-dots">
                        {Array.from({ length: totalSteps }, (_, i) => {
                            let className = 'progress-dot';
                            if (i < step - 1) {
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
                    <div className="step-counter">Step {step} of {totalSteps}</div>
                </div>
            </div>
            <div className="survey-back-btn" onClick={onBack}>
                <div className="back-arrow"></div>
                <div className="back-text">Back</div>
            </div>
        </div>
    );
}

type CancelFlowState = {
    screen: "0",
    foundJob: boolean | undefined,
} | {
    screen: "1-yes-flow",
    foundJobUsingMM: boolean | undefined,
    rangeOfRolesApplied: string | undefined,
    rangeOfEmails: string | undefined,
    rangeOfCompanies: string | undefined,
    continueClicked: boolean,
} | {
    screen: "feedback",
    feedback: string | undefined,
} | {
    screen: "visa-support",
    hasImmigrationLawyer: boolean | undefined,
} | {
    screen: "2-yes-flow" | "1-no-flow"
};

function getNextScreen(state: CancelFlowState): CancelFlowState {
    try {
        if (state.screen === "0") {
            assert(state.foundJob !== undefined);
            if (state.foundJob) {
                return {
                    screen: "1-yes-flow",
                    foundJobUsingMM: undefined,
                    rangeOfRolesApplied: undefined,
                    rangeOfEmails: undefined,
                    rangeOfCompanies: undefined,
                    continueClicked: false,
                };
            } else {
                return {
                    screen: "1-no-flow",
                };
            }
        } else if (state.screen === "1-yes-flow") {
            assert(state.foundJobUsingMM !== undefined);
            assert(state.rangeOfRolesApplied !== undefined);
            assert(state.rangeOfEmails !== undefined);
            assert(state.rangeOfCompanies !== undefined);
            assert(state.continueClicked);
            return {
                screen: "feedback",
                feedback: undefined,
            };
        } else if (state.screen === "feedback") {
            assert(state.feedback !== undefined);
            // Check if user found job with MigrateMate to determine next screen
            const surveyState = state as any;
            if (surveyState.foundJobUsingMM === true) {
                return {
                    screen: "visa-support",
                    hasImmigrationLawyer: undefined,
                };
            } else {
                return {
                    screen: "2-yes-flow",
                };
            }
        } else if (state.screen === "visa-support") {
            assert(state.hasImmigrationLawyer !== undefined);
            return {
                screen: "2-yes-flow",
            };
        }
    } catch {
        return state;
    }
    throw new Error("Invalid screen: " + state.screen);
}


export default function CancelFlow({ userId, closeView }: { userId: string, closeView: () => void }) {
    const [state, setState] = useState<CancelFlowState[]>([{
        screen: "0",
        foundJob: undefined,
    }]);

    useEffect(() => {
        const currScreen = state[state.length - 1].screen;
        const nextScreenState = getNextScreen(state[state.length - 1]);
        if (nextScreenState.screen !== currScreen) {
            setState([...state, nextScreenState]);
        }
    }, [state]);

    useEffect(() => {
        // TODO: If there is an error in this API call, how do we handle this in the UI?
        async function saveState() {
            await fetch("/api/updateCancellationFlowState", {
                method: "PUT",
                body: JSON.stringify({ userId, state }),
            });
        }
        saveState().catch(console.error);
    }, [state, userId]);

    const goBack = useCallback(() => {
        const newState = [...state];
        const currScreen = newState[newState.length - 1].screen;
        while (newState.length > 0 && newState[newState.length - 1].screen === currScreen) {
            newState.pop();
        }
        if (newState[newState.length - 1].screen !== currScreen) {
            newState.pop();
            setState(newState);
        }
    }, [state]);

    const latestState = state[state.length - 1];

    if (latestState.screen === "0") {
        return (
            <div className="cancellation-popup">
                <div className="popup-overlay">
                    <div className="popup-container">
                        <div className="popup-header">
                            <h2 className="popup-title">Subscription Cancellation</h2>
                            <button className="close-btn" onClick={closeView}></button>
                        </div>
                        
                        <div className="popup-content">
                            <div className="popup-left">
                                <div className="popup-message">
                                    <div className="greeting">Hey mate,<br/>Quick one before you go.</div>
                                    <div className="main-question">Have you found a job yet?</div>
                                </div>
                                
                                <div className="supporting-text">
                                    Whatever your answer, we just want to help you take the next step. 
                                    With visa support, or by hearing how we can do better.
                                </div>
                                
                                <div className="popup-buttons">
                                    <button 
                                        className="response-btn"
                                        onClick={() => setState([...state, {
                                            ...latestState,
                                            foundJob: true,
                                        }])}
                                    >
                                        Yes, I've found a job
                                    </button>
                                    <button 
                                        className="response-btn"
                                        onClick={() => setState([...state, {
                                            ...latestState,
                                            foundJob: false,
                                        }])}
                                    >
                                        Not yet - I'm still looking
                                    </button>
                                </div>
                            </div>
                            
                            <div className="popup-right">
                                <img 
                                    src="/empire-state-compressed.jpg" 
                                    alt="New York City skyline with Empire State Building at dusk"
                                    className="skyline-image"
                                />
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        )

    } else if (latestState.screen === "1-yes-flow") {
        const canContinue = latestState.foundJobUsingMM !== undefined &&
            latestState.rangeOfRolesApplied !== undefined &&
            latestState.rangeOfEmails !== undefined &&
            latestState.rangeOfCompanies !== undefined;

        return (
            <div className="cancellation-popup">
                <div className="popup-overlay">
                    <div className="survey-container">
                        <SurveyHeader 
                            step={1} 
                            totalSteps={3} 
                            onClose={closeView} 
                            onBack={goBack} 
                        />
                        <div className="survey-content">
                            <div className="survey-left">
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
                                                onClick={() => setState([...state, {
                                                    ...latestState,
                                                    foundJobUsingMM: true,
                                                }])}
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
                                                setState([...state, {
                                                    ...latestState,
                                                    continueClicked: true,
                                                }]);
                                            }
                                        }}
                                    >
                                        <div className="continue-text">Continue</div>
                                    </button>
                                </div>
                            </div>
                            
                            <div className="survey-right">
                                <img 
                                    src="/empire-state-compressed.jpg" 
                                    alt="New York City skyline with Empire State Building at dusk"
                                    className="survey-image"
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
                        <SurveyHeader 
                            step={2} 
                            totalSteps={3} 
                            onClose={closeView} 
                            onBack={goBack} 
                        />
                        <div className="feedback-content">
                            <div className="feedback-left">
                                <div className="feedback-message">
                                    <div className="feedback-title">What's one thing you wish we could've helped you with?</div>
                                </div>
                                
                                <div className="feedback-description">
                                    We're always looking to improve, your thoughts can help us make Migrate Mate more useful for others.*
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
                                                setState([...state, {
                                                    ...latestState,
                                                    feedback: latestState.feedback,
                                                }]);
                                            }
                                        }}
                                    >
                                        <div className="feedback-continue-text">Continue</div>
                                    </button>
                                </div>
                            </div>
                            
                            <div className="feedback-right">
                                <img 
                                    src="/empire-state-compressed.jpg" 
                                    alt="New York City skyline with Empire State Building at dusk"
                                    className="feedback-image"
                                />
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        )
    } else if (latestState.screen === "visa-support") {
        const canComplete = latestState.hasImmigrationLawyer !== undefined;

        return (
            <div className="cancellation-popup">
                <div className="popup-overlay">
                    <div className="visa-container">
                        <SurveyHeader 
                            step={3} 
                            totalSteps={3} 
                            onClose={closeView} 
                            onBack={goBack} 
                        />
                        <div className="visa-content">
                            <div className="visa-left">
                                <div className="visa-message">
                                    <div className="visa-title">We helped you land the job, now let's help you secure your visa.</div>
                                </div>
                                
                                <div className="visa-question">
                                    <div className="visa-question-text">Is your company providing an immigration lawyer to help with your visa?</div>
                                </div>
                                
                                <div className="visa-options">
                                    <div className="visa-option" onClick={() => setState([...state, {
                                        ...latestState,
                                        hasImmigrationLawyer: true,
                                    }])}>
                                        <div className="visa-radio">
                                            <div className={`visa-radio-circle ${latestState.hasImmigrationLawyer === true ? 'selected' : ''}`}></div>
                                        </div>
                                        <div className="visa-option-text">Yes</div>
                                    </div>
                                    <div className="visa-option" onClick={() => setState([...state, {
                                        ...latestState,
                                        hasImmigrationLawyer: false,
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
                                <img 
                                    src="/empire-state-compressed.jpg" 
                                    alt="New York City skyline with Empire State Building at dusk"
                                    className="visa-image"
                                />
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        )
    }

    throw new Error("Invalid screen: " + latestState.screen);
}