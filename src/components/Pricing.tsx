import React, { useState } from 'react';
import { Check } from 'lucide-react';

const Pricing: React.FC = () => {
  const [isYearly, setIsYearly] = useState(false);

  return (
    <section className="bg-white py-20 font-worksans">
      <div className="max-w-6xl mx-auto px-6">
        <div className="text-center">
          <h2 className="text-4xl font-semibold">Choose Subscription</h2>
          <p className="mt-2 text-sm text-gray-500">Select your preferred subscription plan that works for you</p>

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

        <div className="mt-10 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4 items-start">

          {/* Free Plan - card written explicitly */}
          <div className="rounded-3xl p-6 md:p-8 relative flex flex-col bg-white ring-1 ring-gray-100 transition-transform transition-shadow duration-300 ease-in-out hover:shadow-2xl hover:scale-105">
            <h3 className="text-lg font-semibold text-gray-900">Free Plan</h3>
            <div className="mt-4 flex items-baseline gap-x-2">
              <span className="text-3xl font-extrabold text-gray-900">$0</span>
              <span className="text-sm text-gray-500">per user/month billed monthly</span>
            </div>
            <div className="mt-auto lg:mt-5">
              <button className="w-36 rounded-full px-4 py-2 text-sm font-semibold bg-indigo-500 text-white">Choose Plan  →</button>
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
          <div className="rounded-3xl p-6 md:p-8 relative flex flex-col bg-custom-gradient text-white shadow-2xl transform scale-105 lg:scale-100 transition-transform transition-shadow duration-300 ease-in-out hover:shadow-[0_30px_60px_rgba(2,6,23,0.45)] hover:scale-105" style={{ borderRadius: '28px' }}>
            <span className="lg:w-5/12 text-black absolute -top-3 left-3/4 -translate-x-1/2 bg-white text-xs px-3 py-1 rounded-lg font-semibold my-7 ">Most Popular</span>
            <h3 className="text-lg font-semibold text-white mt-8">Starter Plan</h3>
            <div className="mt-4 flex items-baseline gap-x-2">
              <span className="text-3xl font-extrabold text-white">{isYearly ? '$150' : '$15'}</span>
              <span className="text-sm text-white/80">per user/month billed monthly</span>
            </div>
            <div className="mt-auto lg:mt-5">
              <button className="w-full rounded-full px-4 py-3 text-sm font-semibold bg-white text-indigo-600">Choose Plan  →</button>
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
          <div className="rounded-3xl p-6 md:p-8 relative flex flex-col bg-white ring-1 ring-gray-100 transition-transform transition-shadow duration-300 ease-in-out hover:shadow-2xl hover:scale-105">
            <h3 className="text-lg font-semibold text-gray-900">Growth Plan</h3>
            <div className="mt-4 flex items-baseline gap-x-2">
              <span className="text-3xl font-extrabold text-gray-900">{isYearly ? '$250' : '$25'}</span>
              <span className="text-sm text-gray-500">per user/month billed monthly</span>
            </div>
            <div className="mt-auto lg:mt-5">
              <button className="w-full rounded-full px-4 py-3 text-sm font-semibold border border-indigo-200 text-indigo-600 hover:bg-indigo-50">Choose Plan  →</button>
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

          {/* Enterprise Plan - outlined */}
          <div className="rounded-3xl p-6 md:p-8 relative flex flex-col bg-white ring-2 ring-indigo-100 border-8 transition-transform transition-shadow duration-300 ease-in-out hover:shadow-2xl hover:scale-105">
            <h3 className="text-lg font-semibold text-gray-900">Enterprise Plan</h3>
            <div className="mt-4 flex items-baseline gap-x-2">
              <span className="text-lg font-medium text-gray-900">Talk to our sales team</span>
            </div>
            <div className="mt-auto lg:mt-5">
              <button className="w-full rounded-full px-4 py-3 text-sm font-semibold border border-indigo-400 text-indigo-600 hover:bg-indigo-50">Talk to our sales team  →</button>
            </div>
            <ul role="list" className="mt-6 mb-6 space-y-3 text-gray-600 text-sm flex-1">
              <li className="flex items-center gap-x-3">
                <Check className="h-4 w-4 text-indigo-600 flex-none" />
                <span className="leading-snug">Up to 1000 team members</span>
              </li>
              <li className="flex items-center gap-x-3">
                <Check className="h-4 w-4 text-indigo-600 flex-none" />
                <span className="leading-snug">Analytics & Reports.</span>
              </li>
              <li className="flex items-center gap-x-3">
                <Check className="h-4 w-4 text-indigo-600 flex-none" />
                <span className="leading-snug">Unlimited Free emails</span>
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
                <span className="leading-snug">Canned Responses</span>
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

        </div>
      </div>
    </section>
  );
};

export default Pricing;
