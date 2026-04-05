'use client'

import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { getGuestSession } from '@/lib/storage'
import LoginScreen from './LoginScreen'

export default function AuthGate({ children }: { children: React.ReactNode }) {
  const { status } = useSession()
  const [guestLoggedIn, setGuestLoggedIn] = useState(false)
  const [guestChecked, setGuestChecked] = useState(false)

  useEffect(() => {
    setGuestLoggedIn(!!getGuestSession())
    setGuestChecked(true)
  }, [])

  // Wait for both NextAuth status and localStorage check
  if (status === 'loading' || !guestChecked) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-white">
        <div className="w-10 h-10 rounded-full border-2 border-[#0F9E75] border-t-transparent animate-spin" />
      </div>
    )
  }

  if (status === 'authenticated' || guestLoggedIn) {
    return <>{children}</>
  }

  return <LoginScreen onLogin={() => setGuestLoggedIn(true)} />
}
