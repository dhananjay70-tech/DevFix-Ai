import React, { createContext, useContext, useState, useEffect } from 'react'
import * as api from '../services/api'

const AuthContext = createContext()

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  const checkAuthStatus = async () => {
    try {
      const data = await api.getMe()
      setUser(data.data)
    } catch {
      setUser(null)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    checkAuthStatus()
  }, [])

  const sendOtp = async (email) => {
    return api.sendOtp(email)
  }

  const verifyOtp = async (email, otp) => {
    const data = await api.verifyOtp(email, otp)
    if (data.data?.user) {
      setUser(data.data.user)
    }
    return data
  }

  const loginWithGoogle = () => {
    window.location.href = `${api.API_ROOT}/api/auth/google`
  }

  const logout = async () => {
    try {
      await api.logout()
    } catch (e) {
      console.error(e)
    }
    setUser(null)
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        setUser,
        loading,
        sendOtp,
        verifyOtp,
        loginWithGoogle,
        logout,
        checkAuthStatus
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  return useContext(AuthContext)
}
