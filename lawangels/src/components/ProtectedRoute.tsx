import { useState, useEffect } from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { billingApi, type SubscriptionStatus } from '../services/billingApi'
import { Loader } from 'lucide-react'

interface ProtectedRouteProps {
  children: React.ReactNode
}

export default function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { isAuthenticated, isLoading: authLoading } = useAuth()
  const location = useLocation()
  const [subscriptionStatus, setSubscriptionStatus] = useState<SubscriptionStatus | null>(null)
  const [subscriptionLoading, setSubscriptionLoading] = useState(true)

  // Check subscription status after authentication
  useEffect(() => {
    const checkSubscription = async () => {
      if (!isAuthenticated || authLoading) {
        setSubscriptionLoading(false)
        return
      }

      try {
        const status = await billingApi.getStatus()
        setSubscriptionStatus(status)
      } catch (error) {
        // If we can't check subscription, allow access (fail open)
        setSubscriptionStatus({ status: 'active', is_valid: true } as SubscriptionStatus)
      } finally {
        setSubscriptionLoading(false)
      }
    }

    checkSubscription()
  }, [isAuthenticated, authLoading])

  // Show loading while checking auth
  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#FFFFFF]">
        <div className="flex flex-col items-center gap-4">
          <Loader size={48} className="text-[#E17100] animate-spin" />
          <p className="text-[#314158] font-medium">Loading...</p>
        </div>
      </div>
    )
  }

  // Redirect to login if not authenticated
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
  }

  // Show loading while checking subscription
  if (subscriptionLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#FFFFFF]">
        <div className="flex flex-col items-center gap-4">
          <Loader size={48} className="text-[#0EA5E9] animate-spin" />
          <p className="text-[#314158] font-medium">Checking subscription...</p>
        </div>
      </div>
    )
  }

  // If subscription is not valid, redirect to billing
  // Exception: Allow access to billing page itself
  if (subscriptionStatus && !subscriptionStatus.is_valid && location.pathname !== '/billing') {
    return <Navigate to="/billing" replace />
  }

  return <>{children}</>
}
