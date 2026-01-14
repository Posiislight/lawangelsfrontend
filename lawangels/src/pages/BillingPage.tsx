import { useState, useEffect, useCallback } from 'react'
import { useSearchParams, Link } from 'react-router-dom'
import {
    CreditCard,
    CheckCircle,
    AlertCircle,
    Clock,
    Crown,
    Loader2,
    ArrowLeft,
    ExternalLink,
    Shield
} from 'lucide-react'
import { billingApi, type SubscriptionStatus } from '../services/billingApi'

// Brand color
const PRIMARY_COLOR = '#0EA5E9'

export default function BillingPage() {
    const [searchParams] = useSearchParams()
    const [status, setStatus] = useState<SubscriptionStatus | null>(null)
    const [loading, setLoading] = useState(true)
    const [actionLoading, setActionLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)

    // Check for success/cancelled in URL params
    const success = searchParams.get('success') === 'true'
    const cancelled = searchParams.get('cancelled') === 'true'

    const loadStatus = useCallback(async () => {
        try {
            setLoading(true)
            const data = await billingApi.getStatus()
            setStatus(data)
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to load subscription status')
        } finally {
            setLoading(false)
        }
    }, [])

    useEffect(() => {
        loadStatus()
    }, [loadStatus])

    const handleSubscribe = async () => {
        try {
            setActionLoading(true)
            setError(null)
            await billingApi.redirectToCheckout()
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to start checkout')
            setActionLoading(false)
        }
    }

    const handleManage = async () => {
        try {
            setActionLoading(true)
            setError(null)
            await billingApi.redirectToPortal()
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to open billing portal')
            setActionLoading(false)
        }
    }

    const getStatusBadge = () => {
        if (!status) return null

        const badges: Record<string, { color: string; bg: string; icon: React.ReactNode; text: string }> = {
            active: {
                color: 'text-emerald-700',
                bg: 'bg-emerald-50 border-emerald-200',
                icon: <CheckCircle className="w-4 h-4" />,
                text: 'Active'
            },
            grandfathered: {
                color: 'text-amber-700',
                bg: 'bg-amber-50 border-amber-200',
                icon: <Crown className="w-4 h-4" />,
                text: 'Lifetime Access'
            },
            past_due: {
                color: 'text-orange-700',
                bg: 'bg-orange-50 border-orange-200',
                icon: <AlertCircle className="w-4 h-4" />,
                text: 'Payment Due'
            },
            cancelled: {
                color: 'text-gray-700',
                bg: 'bg-gray-50 border-gray-200',
                icon: <Clock className="w-4 h-4" />,
                text: 'Cancelled'
            },
            expired: {
                color: 'text-red-700',
                bg: 'bg-red-50 border-red-200',
                icon: <AlertCircle className="w-4 h-4" />,
                text: 'Expired'
            },
        }

        const badge = badges[status.status] || badges.expired

        return (
            <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium border ${badge.bg} ${badge.color}`}>
                {badge.icon}
                {badge.text}
            </span>
        )
    }

    if (loading) {
        return (
            <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white flex items-center justify-center">
                <Loader2 className="w-8 h-8 animate-spin" style={{ color: PRIMARY_COLOR }} />
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
            {/* Header */}
            <header className="bg-white border-b border-gray-100 sticky top-0 z-10">
                <div className="max-w-4xl mx-auto px-4 sm:px-6 py-4">
                    <div className="flex items-center justify-between">
                        <Link
                            to="/dashboard"
                            className="flex items-center gap-2 text-gray-500 hover:text-sky-500 transition-colors font-medium"
                        >
                            <ArrowLeft className="w-5 h-5" />
                            <span>Dashboard</span>
                        </Link>
                        <h1 className="text-xl font-bold text-gray-900">Billing & Subscription</h1>
                        <div className="w-24" /> {/* Spacer for centering */}
                    </div>
                </div>
            </header>

            <main className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
                {/* Success/Cancelled Messages */}
                {success && (
                    <div className="mb-6 p-4 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center gap-3">
                        <CheckCircle className="w-6 h-6 text-emerald-600 flex-shrink-0" />
                        <div>
                            <p className="font-semibold text-emerald-900">Payment Successful!</p>
                            <p className="text-sm text-emerald-700">Your subscription is now active. Thank you for subscribing!</p>
                        </div>
                    </div>
                )}

                {cancelled && (
                    <div className="mb-6 p-4 bg-amber-50 border border-amber-200 rounded-xl flex items-center gap-3">
                        <AlertCircle className="w-6 h-6 text-amber-600 flex-shrink-0" />
                        <div>
                            <p className="font-semibold text-amber-900">Checkout Cancelled</p>
                            <p className="text-sm text-amber-700">No payment was made. You can subscribe anytime.</p>
                        </div>
                    </div>
                )}

                {error && (
                    <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl flex items-center gap-3">
                        <AlertCircle className="w-6 h-6 text-red-600 flex-shrink-0" />
                        <p className="text-red-700">{error}</p>
                    </div>
                )}

                {/* Current Subscription Status */}
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-6">
                    <div className="flex items-start justify-between mb-4">
                        <div>
                            <h2 className="text-lg font-bold text-gray-900 mb-1">Subscription Status</h2>
                            <p className="text-sm text-gray-500">Your current plan and billing information</p>
                        </div>
                        {getStatusBadge()}
                    </div>

                    {status && (
                        <div className="space-y-4">
                            {status.is_grandfathered ? (
                                <div className="p-4 bg-amber-50 rounded-xl">
                                    <div className="flex items-center gap-3">
                                        <Crown className="w-8 h-8 text-amber-500" />
                                        <div>
                                            <p className="font-semibold text-amber-900">Lifetime Access</p>
                                            <p className="text-sm text-amber-700">You have grandfathered access as an early user. No payment required!</p>
                                        </div>
                                    </div>
                                </div>
                            ) : status.is_valid && status.current_period_end ? (
                                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                                    <div>
                                        <p className="text-sm text-gray-500">Access expires</p>
                                        <p className="font-semibold text-gray-900">
                                            {new Date(status.current_period_end).toLocaleDateString('en-GB', {
                                                day: 'numeric',
                                                month: 'long',
                                                year: 'numeric'
                                            })}
                                        </p>
                                    </div>
                                    <p className="text-sm text-gray-500">{status.days_until_expiry} days remaining</p>
                                </div>
                            ) : (
                                <div className="p-4 bg-red-50 rounded-xl">
                                    <p className="font-semibold text-red-900">No Active Subscription</p>
                                    <p className="text-sm text-red-700">Subscribe to access all features</p>
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* Subscription Plan */}
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden mb-6">
                    <div className="p-6 border-b border-gray-100">
                        <h2 className="text-lg font-bold text-gray-900">Annual Subscription</h2>
                    </div>

                    <div className="p-6">
                        <div className="flex items-baseline gap-2 mb-4">
                            <span className="text-4xl font-bold text-gray-900">£750</span>
                            <span className="text-gray-500">/ year</span>
                        </div>

                        <ul className="space-y-3 mb-6">
                            {[
                                'Full access to all courses and materials',
                                'Unlimited practice questions',
                                'Mock exams with detailed feedback',
                                'Video tutorials library',
                                'AI-powered study assistant',
                                'Progress tracking and analytics',
                            ].map((feature, idx) => (
                                <li key={idx} className="flex items-center gap-3">
                                    <CheckCircle className="w-5 h-5 text-emerald-500 flex-shrink-0" />
                                    <span className="text-gray-700">{feature}</span>
                                </li>
                            ))}
                        </ul>

                        {status && !status.is_grandfathered && (
                            <>
                                {status.is_valid && status.stripe_customer_id ? (
                                    <button
                                        onClick={handleManage}
                                        disabled={actionLoading}
                                        className="w-full py-3 px-4 rounded-xl border-2 border-gray-200 text-gray-700 font-semibold flex items-center justify-center gap-2 hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        {actionLoading ? (
                                            <Loader2 className="w-5 h-5 animate-spin" />
                                        ) : (
                                            <ExternalLink className="w-5 h-5" />
                                        )}
                                        Manage Subscription
                                    </button>
                                ) : (
                                    <button
                                        onClick={handleSubscribe}
                                        disabled={actionLoading}
                                        className="w-full py-3 px-4 rounded-xl text-white font-semibold flex items-center justify-center gap-2 hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
                                        style={{ backgroundColor: PRIMARY_COLOR }}
                                    >
                                        {actionLoading ? (
                                            <Loader2 className="w-5 h-5 animate-spin" />
                                        ) : (
                                            <CreditCard className="w-5 h-5" />
                                        )}
                                        Subscribe Now
                                    </button>
                                )}
                            </>
                        )}
                    </div>
                </div>

                {/* Security Note */}
                <div className="text-center text-sm text-gray-500 flex items-center justify-center gap-2">
                    <Shield className="w-4 h-4" />
                    <span>Secure payment powered by Stripe</span>
                </div>
            </main>
        </div>
    )
}
