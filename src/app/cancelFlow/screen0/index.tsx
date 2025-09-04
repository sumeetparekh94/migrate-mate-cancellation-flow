import Image from "next/image";

export default function Screen0({
    closeView,
    setState,
    state,
    latestState,
}: {
    closeView: () => void;
    setState: (state: any) => void;
    state: any;
    latestState: any;
}) {
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
                            <Image 
                                src="/empire-state-compressed.jpg" 
                                alt="New York City skyline with Empire State Building at dusk"
                                className="skyline-image"
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

