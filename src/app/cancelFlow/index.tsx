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
            <div className="survey-back-btn" onClick={onBack}>
                <div className="back-arrow"></div>
                <div className="back-text">Back</div>
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
    continueClicked: boolean,
} | {
    screen: "cancellation-reason",
    reason: string | undefined,
    continueClicked: boolean,
} | {
    screen: "reason-too-expensive",
    maxPrice: string | undefined,
    continueClicked: boolean,
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
                foundJobUsingMM: state.foundJobUsingMM,
            };
        } else if (state.screen === "feedback") {
            assert(state.feedback !== undefined);
            // Check if user found job with MigrateMate to determine next screen
            const surveyState = state as any;
            if (surveyState.foundJobUsingMM === true) {
                return {
                    screen: "yes-with-mm",
                    hasImmigrationLawyer: undefined,
                };
            } else {
                return state; // Stay on current screen for now
            }
        } else if (state.screen === "yes-with-mm") {
            assert(state.hasImmigrationLawyer !== undefined);
            return state; // Stay on current screen for now
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

    // Handle automatic transition only for the first screen (screen "0")
    useEffect(() => {
        const latestState = state[state.length - 1];
        if (latestState.screen === "0" && latestState.foundJob !== undefined) {
            const nextScreenState = getNextScreen(latestState);
            if (nextScreenState.screen !== latestState.screen) {
            setState([...state, nextScreenState]);
            }
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
    } else if (latestState.screen === "yes-with-mm") {
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

    } else if (latestState.screen === "yes-after-yes-with-mm") {
        const canComplete = latestState.visaType !== undefined && latestState.visaType.length > 0;

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
    } else if (latestState.screen === "no-after-yes-with-mm") {
        const canComplete = latestState.visaType !== undefined && latestState.visaType.length > 0;

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
    } else if (latestState.screen === "no-without-mm") {
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
                                    <div className="visa-title">
                                        <span>You landed the job! <br/></span>
                                        <span style={{fontStyle: 'italic'}}>That's what we live for.</span>
                                    </div>
                                </div>
                                
                                <div className="visa-subtitle">
                                    <div className="visa-subtitle-text">Even if it wasn't through Migrate Mate, <br/>let us help get your visa sorted.</div>
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
    } else if (latestState.screen === "yes-after-no-without-mm") {
        const canComplete = latestState.visaType !== undefined && latestState.visaType.length > 0;

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
                                    <div className="visa-title">
                                        <span>You landed the job! <br/></span>
                                        <span style={{fontStyle: 'italic'}}>That's what we live for.</span>
                                    </div>
                                </div>
                                
                                <div className="visa-subtitle">
                                    <div className="visa-subtitle-text">Even if it wasn't through Migrate Mate, <br/>let us help get your visa sorted.</div>
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
    } else if (latestState.screen === "no-after-no-without-mm") {
        const canComplete = latestState.visaType !== undefined && latestState.visaType.length > 0;

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
                                    <div className="visa-title">
                                        <span>You landed the job! <br/></span>
                                        <span style={{fontStyle: 'italic'}}>That's what we live for.</span>
                                    </div>
                                </div>
                                
                                <div className="visa-subtitle">
                                    <div className="visa-subtitle-text">Even if it wasn't through Migrate Mate, <br/>let us help get your visa sorted.</div>
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
    } else if (latestState.screen === "no-help-with-visa") {
        return (
            <div className="cancellation-popup">
                <div className="popup-overlay">
                    <div className="visa-container">
                        <div className="visa-content">
                            <div className="visa-left">
                                <div className="visa-message">
                                    <div className="visa-title">All done, your cancellation's <br/>been processed.</div>
                                </div>
                                
                                <div className="visa-subtitle">
                                    <div className="visa-subtitle-text">We're stoked to hear you've landed a job and sorted your visa. Big congrats from the team. 🙌</div>
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
    } else if (latestState.screen === "help-with-visa") {
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
                                    <div className="visa-title">Your cancellation's all sorted, mate, no more charges.</div>
                                </div>
                                
                                <div className="visa-contact-card">
                                    <div className="visa-contact-header">
                                        <img 
                                            src="/mihailo-profile.jpeg" 
                                            alt="Mihailo Bozic profile"
                                            className="visa-contact-avatar"
                                        />
                                        <div className="visa-contact-info">
                                            <div className="visa-contact-name">Mihailo Bozic</div>
                                            <div className="visa-contact-email">&lt;mihailo@migratemate.co&gt;</div>
                                        </div>
                                    </div>
                                    <div className="visa-contact-message">
                                        <div className="visa-message-content">
                                            <span className="visa-message-bold">I'll be reaching out soon to help with the visa side of things.<br/></span>
                                            <span className="visa-message-normal"><br/>We've got your back, whether it's questions, paperwork, or just figuring out your options.<br/><br/></span>
                                            <span className="visa-message-medium">Keep an eye on your inbox, I'll be in touch </span>
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
    } else if (latestState.screen === "1-no-flow") {
        return (
            <div className="cancellation-popup">
                <div className="popup-overlay">
                    <div className="discount-container">
                        <SurveyHeader 
                            step={1} 
                            totalSteps={3} 
                            onClose={closeView} 
                            onBack={goBack} 
                        />
                        <div className="discount-content">
                            <div className="discount-left">
                                <div className="discount-message">
                                    <div className="discount-title">We built this to help you land the job, this makes it a little easier.</div>
                                </div>
                                
                                <div className="discount-subtitle">
                                    We've been there and we're here to help you.
                                </div>
                                
                                <div className="discount-offer-card">
                                    <div className="discount-offer-content">
                                        <div className="discount-offer-title">
                                            <span className="discount-title-text">Here's&nbsp;</span>
                                            <span className="discount-title-underline">50% off</span>
                                            <span className="discount-title-text">&nbsp;until you find a job.</span>
                                        </div>
                                        <div className="discount-pricing">
                                            <div className="discount-price">
                                                <span className="discount-price-amount">$12.50</span>
                                                <span className="discount-price-period">/month</span>
                                            </div>
                                            <div className="discount-original-price">$25 /month</div>
                                        </div>
                                    </div>
                                    <div className="discount-actions">
                                        <button 
                                            className="discount-accept-btn"
                                            onClick={() => setState([...state, {
                                                screen: "offer-accepted",
                                            }])}
                                        >
                                            <div className="discount-accept-text">Get 50% off</div>
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
                                            continueClicked: false,
                                        }])}
                                    >
                                        <div className="discount-decline-text">No thanks</div>
                                    </button>
                                </div>
                            </div>
                            
                            <div className="discount-right">
                                <img 
                                    src="/empire-state-compressed.jpg" 
                                    alt="New York City skyline with Empire State Building at dusk"
                                    className="discount-image"
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
                                        <span className="offer-title-line1">Great choice, mate!<br/></span>
                                        <span className="offer-title-line2">You're still on the path to your dream role. </span>
                                        <span className="offer-title-highlight">Let's make it happen together!</span>
                                    </div>
                                </div>
                                
                                <div className="offer-accepted-details">
                                    <span className="offer-details-main">You've got XX days left on your current plan.    Starting from XX date, your monthly payment will be $12.50.<br/><br/></span>
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
                                <img 
                                    src="/empire-state-compressed.jpg" 
                                    alt="New York City skyline with Empire State Building at dusk"
                                    className="offer-accepted-image"
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
                                    <div className="offer-declined-title">Help us understand how you <br/>were using Migrate Mate.</div>
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
                                    <button 
                                        className="offer-accept-btn"
                                        onClick={() => setState([...state, {
                                            screen: "offer-accepted",
                                        }])}
                                    >
                                        <div className="offer-accept-text">
                                            <span className="offer-accept-main">Get 50% off | $12.50 </span>
                                            <span className="offer-accept-strikethrough">$25</span>
                                        </div>
                                    </button>
                                    <button 
                                        className={`offer-continue-btn ${canContinue ? 'enabled' : 'disabled'}`}
                                        disabled={!canContinue}
                                        onClick={() => {
                                            if (canContinue) {
                                                setState([...state, {
                                                    screen: "cancellation-reason",
                                                    reason: undefined,
                                                    continueClicked: false,
                                                }]);
                                            }
                                        }}
                                    >
                                        <div className="offer-continue-text">Continue</div>
                                    </button>
                                </div>
                            </div>
                            
                            <div className="offer-declined-right">
                                <img 
                                    src="/empire-state-compressed.jpg" 
                                    alt="New York City skyline with Empire State Building at dusk"
                                    className="offer-declined-image"
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
                                    <div className="cancellation-reason-title">What's the main <br/>reason for cancelling?</div>
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
                                                        continueClicked: false,
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
                                            <span className="cancellation-accept-main">Get 50% off | $12.50 </span>
                                            <span className="cancellation-accept-strikethrough">$25</span>
                                        </div>
                                    </button>
                                    <button 
                                        className={`cancellation-complete-btn ${canContinue ? 'enabled' : 'disabled'}`}
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
                                        <div className="cancellation-complete-text">Complete cancellation</div>
                                    </button>
                                </div>
                            </div>
                            
                            <div className="cancellation-reason-right">
                                <img 
                                    src="/empire-state-compressed.jpg" 
                                    alt="New York City skyline with Empire State Building at dusk"
                                    className="cancellation-reason-image"
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
                                        <div className="reason-too-expensive-title">What's the main <br/>reason for cancelling?</div>
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
                                                onChange={(e) => setState([...state, {
                                                    ...latestState,
                                                    maxPrice: e.target.value,
                                                }])}
                                            />
                                        </div>
                                    </div>
                                    
                                    <div className="reason-too-expensive-actions">
                                        <button 
                                            className="reason-too-expensive-accept-btn"
                                            onClick={() => setState([...state, {
                                                screen: "offer-accepted",
                                            }])}
                                        >
                                            <div className="reason-too-expensive-accept-text">
                                                <span className="reason-too-expensive-accept-main">Get 50% off | $12.50 </span>
                                                <span className="reason-too-expensive-accept-strikethrough">$25</span>
                                            </div>
                                        </button>
                                        <button 
                                            className={`reason-too-expensive-complete-btn ${canContinue ? 'enabled' : 'disabled'}`}
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
                                            <div className="reason-too-expensive-complete-text">Complete cancellation</div>
                                        </button>
                                    </div>
                                </div>
                            </div>
                            
                            <div className="reason-too-expensive-right">
                                <img 
                                    src="/empire-state-compressed.jpg" 
                                    alt="New York City skyline with Empire State Building at dusk"
                                    className="reason-too-expensive-image"
                                />
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        )
    }

    throw new Error("Invalid screen: " + (latestState as any).screen);
}