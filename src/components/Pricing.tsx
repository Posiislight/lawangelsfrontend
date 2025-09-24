import React, { useState } from 'react';
import { Check } from 'lucide-react';

const Pricing: React.FC = () => {
  const [isYearly, setIsYearly] = useState(false);

    return (
    <section id="pricing" className="bg-white py-16 lg:py-20 font-worksans">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          <h2 className="text-4xl md:text-5xl font-semibold">Choose Subscription</h2>
          <p className="mt-2 text-gray-600">Select your preferred subscription plan that works for you</p>

          <div className="inline-flex items-center mt-6 bg-gray-100 rounded-full p-1 border border-gray-200">
            <button
              onClick={() => setIsYearly(false)}
              className={`px-4 py-2 rounded-full text-sm font-medium ${!isYearly ? 'bg-black text-white' : 'text-gray-700'}`}>
              Monthly
            </button>
            <button
              onClick={() => setIsYearly(true)}
              className={`px-4 py-2 rounded-full text-sm font-medium ${isYearly ? 'bg-black text-white' : 'text-gray-700'}`}>
              Yearly <span className="text-xs text-gray-400 ml-2">-20% off</span>
            </button>
          </div>
        </div>

  <div className="mt-12 grid grid-cols-1 gap-8 md:grid-cols-3 items-start">

          {/* Free Plan - card written explicitly */}
      <div className="rounded-3xl p-6 relative flex flex-col bg-white ring-1 ring-gray-100 transition-transform duration-300 hover:shadow-2xl">
            <h3 className="text-lg font-semibold text-gray-900">Free Plan</h3>
            <div className="mt-4 flex items-baseline gap-x-2">
        <span className="text-2xl sm:text-3xl font-extrabold text-gray-900">$0</span>
              <span className="text-sm text-gray-500">per user/month billed monthly</span>
            </div>
            <div className="mt-5">
        <button className="w-full rounded-full px-4 py-3 text-sm font-semibold bg-orange-500 text-white hover:bg-orange-600">Choose Plan  →</button>
            </div>
            <ul role="list" className="mt-6 mb-6 space-y-3 text-gray-600 text-sm flex-1">
              <li className="flex items-center gap-x-3">
                <Check className="h-4 w-4 text-indigo-600 flex-none" />
                <span className="leading-snug">15 days free trials</span>
              </li>
              <li className="flex items-center gap-x-3">
                <Check className="h-4 w-4 text-indigo-600 flex-none" />
                <span className="leading-snug">Up to 2 team members</span>
              </li>
              <li className="flex items-center gap-x-3">
                <Check className="h-4 w-4 text-indigo-600 flex-none" />
                <span className="leading-snug">3 Communication Channels(Facebook, Instagram and LiveChat).</span>
              </li>
            </ul>
            
          </div>

          {/* Starter Plan - highlighted */}
          <div className="rounded-3xl p-6 relative flex flex-col bg-custom-gradient text-white shadow-2xl transition-transform duration-300 hover:shadow-[0_30px_60px_rgba(2,6,23,0.45)]" style={{ borderRadius: '28px' }}>
            <span className="hidden md:block absolute -top-3 right-6 bg-white text-black text-xs px-3 py-1 rounded-lg font-semibold">Most Popular</span>
            <h3 className="text-lg font-semibold text-white mt-8">Starter Plan</h3>
            <div className="mt-4 flex items-baseline gap-x-2">
              <span className="text-2xl sm:text-3xl font-extrabold text-white">{isYearly ? '$150' : '$15'}</span>
              <span className="text-sm text-white/80">per user/month billed monthly</span>
            </div>
            <div className="mt-5">
              <button className="w-full rounded-full px-4 py-3 text-sm font-semibold bg-blue-600 text-white hover:bg-blue-700">Choose Plan  →</button>
            </div>
            <ul role="list" className="mt-6 mb-6 space-y-3 text-white/90 text-sm flex-1">
              <li className="flex items-center gap-x-3">
                <Check className="h-4 w-4 text-white flex-none" />
                <span className="leading-snug">Analytics & Reports</span>
              </li>
              <li className="flex items-center gap-x-3">
                <Check className="h-4 w-4 text-white flex-none" />
                <span className="leading-snug">Call Center Billing price</span>
              </li>
              <li className="flex items-center gap-x-3">
                <Check className="h-4 w-4 text-white flex-none" />
                <span className="leading-snug">2500 Free outbound emails.</span>
              </li>
              <li className="flex items-center gap-x-3">
                <Check className="h-4 w-4 text-white flex-none" />
                <span className="leading-snug">A button to make payment</span>
              </li>
              <li className="flex items-center gap-x-3">
                <Check className="h-4 w-4 text-white flex-none" />
                <span className="leading-snug">5 communication Channels(Facebook, Instagram, LiveChat, CRM, and Email).</span>
              </li>
            </ul>
            
          </div>

          {/* Growth Plan - explicit */}
      <div className="rounded-3xl p-6 relative flex flex-col bg-white ring-1 ring-gray-100 transition-transform duration-300 hover:shadow-2xl">
            <h3 className="text-lg font-semibold text-gray-900">Growth Plan</h3>
            <div className="mt-4 flex items-baseline gap-x-2">
        <span className="text-2xl sm:text-3xl font-extrabold text-gray-900">{isYearly ? '$250' : '$25'}</span>
              <span className="text-sm text-gray-500">per user/month billed monthly</span>
            </div>
            <div className="mt-5">
              <button className="w-full rounded-full px-4 py-3 text-sm font-semibold bg-orange-500 text-white hover:bg-orange-600">Choose Plan  →</button>
            </div>
            <ul role="list" className="mt-6 mb-6 space-y-3 text-gray-600 text-sm flex-1">
              <li className="flex items-center gap-x-3">
                <Check className="h-4 w-4 text-indigo-600 flex-none" />
                <span className="leading-snug">Analytics & Reports.</span>
              </li>
              <li className="flex items-center gap-x-3">
                <Check className="h-4 w-4 text-indigo-600 flex-none" />
                <span className="leading-snug">5000 Free emails</span>
              </li>
              <li className="flex items-center gap-x-3">
                <Check className="h-4 w-4 text-indigo-600 flex-none" />
                <span className="leading-snug">Whatsapp Billing price</span>
              </li>
              <li className="flex items-center gap-x-3">
                <Check className="h-4 w-4 text-indigo-600 flex-none" />
                <span className="leading-snug">Inbound email</span>
              </li>
              <li className="flex items-center gap-x-3">
                <Check className="h-4 w-4 text-indigo-600 flex-none" />
                <span className="leading-snug">Call Center Billing price</span>
              </li>
              <li className="flex items-center gap-x-3">
                <Check className="h-4 w-4 text-indigo-600 flex-none" />
                <span className="leading-snug">Canned Responses</span>
              </li>
              <li className="flex items-center gap-x-3">
                <Check className="h-4 w-4 text-indigo-600 flex-none" />
                <span className="leading-snug">Paid Dedicated support</span>
              </li>
              <li className="flex items-center gap-x-3">
                <Check className="h-4 w-4 text-indigo-600 flex-none" />
                <span className="leading-snug">Email Signature</span>
              </li>
              <li className="flex items-center gap-x-3">
                <Check className="h-4 w-4 text-indigo-600 flex-none" />
                <span className="leading-snug">CSAT reviews</span>
              </li>
              <li className="flex items-center gap-x-3">
                <Check className="h-4 w-4 text-indigo-600 flex-none" />
                <span className="leading-snug">Internal comments</span>
              </li>
              <li className="flex items-center gap-x-3">
                <Check className="h-4 w-4 text-indigo-600 flex-none" />
                <span className="leading-snug">Inbox rules</span>
              </li>
              <li className="flex items-center gap-x-3">
                <Check className="h-4 w-4 text-indigo-600 flex-none" />
                <span className="leading-snug">Limited Contact uploads</span>
              </li>
              <li className="flex items-center gap-x-3">
                <Check className="h-4 w-4 text-indigo-600 flex-none" />
                <span className="leading-snug">Snooze messages</span>
              </li>
              <li className="flex items-center gap-x-3">
                <Check className="h-4 w-4 text-indigo-600 flex-none" />
                <span className="leading-snug">CRM</span>
              </li>
              <li className="flex items-center gap-x-3">
                <Check className="h-4 w-4 text-indigo-600 flex-none" />
                <span className="leading-snug">Ability to Move Tickets</span>
              </li>
              <li className="flex items-center gap-x-3">
                <Check className="h-4 w-4 text-indigo-600 flex-none" />
                <span className="leading-snug">A button to make payment</span>
              </li>
              <li className="flex items-center gap-x-3">
                <Check className="h-4 w-4 text-indigo-600 flex-none" />
                <span className="leading-snug">7 Communication Channels(Facebook, Instagram, LiveChat, Email and WhatsApp, CRM).</span>
              </li>
            </ul>
            
          </div>

          {/* Removed Enterprise plan to match reference layout */}

        </div>
      </div>
    </section>
  );
};

export default Pricing;
