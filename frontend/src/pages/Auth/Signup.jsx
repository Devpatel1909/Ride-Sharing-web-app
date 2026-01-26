import React, { useState } from 'react'
import { Link } from 'react-router-dom'

export default function Signup() {
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [password, setPassword] = useState('')
  const [role, setRole] = useState('rider')

  function handleSubmit(e) {
    e.preventDefault()
    console.log('Signup', { fullName, email, phone, role, password })
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-gray-50 to-white">
      <div className="w-full max-w-lg bg-white rounded-2xl shadow-md p-8">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-12 h-12 bg-rose-500 rounded-2xl flex items-center justify-center text-white font-bold text-lg">RS</div>
          <div>
            <div className="text-2xl font-semibold">Create your account</div>
            <div className="text-sm text-gray-500">Quick signup to request or provide rides</div>
          </div>
        </div>

        <form className="grid grid-cols-1 gap-4" onSubmit={handleSubmit}>
          <div>
            <label className="block text-sm text-gray-600 mb-1">Full name</label>
            <input className="w-full rounded-lg border border-gray-200 p-3" value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="Your name" required />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-gray-600 mb-1">Email</label>
              <input className="w-full rounded-lg border border-gray-200 p-3" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" required />
            </div>
            <div>
              <label className="block text-sm text-gray-600 mb-1">Phone</label>
              <input className="w-full rounded-lg border border-gray-200 p-3" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+1 555 555 5555" />
            </div>
          </div>

          <div>
            <label className="block text-sm text-gray-600 mb-1">Password</label>
            <input className="w-full rounded-lg border border-gray-200 p-3" type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Create a password" required />
          </div>

          <div>
            <label className="block text-sm text-gray-600 mb-1">I am a</label>
            <div className="flex gap-4">
              <label className="inline-flex items-center space-x-2">
                <input type="radio" name="role" value="rider" checked={role === 'rider'} onChange={() => setRole('rider')} className="form-radio text-rose-500" />
                <span className="text-sm">Rider</span>
              </label>
              <label className="inline-flex items-center space-x-2">
                <input type="radio" name="role" value="driver" checked={role === 'driver'} onChange={() => setRole('driver')} className="form-radio text-rose-500" />
                <span className="text-sm">Driver</span>
              </label>
            </div>
          </div>

          <button className="w-full bg-rose-500 text-white rounded-lg py-3 font-medium hover:bg-rose-600 transition" type="submit">Create account</button>
        </form>

        <div className="mt-5 text-center text-sm text-gray-600">
          <div>Already have an account? <Link to="/login" className="text-rose-500 font-medium">Sign in</Link></div>
        </div>
      </div>
    </div>
  )
}
