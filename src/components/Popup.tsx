import { useState } from 'react';

type PopupProps = {
    open: boolean,
    onClose: () => void;
};

export default function Popup ({open , onClose}:PopupProps) {
    const [email, setEmail] = useState('');

    if (!open) return null;

    const handleSubscribe = () => {
        if (email) {
            console.log('Subscribing:', email);
            setEmail('');
            onClose();
        }
    };

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            {/* Popup Container */}
            <div className="relative w-full max-w-[1100px] h-[766px] bg-[#0C0F2D] rounded-lg mx-4">
                
                {/* Background Pattern */}
                <div className="absolute top-0 left-0 w-full h-[50px] bg-[#9CD1F7] border border-[#E1E6ED]">
                    {/* Background grid pattern */}
                    <div className="absolute top-0 left-0 w-full h-full opacity-30">
                        <div className="grid grid-cols-8 gap-2 p-2 h-full">
                            {Array.from({ length: 16 }).map((_, i) => (
                                <div key={i} className="bg-[#C5E2F7]" />
                            ))}
                        </div>
                    </div>
                </div>

            {/*
               <div className="absolute top-12 right-0 w-[174px] h-[134px] bg-white border-4 border-dashed border-[#E3E2E2] rounded-lg flex flex-col items-center justify-center">
                    <p className="text-[#0C0F2D] font-crimson font-semibold text-lg leading-[27px]">Expires</p>
                </div>
            */}

                {/* Red Badge for Date */}
                <div className="absolute top-12 right-0 w-[174px] h-[92px] bg-[#FE5252] flex flex-col items-center justify-center gap-2 border-4 border-dashed border-[#E3E2E2]">
                
                    <p className="font-dmSans font-medium text-base leading-[24px] text-white text-center">Limited Time Offer</p>
                </div>

                {/* Close Button */}
                <button
                    onClick={onClose}
                    className="absolute top-16 left-6 text-black hover:text-white transition-colors z-10"
                    aria-label="Close"
                >
                    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                </button>

                {/* Main Content Stack */}
                <div className="absolute left-1/2 top-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[444px] flex flex-col gap-14">
                    
                    {/* Content Section */}
                    <div className="flex flex-col gap-8">
                        
                        {/* Title and Subtitle */}
                        <div className="flex flex-col items-center gap-1">
                            {/* 50% Off Heading */}
                            <h2 className="w-full font-crimson font-bold text-[90px] leading-[135px] text-center text-[#E35C02] tracking-[-0.02em]">
                                50% Off
                            </h2>

                            {/* Subtitle */}
                            <p className="w-full font-dmSans font-normal text-2xl leading-[31px] text-center text-white">
                                Sign up today and enjoy 50% off 
                            </p>
                        </div>

                        {/* Form Stack */}
                        <div className="flex flex-col gap-2">
                            {/* Email Input */}
                            <div className="flex flex-col gap-1">
                                <input
                                    type="email"
                                    placeholder="Email Address"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    onKeyPress={(e) => e.key === 'Enter' && handleSubscribe()}
                                    className="w-[444px] h-14 px-3 py-4 bg-white border border-[#E3E3E3] rounded-sm text-gray-900 placeholder-[#B2B2B2] font-dmSans text-base focus:outline-none focus:border-[#0089FF] transition-colors"
                                />
                            </div>

                            {/* Terms Text */}
                            <p className="w-full font-dmSans font-normal text-sm leading-[20px] text-center text-white">
                                *By completing this form, you are signing up to receive our emails and can unsubscribe at any time
                            </p>
                        </div>
                    </div>

                    {/* Subscribe Button */}
                    <button
                        onClick={handleSubscribe}
                        className="w-[444px] h-[54px] bg-[#E35C02] hover:bg-[#D14C00] text-white font-dmSans font-bold text-xl leading-[30px] rounded-full transition-all duration-300 shadow-lg hover:shadow-orange-500/50 flex items-center justify-center"
                    >
                        Subscribe
                    </button>
                </div>
            </div>
        </div>
    );
}