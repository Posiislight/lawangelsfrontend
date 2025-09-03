import React, { useState } from "react";

type Plan = {
  id: string;
  title: string;
  monthly: number | string;
  yearly?: number | string;
  cta?: string;
  featured?: boolean;
  features: string[];
  highlight?: "primary" | "outline" | null;
};

const plans: Plan[] = [
  {
    id: "free",
    title: "Free Plan",
    monthly: 0,
    yearly: 0,
    cta: "Choose Plan",
    features: ["15 days free trials", "Up to 2 team members", "Community support"],
    highlight: "outline",
  },
  {
    id: "starter",
    title: "Starter Plan",
    monthly: 15,
    yearly: 12, // shown as yearly price (per month) when yearly selected
    cta: "Choose Plan",
    features: [
      "Analytics & Reports",
      "Call Center / Billing price",
      "2500 free outbound emails",
      "Ability to make payment",
      "3 communication channels",
    ],
    featured: true,
    highlight: "primary",
  },
  {
    id: "growth",
    title: "Growth Plan",
    monthly: 25,
    yearly: 20,
    cta: "Choose Plan",
    features: [
      "Analytics & Reports",
      "15000 free emails",
      "Whatsapp Billing price",
      "Inbound & outbound support",
      "CRM & Integrations",
    ],
    highlight: "primary",
  },
  {
    id: "enterprise",
    title: "Enterprise Plan",
    monthly: "Talk to sales",
    yearly: "Talk to sales",
    cta: "Talk to our sales team",
    features: [
      "Up to 100k team members",
      "Unlimited free emails",
      "Whatsapp billing price",
      "Dedicated support rep",
      "Custom integrations",
    ],
    highlight: "outline",
  },
];

const cn = (...classes: Array<string | false | null | undefined>) =>
  classes.filter(Boolean).join(" ");

const CheckIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg
    viewBox="0 0 20 20"
    fill="currentColor"
    aria-hidden="true"
    className={cn("h-5 w-5 flex-none", className)}
  >
    <path
      d="M16.704 4.153a.75.75 0 0 1 .143 1.052l-8 10.5a.75.75 0 0 1-1.127.075l-4.5-4.5a.75.75 0 0 1 1.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 0 1 1.05-.143Z"
      clipRule="evenodd"
      fillRule="evenodd"
    />
  </svg>
);

