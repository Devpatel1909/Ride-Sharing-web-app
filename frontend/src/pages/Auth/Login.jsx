import React, { useState } from 'react'
import { Link } from 'react-router-dom'

export default function Login() {
  const [identifier, setIdentifier] = useState('')
  const [password, setPassword] = useState('')

  function handleSubmit(e) {
    e.preventDefault()
    console.log('Login submit', { identifier, password })
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-gray-50 to-white">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-md p-8">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-12 h-12 bg-rose-500 rounded-2xl flex items-center justify-center text-white font-bold text-lg">RS</div>
          <div>
            <div className="text-2xl font-semibold">RideShare</div>
            <div className="text-sm text-gray-500">Get a ride — anytime, anywhere</div>
          </div>
        </div>

        <h2 className="text-xl font-medium mb-4">Sign in</h2>

        <form className="space-y-4" onSubmit={handleSubmit}>
          <div>
            <label className="block text-sm text-gray-600 mb-1">Email or phone</label>
            <input
              className="w-full rounded-lg border border-gray-200 p-3 focus:outline-none focus:ring-2 focus:ring-rose-300"
              value={identifier}
              onChange={(e) => setIdentifier(e.target.value)}
              placeholder="you@example.com or +1 555 555 5555"
              required
            />
          </div>

          <div>
            <label className="block text-sm text-gray-600 mb-1">Password</label>
            <input
              className="w-full rounded-lg border border-gray-200 p-3 focus:outline-none focus:ring-2 focus:ring-rose-300"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter your password"
              required
            />
          </div>

          <button className="w-full bg-rose-500 text-white rounded-lg py-3 font-medium hover:bg-rose-600 transition" type="submit">Sign in</button>
        </form>

        <div className="mt-5 text-center text-sm text-gray-600">
          <div>New to RideShare? <Link to="/signup" className="text-rose-500 font-medium">Create account</Link></div>
        </div>
      </div>
    </div>
  )
}
