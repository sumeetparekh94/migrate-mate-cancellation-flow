import assert from "assert";
import { useCallback, useEffect, useState } from "react";
import FormWrapper from "./FormWrapper";
import "./index.css";

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
            <FormWrapper closeView={closeView} goBack={goBack} currProgress={1}>
                <div className="survey-form">
                    {/* Question 1 */}
                    <div className="question-group">
                        <h3>Did you find this job with MigrateMate?*</h3>
                        <div className="radio-group">
                            <label className={latestState.foundJobUsingMM === true ? 'selected' : ''}>
                                <input
                                    type="radio"
                                    name="foundJobUsingMM"
                                    checked={latestState.foundJobUsingMM === true}
                                    onChange={() => setState([...state, {
                                        ...latestState,
                                        foundJobUsingMM: true,
                                    }])}
                                />
                                Yes
                            </label>
                            <label className={latestState.foundJobUsingMM === false ? 'selected' : ''}>
                                <input
                                    type="radio"
                                    name="foundJobUsingMM"
                                    checked={latestState.foundJobUsingMM === false}
                                    onChange={() => setState([...state, {
                                        ...latestState,
                                        foundJobUsingMM: false,
                                    }])}
                                />
                                No
                            </label>
                        </div>
                    </div>

                    {/* Question 2 */}
                    <div className="question-group">
                        <h3>How many roles did you <u>apply</u> for through Migrate Mate?*</h3>
                        <div className="radio-group">
                            {['0', '1-5', '6-20', '20+'].map((option) => (
                                <label key={option} className={latestState.rangeOfRolesApplied === option ? 'selected' : ''}>
                                    <input
                                        type="radio"
                                        name="rangeOfRolesApplied"
                                        checked={latestState.rangeOfRolesApplied === option}
                                        onChange={() => setState([...state, {
                                            ...latestState,
                                            rangeOfRolesApplied: option,
                                        }])}
                                    />
                                    {option}
                                </label>
                            ))}
                        </div>
                    </div>

                    {/* Question 3 */}
                    <div className="question-group">
                        <h3>How many companies did you <u>email</u> directly?*</h3>
                        <div className="radio-group">
                            {['0', '1-5', '6-20', '20+'].map((option) => (
                                <label key={option} className={latestState.rangeOfEmails === option ? 'selected' : ''}>
                                    <input
                                        type="radio"
                                        name="rangeOfEmails"
                                        checked={latestState.rangeOfEmails === option}
                                        onChange={() => setState([...state, {
                                            ...latestState,
                                            rangeOfEmails: option,
                                        }])}
                                    />
                                    {option}
                                </label>
                            ))}
                        </div>
                    </div>

                    {/* Question 4 */}
                    <div className="question-group">
                        <h3>How many different companies did you <u>interview</u> with?*</h3>
                        <div className="radio-group">
                            {['0', '1-2', '3-5', '5+'].map((option) => (
                                <label key={option} className={latestState.rangeOfCompanies === option ? 'selected' : ''}>
                                    <input
                                        type="radio"
                                        name="rangeOfCompanies"
                                        checked={latestState.rangeOfCompanies === option}
                                        onChange={() => setState([...state, {
                                            ...latestState,
                                            rangeOfCompanies: option,
                                        }])}
                                    />
                                    {option}
                                </label>
                            ))}
                        </div>
                    </div>

                    {/* Continue Button */}
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
                        Continue
                    </button>
                </div>
            </FormWrapper>
        )
    }

    throw new Error("Invalid screen: " + latestState.screen);
}