const PricingSection: React.FC = () => {
  const [billing, setBilling] = useState<"monthly" | "yearly">("monthly");

  return (
    <section className="relative isolate bg-white px-6 py-12 sm:py-20 lg:px-12">
      {/* subtle decorative background (keeps original vibe) */}
      <div
        aria-hidden="true"
        className="absolute inset-x-0 -top-6 -z-10 transform-gpu overflow-hidden px-24 blur-3xl"
      >
        <div
          style={{
            clipPath:
              "polygon(74.1% 44.1%, 100% 61.6%, 97.5% 26.9%, 85.5% 0.1%, 80.7% 2%, 72.5% 32.5%, 60.2% 62.4%, 52.4% 68.1%, 47.5% 58.3%, 45.2% 34.5%, 27.5% 76.7%, 0.1% 64.9%, 17.9% 100%, 27.6% 76.8%, 76.1% 97.7%, 74.1% 44.1%)",
          }}
          className="mx-auto aspect-[1155/678] w-[320px] bg-gradient-to-tr from-[#ff80b5] to-[#9089fc] opacity-30"
        />
      </div>

      {/* Header + Toggle */}
      <div className="mx-auto max-w-4xl text-center">
        <h2 className="text-2xl font-extrabold text-gray-900">Choose Subscription</h2>
        <p className="mt-1 text-sm text-gray-500">
          Select your preferred subscription plan that works for you
        </p>

        <div className="mt-6 flex items-center justify-center gap-3">
          <button
            onClick={() => setBilling("monthly")}
            className={cn(
              "rounded-full px-4 py-1.5 text-sm font-semibold",
              billing === "monthly"
                ? "bg-gray-900 text-white shadow"
                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
            )}
          >
            Monthly
          </button>
          <span className="text-sm text-gray-400">|</span>
          <button
            onClick={() => setBilling("yearly")}
            className={cn(
              "rounded-full px-4 py-1.5 text-sm font-semibold",
              billing === "yearly"
                ? "bg-gray-900 text-white shadow"
                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
            )}
          >
            Yearly — 20% off
          </button>
        </div>
      </div>

      {/* Cards row */}
      <div className="mt-10">
        {/* Horizontal scroll on small screens, grid on lg */}
        <div className="mx-auto max-w-[1200px]">
          <div className="flex gap-6 overflow-x-auto pb-6 px-4 lg:px-0 lg:grid lg:grid-cols-4 lg:gap-8">
            {plans.map((plan) => {
              const isPrimary = plan.highlight === "primary";
              const isOutline = plan.highlight === "outline";
              const price =
                billing === "monthly"
                  ? plan.monthly
                  : plan.yearly ?? plan.monthly;

              return (
                <div
                  key={plan.id}
                  className={cn(
                    "flex-shrink-0 w-[290px] sm:w-[320px] lg:w-auto",
                    // outer wrapper spacing
                    "rounded-3xl",
                    // primary gradient cards
                    isPrimary
                      ? "bg-gradient-to-br from-indigo-600 to-purple-600 text-white shadow-2xl transform lg:scale-[1.03]"
                      : // outline cards (pale rounded outline)
                        isOutline
                      ? "bg-white ring-2 ring-indigo-200"
                      : "bg-white ring-1 ring-gray-100"
                  )}
                >
                  <div
                    className={cn(
                      "p-6 sm:p-8 rounded-3xl",
                      isPrimary ? "rounded-3xl" : "rounded-3xl bg-transparent"
                    )}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className={cn("text-sm font-semibold", isPrimary ? "text-indigo-100" : "text-indigo-600")}>
                          {plan.title}
                        </h3>
                        {plan.featured && (
                          <div className="mt-2 inline-flex items-center rounded-full bg-white/10 px-3 py-1 text-xs font-medium text-white/90">
                            Most Popular
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="mt-6">
                      <div className="flex items-baseline gap-x-2">
                        <span className={cn("text-3xl font-extrabold", isPrimary ? "text-white" : "text-gray-900")}>
                          {typeof price === "number" ? `$${price}` : price}
                        </span>
                        <span className={cn("text-sm", isPrimary ? "text-indigo-100" : "text-gray-500")}>
                          {typeof price === "number" ? "/month" : null}
                        </span>
                      </div>
                      <p className={cn("mt-3 text-sm", isPrimary ? "text-indigo-100/90" : "text-gray-600")}>
                        {plan.title === "Free Plan"
                          ? "Perfect to get started"
                          : plan.title === "Enterprise Plan"
                          ? "Enterprise-level features & support"
                          : "Packed with helpful features to grow your business"}
                      </p>
                    </div>

                    <ul className={cn("mt-6 space-y-3 text-sm", isPrimary ? "text-indigo-100/90" : "text-gray-600")}>
                      {plan.features.map((f, idx) => (
                        <li key={idx} className="flex gap-x-3 items-start">
                          <span className={cn("mt-0.5", isPrimary ? "text-indigo-100" : "text-indigo-600")}>
                            <CheckIcon className={isPrimary ? "text-indigo-100" : "text-indigo-600"} />
                          </span>
                          <span className="leading-tight">{f}</span>
                        </li>
                      ))}
                    </ul>

                    <div className="mt-6">
                      <a
                        href="#"
                        aria-describedby={plan.id}
                        className={cn(
                          "block w-full text-center rounded-md px-4 py-2 text-sm font-semibold focus:outline-none",
                          isPrimary
                            ? "bg-white text-indigo-700 hover:opacity-95"
                            : "bg-indigo-50 text-indigo-600 hover:bg-indigo-100"
                        )}
                      >
                        {plan.cta}
                      </a>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
};

export default PricingSection;
