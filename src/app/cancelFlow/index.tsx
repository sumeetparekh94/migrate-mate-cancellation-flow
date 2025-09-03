import assert from "assert";
import { useCallback, useEffect, useState } from "react";
import FormWrapper from "./FormWrapper";

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
            assert(state.continueClicked !== undefined);
            return {
                screen: "2-yes-flow",
            };
        }
    } catch {
        return state;
    }
    throw new Error("Invalid screen: " + state.screen);
}


export default function CancelFlow({ closeView }: { closeView: () => void }) {
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
            <FormWrapper closeView={closeView} >
                <div>
                    <h2>Have you found a job yet?</h2>
                </div>
                <div>
                    <button onClick={() => setState([...state, {
                        ...latestState,
                        foundJob: true,
                    }])}>Yes</button>
                    <button onClick={() => setState([...state, {
                        ...latestState,
                        foundJob: false,
                    }])}>No</button>
                </div>
            </FormWrapper>
        )

    } else if (latestState.screen === "1-yes-flow") {
        return (
            <FormWrapper closeView={closeView} goBack={goBack} currProgress={1}>
                <div>
                    <h2>Have you found a job yet?</h2>
                </div>
            </FormWrapper>
        )
    }

    throw new Error("Invalid screen: " + latestState.screen);
}