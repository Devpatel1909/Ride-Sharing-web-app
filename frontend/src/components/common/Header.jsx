import React from 'react'
import { Link } from 'react-router-dom'

export default function Header({ logo = 'UberMov' }) {
  return (
    <header className="bg-black text-white">
      <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-6">
          <div
            style={{
              fontFamily: 'UberMove, UberMoveText, system-ui, "Helvetica Neue", Helvetica, Arial, sans-serif',
              fontStyle: 'normal',
              fontWeight: 400,
              color: 'rgb(255,255,255)',
              fontSize: '24px',
              lineHeight: '112px',
            }}
            className="font-bold"
          >
            {logo}
          </div>
          <nav className="hidden md:flex gap-6 text-sm text-white/80">
            <Link to="/" className="hover:text-white">Ride</Link>
            <Link to="/drive" className="hover:text-white">Drive</Link>
            <Link to="/business" className="hover:text-white">Business</Link>
            <Link to="/about" className="hover:text-white">About</Link>
          </nav>
        </div>

        <div className="flex items-center gap-4">
          <Link to="/login" className="text-sm text-white/90">Log in</Link>
          <Link to="/signup" className="px-4 py-2 bg-white text-black rounded-full text-sm">Sign up</Link>
        </div>
      </div>
    </header>
  )
}
