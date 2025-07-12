import React from "react";

const Waterfall: React.FC = () => {
    return (
        <>
            <style>
                {`
                    @keyframes wooble {
                        0% { transform: translateY(0); }
                        100% { transform: translateY(3px); }
                    }
                    @keyframes grow {
                        0% { transform: translate(0px, 0px); }
                        100% { transform: translate(0px, -10px); }
                    }
                    @keyframes jump-right {
                        0% { transform: translate(0px, -10px); }
                        50% { transform: translate(-20px, 10px); }
                        100% { transform: translate(0px, -5px); }
                    }
                    @keyframes jump-left {
                        0% { transform: translate(0px, -10px); }
                        50% { transform: translate(20px, 10px); }
                        100% { transform: translate(0px, -5px); }
                    }
                    @keyframes jump {
                        0% { transform: translateY(-10px); }
                        100% { transform: translateY(50px); }
                    }
                    .animate-wooble { animation: wooble 0.8s ease-in-out alternate infinite; }
                    .animate-grow { animation: grow 0.6s ease-in-out alternate infinite; }
                    .animate-jump-right { animation: jump-right 1s ease-in-out alternate infinite; }
                    .animate-jump-left { animation: jump-left 1s ease-in-out alternate infinite; }
                    .animate-jump { animation: jump 1s ease-in-out alternate infinite; }
                    
                    .delay-1 { animation-delay: 100ms; }
                    .delay-2 { animation-delay: 200ms; }
                    .delay-3 { animation-delay: 300ms; }
                    .delay-4 { animation-delay: 400ms; }
                    .delay-5 { animation-delay: 500ms; }
                    .delay-6 { animation-delay: 600ms; }
                    .delay-7 { animation-delay: 700ms; }
                    .delay-8 { animation-delay: 800ms; }
                `}
            </style>
            <div className="fixed inset-0 -z-10 flex items-center justify-center overflow-hidden">
                <div className="relative w-full h-full flex items-center justify-center">
                    <svg
                        className="min-w-full min-h-full object-cover"
                        viewBox="0 0 349 387"
                        fill="none"
                        xmlns="http://www.w3.org/2000/svg"
                        preserveAspectRatio="xMidYMid slice"
                    >
                        <rect
                            x="120.095"
                            y="47.665"
                            width="141.611"
                            height="297.335"
                            fill="#59B7D4"
                        />
                        <rect
                            x="120.096"
                            y="24.2297"
                            width="141.611"
                            height="83.6565"
                            fill="#DAF1FB"
                        />
                        <g>
                            <rect
                                className="animate-wooble delay-1"
                                x="120.096"
                                y="66.5288"
                                width="35.4028"
                                height="93.9961"
                                rx="17.7014"
                                fill="#DAF1FB"
                            />
                            <rect
                                className="animate-wooble delay-2"
                                x="208.603"
                                y="48.6689"
                                width="17.7014"
                                height="93.9961"
                                rx="8.85069"
                                fill="#DAF1FB"
                            />
                            <rect
                                className="animate-wooble delay-3"
                                x="173.2"
                                y="38.3296"
                                width="17.7014"
                                height="93.9961"
                                rx="8.85069"
                                fill="#DAF1FB"
                            />
                            <rect
                                className="animate-wooble delay-4"
                                x="244.005"
                                y="30.8105"
                                width="17.7014"
                                height="93.9961"
                                rx="8.85069"
                                fill="#DAF1FB"
                            />
                            <rect
                                className="animate-wooble delay-5"
                                x="226.304"
                                y="95.6663"
                                width="17.7014"
                                height="93.9961"
                                rx="8.85069"
                                fill="#59B7D3"
                            />
                            <rect
                                className="animate-wooble delay-6"
                                x="190.902"
                                y="85.3267"
                                width="17.7014"
                                height="93.9961"
                                rx="8.85069"
                                fill="#59B7D3"
                            />
                            <rect
                                className="animate-wooble delay-7"
                                x="155.499"
                                y="95.6663"
                                width="17.7014"
                                height="93.9961"
                                rx="8.85069"
                                fill="#59B7D3"
                            />
                        </g>

                        <g>
                            <circle
                                className="animate-jump-left delay-1"
                                cx="138.5"
                                cy="326.5"
                                r="20.5"
                                fill="#DAF1FB"
                            />
                            <circle
                                className="animate-jump-left delay-2"
                                cx="174"
                                cy="328"
                                r="26"
                                fill="#DAF1FB"
                            />
                            <circle
                                className="animate-jump-left delay-3"
                                cx="210.5"
                                cy="334.5"
                                r="23.5"
                                fill="#DAF1FB"
                            />
                            <circle
                                className="animate-jump-left delay-4"
                                cx="246"
                                cy="326"
                                r="18"
                                fill="#DAF1FB"
                            />
                            <circle
                                className="animate-jump-right delay-5"
                                cx="133"
                                cy="324"
                                r="17"
                                fill="#DAF1FB"
                            />
                            <circle
                                className="animate-jump-right delay-6"
                                cx="174"
                                cy="325"
                                r="23"
                                fill="#DAF1FB"
                            />
                            <circle
                                className="animate-jump-right delay-7"
                                cx="211"
                                cy="329"
                                r="23"
                                fill="#DAF1FB"
                            />
                            <circle
                                className="animate-jump-right delay-8"
                                cx="246"
                                cy="333"
                                r="23"
                                fill="#DAF1FB"
                            />
                        </g>

                        <g>
                            <circle
                                className="animate-jump delay-1"
                                cx="147.045"
                                cy="282.045"
                                r="7.04465"
                                fill="#DAF1FB"
                            />
                            <circle
                                className="animate-jump delay-2"
                                cx="203.681"
                                cy="283.681"
                                r="5.68125"
                                fill="#DAF1FB"
                            />
                            <circle
                                className="animate-jump delay-3"
                                cx="254.021"
                                cy="282.044"
                                r="7.49911"
                                fill="#DAF1FB"
                            />
                            <circle
                                className="animate-jump delay-4"
                                cx="269.136"
                                cy="300.136"
                                r="6.13572"
                                fill="#DAF1FB"
                            />
                            <circle
                                className="animate-jump delay-5"
                                cx="119.136"
                                cy="293.587"
                                r="6.13572"
                                fill="#DAF1FB"
                            />
                            <circle
                                className="animate-jump delay-6"
                                cx="124.681"
                                cy="271.681"
                                r="5.68125"
                                fill="#DAF1FB"
                            />
                        </g>
                    </svg>
                </div>
            </div>
        </>
    );
};

export default Waterfall;
