export default function FormWrapper({ children, closeView, goBack, currProgress }: { children: React.ReactNode, closeView: () => void, goBack?: () => void, currProgress?: number }) {
    // TODO: Make it proper based on actual design.. the header, back button, steps, image on the right
    return (
        <div className="px-6 py-8 border-b border-gray-200 bg-gradient-to-r from-purple-50 to-indigo-50">
            <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                    {goBack && (
                        <button
                            onClick={goBack}
                            className="p-2 text-gray-400 hover:text-gray-500 transition-colors"
                            aria-label="Go back"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                            </svg>
                        </button>
                    )}
                    <div className="flex flex-col">
                        <h1 className="text-2xl font-bold text-gray-900">Cancel subscription</h1>
                        {currProgress !== undefined && (
                            <div className="text-sm text-gray-500 mt-1">
                                Step {currProgress} of 3
                            </div>
                        )}
                    </div>
                </div>
                <button
                    onClick={closeView}
                    className="p-2 text-gray-400 hover:text-gray-500 transition-colors"
                    aria-label="Close"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                </button>
            </div>
            {children}
        </div>
    );
}