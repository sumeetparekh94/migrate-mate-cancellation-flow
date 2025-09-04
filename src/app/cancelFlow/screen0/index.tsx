import Image from "next/image";

// Mobile header component for screen 0 (no progress steps)
function MobileHeader({ onClose }: { onClose: () => void }) {
    return (
        <div className="mobile-header-simple">
            <button className="mobile-close-btn" onClick={onClose}></button>
            <div className="mobile-header-content-simple">
                <div className="mobile-title">Subscription Cancellation</div>
            </div>
        </div>
    );
}

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
                    {/* Desktop Header */}
                    <div className="popup-header">
                        <div className="popup-title">
                            <div className="popup-title-text">Subscription Cancellation</div>
                        </div>
                        <button className="close-btn" onClick={closeView}></button>
                    </div>
                    
                    {/* Mobile Header */}
                    <MobileHeader onClose={closeView} />
                    
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

