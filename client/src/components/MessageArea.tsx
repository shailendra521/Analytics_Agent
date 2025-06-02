import React from 'react';

interface SearchInfo {
  stages: string[];
  query: string;
  urls: string[] | string;
  error?: string;
}

interface Message {
  id: number;
  content: string;
  isUser: boolean;
  type: string;
  isLoading?: boolean;
  searchInfo?: SearchInfo;
  progress?: string;
  conversation?: string[];
}

const PremiumTypingAnimation = () => {
    return (
        <div className="flex items-center">
            <div className="flex items-center space-x-1.5">
                <div className="w-1.5 h-1.5 bg-gray-400/70 rounded-full animate-pulse"
                    style={{ animationDuration: "1s", animationDelay: "0ms" }}></div>
                <div className="w-1.5 h-1.5 bg-gray-400/70 rounded-full animate-pulse"
                    style={{ animationDuration: "1s", animationDelay: "300ms" }}></div>
                <div className="w-1.5 h-1.5 bg-gray-400/70 rounded-full animate-pulse"
                    style={{ animationDuration: "1s", animationDelay: "600ms" }}></div>
            </div>
        </div>
    );
};

const ConversationSteps = ({ conversation }: { conversation: string[] }) => {
    if (!conversation || conversation.length === 0) return null;

    const [visibleSteps, setVisibleSteps] = React.useState<number>(0);
    const conversationEndRef = React.useRef<HTMLDivElement>(null);

    // Take only messages from index 3 onwards
    const relevantConversation = conversation.slice(3).filter((_, index) => index % 2 === 0);
    if (relevantConversation.length === 0) return null;

    const scrollToBottom = () => {
        if (conversationEndRef.current) {
            conversationEndRef.current.scrollIntoView({ behavior: "smooth" });
        }
    };

    React.useEffect(() => {
        // Reset visible steps when conversation changes
        setVisibleSteps(0);
        
        // Show steps one by one with delay
        relevantConversation.forEach((_, index) => {
            setTimeout(() => {
                setVisibleSteps(prev => {
                    const newValue = prev + 1;
                    // Scroll after state update
                    setTimeout(scrollToBottom, 300);
                    return newValue;
                });
            }, 500 * (index + 1)); // 500ms delay between each step
        });
    }, [conversation]);

    const formatContent = (content: string) => {
        content = content.replace(/content=['"](.*?)['"]/, '$1');
        content = content.replace(/\\n/g, '\n')
            .replace(/\\'/g, "'")
            .replace(/\\"/g, '"')
            .trim();
        const lines = content.split('\n').filter(line => line.trim());
        return lines.map((line, i) => (
            <p key={i} className="mb-1 last:mb-0">{line.trim()}</p>
        ));
    };

    return (
        <div className="mb-3 mt-4 bg-gradient-to-r from-indigo-50 to-transparent p-4 rounded-lg border border-indigo-100">
            <div className="flex items-center mb-4 sticky top-0 bg-white z-10 pb-2">
                <div className="w-5 h-5 rounded-full bg-indigo-100 flex items-center justify-center mr-2">
                    <span className="animate-pulse">💭</span>
                </div>
                <span className="text-sm text-indigo-700 font-medium">Thought Process</span>
            </div>
            <div className="flex flex-col space-y-4">
                {relevantConversation.slice(0, visibleSteps).map((step, index) => {
                    const contentMatch = step.match(/content='([^']*)'/) || step.match(/content="([^"]*)"/) || ["", step];
                    const content = contentMatch[1];
                    
                    if (!content.trim()) return null;
                    const isFinalStep = index === relevantConversation.length - 1;
                    const isEvenStep = index % 2 === 0;

                    return (
                        <div 
                            key={index} 
                            className={`flex items-start space-x-3 text-sm animate-fadeIn relative
                                ${isFinalStep ? 'bg-gradient-to-r from-green-50 to-transparent p-3 rounded-lg border border-green-100' : ''}`}
                            style={{ 
                                animationDelay: '0ms',
                                opacity: 0
                            }}
                        >
                            <div className={`flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center
                                ${isFinalStep ? 'bg-green-100' : isEvenStep ? 'bg-indigo-100' : 'bg-purple-100'}`}>
                                {isFinalStep ? (
                                    <span className="text-green-600 text-xs">✓</span>
                                ) : (
                                    <span className={`text-xs ${isEvenStep ? 'text-indigo-600' : 'text-purple-600'} font-medium`}>
                                        {index + 1}
                                    </span>
                                )}
                            </div>
                            <div className={`flex-1 rounded-lg p-3 shadow-sm transition-all duration-300
                                ${isFinalStep 
                                    ? 'bg-white border border-green-100 shadow-green-50' 
                                    : isEvenStep
                                        ? 'bg-white border border-indigo-50 shadow-indigo-50'
                                        : 'bg-white border border-purple-50 shadow-purple-50'}`}>
                                <div className="flex items-center mb-2">
                                    <span className={`text-xs font-medium 
                                        ${isFinalStep 
                                            ? 'text-green-600' 
                                            : isEvenStep ? 'text-indigo-600' : 'text-purple-600'}`}>
                                        {isFinalStep ? 'Final Step' : `Step ${index + 1}`}
                                    </span>
                                </div>
                                <div className="text-gray-700 leading-relaxed">
                                    {formatContent(content)}
                                </div>
                            </div>
                            {!isFinalStep && (
                                <div className={`absolute left-3 -bottom-4 w-[1px] h-4 
                                    ${isEvenStep ? 'bg-indigo-200' : 'bg-purple-200'} z-0`}></div>
                            )}
                        </div>
                    );
                })}
                {visibleSteps < relevantConversation.length && (
                    <div className="flex items-center space-x-2 text-indigo-600 text-sm">
                        <div className="animate-spin h-4 w-4">⚙️</div>
                        <span>Thinking...</span>
                    </div>
                )}
                <div ref={conversationEndRef} />
            </div>
        </div>
    );
};

const SearchStages = ({ searchInfo }: { searchInfo: SearchInfo }) => {
    if (!searchInfo || !searchInfo.stages || searchInfo.stages.length === 0) return null;

    return (
        <div className="mb-3 mt-1 relative pl-4">
            {/* Search Process UI */}
            <div className="flex flex-col space-y-4 text-sm text-gray-700">
                {/* Searching Stage */}
                {searchInfo.stages.includes('searching') && (
                    <div className="relative">
                        {/* Green dot */}
                        <div className="absolute -left-3 top-1 w-2.5 h-2.5 bg-teal-400 rounded-full z-10 shadow-sm"></div>

                        {/* Connecting line to next item if reading exists */}
                        {searchInfo.stages.includes('reading') && (
                            <div className="absolute -left-[7px] top-3 w-0.5 h-[calc(100%+1rem)] bg-gradient-to-b from-teal-300 to-teal-200"></div>
                        )}

                        <div className="flex flex-col">
                            <span className="font-medium mb-2 ml-2">Searching the web</span>

                            {/* Search Query in box styling */}
                            <div className="flex flex-wrap gap-2 pl-2 mt-1">
                                <div className="bg-gray-100 text-xs px-3 py-1.5 rounded border border-gray-200 inline-flex items-center">
                                    <svg className="w-3 h-3 mr-1.5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
                                    </svg>
                                    {searchInfo.query}
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Reading Stage */}
                {searchInfo.stages.includes('reading') && (
                    <div className="relative">
                        {/* Green dot */}
                        <div className="absolute -left-3 top-1 w-2.5 h-2.5 bg-teal-400 rounded-full z-10 shadow-sm"></div>

                        <div className="flex flex-col">
                            <span className="font-medium mb-2 ml-2">Reading</span>

                            {/* Search Results */}
                            {searchInfo.urls && (Array.isArray(searchInfo.urls) ? searchInfo.urls.length > 0 : searchInfo.urls) && (
                                <div className="pl-2 space-y-1">
                                    <div className="flex flex-wrap gap-2">
                                        {Array.isArray(searchInfo.urls) ? (
                                            searchInfo.urls.map((url: string, index: number) => (
                                                <div key={index} className="bg-gray-100 text-xs px-3 py-1.5 rounded border border-gray-200 truncate max-w-[200px] transition-all duration-200 hover:bg-gray-50">
                                                    {url.substring(0, 30)}
                                                </div>
                                            ))
                                        ) : (
                                            <div className="bg-gray-100 text-xs px-3 py-1.5 rounded border border-gray-200 truncate max-w-[200px] transition-all duration-200 hover:bg-gray-50">
                                                {String(searchInfo.urls).substring(0, 30)}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* Writing Stage */}
                {searchInfo.stages.includes('writing') && (
                    <div className="relative">
                        {/* Green dot with subtle glow effect */}
                        <div className="absolute -left-3 top-1 w-2.5 h-2.5 bg-teal-400 rounded-full z-10 shadow-sm"></div>
                        <span className="font-medium pl-2">Writing answer</span>
                    </div>
                )}

                {/* Error Message */}
                {searchInfo.stages.includes('error') && (
                    <div className="relative">
                        {/* Red dot over the vertical line */}
                        <div className="absolute -left-3 top-1 w-2.5 h-2.5 bg-red-400 rounded-full z-10 shadow-sm"></div>
                        <span className="font-medium">Search error</span>
                        <div className="pl-4 text-xs text-red-500 mt-1">
                            {searchInfo.error || "An error occurred during search."}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

const MessageArea = ({ messages }: { messages: Message[] }) => {
    // Find the latest conversation from messages
    const latestConversation = messages
        .slice()
        .reverse()
        .find(msg => msg.conversation)?.conversation;

    return (
        <div className="flex-grow flex overflow-hidden bg-[#FCFCF8] border-b border-gray-100">
            <style jsx global>{`
                @keyframes fadeIn {
                    from { 
                        opacity: 0; 
                        transform: translateY(10px);
                    }
                    to { 
                        opacity: 1; 
                        transform: translateY(0);
                    }
                }
                .animate-fadeIn {
                    animation: fadeIn 0.6s ease-out forwards;
                }
            `}</style>
            
            {/* Main chat area */}
            <div className="flex-1 overflow-y-auto min-w-0">
                <div className="max-w-3xl mx-auto p-6">
                    {messages.map((message: Message) => (
                        <div key={message.id} className={`flex ${message.isUser ? 'justify-end' : 'justify-start'} mb-5`}>
                            <div className={`flex flex-col ${message.isUser ? 'max-w-[70%]' : 'max-w-[85%]'}`}>
                                <div
                                    className={`rounded-lg py-3 px-5 ${message.isUser
                                        ? 'bg-gradient-to-br from-[#5E507F] to-[#4A3F71] text-white rounded-br-none shadow-md'
                                        : 'bg-[#F3F3EE] text-gray-800 border border-gray-200 rounded-bl-none shadow-sm'
                                        }`}
                                >
                                    {message.isLoading ? (
                                        <div className="flex flex-col gap-2">
                                            <PremiumTypingAnimation />
                                            {message.progress && (
                                                <div className="text-xs text-gray-500 mt-2 mb-2">
                                                    {message.progress}
                                                </div>
                                            )}
                                        </div>
                                    ) : (
                                        <>
                                            {message.content && (
                                                <div className="mb-3 whitespace-pre-wrap">
                                                    {message.content}
                                                </div>
                                            )}
                                            {!message.content && (
                                                <span className="text-gray-400 text-xs italic">Waiting for response...</span>
                                            )}
                                        </>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Right sidebar for thought process */}
            {latestConversation && (
                <div className="w-[400px] border-l border-gray-200 overflow-y-auto bg-white p-4 hidden lg:block">
                    <ConversationSteps conversation={latestConversation} />
                </div>
            )}
        </div>
    );
};

export default MessageArea;