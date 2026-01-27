import React from 'react'
import { Link } from 'react-router-dom'

export default function Header({ logo = 'Uber' }) {
  return (
    <header className="bg-black text-white border-b border-black/60">
      <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
        {/* Left: logo + primary nav (desktop) */}
        <div className="flex items-center gap-8">
          <Link to="/" className="text-white text-xl font-semibold tracking-tight" style={{fontFamily: 'UberMove, system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial'}}>
            {logo}
          </Link>

          <nav className="hidden md:flex items-center gap-6 text-sm text-white/90">
            <Link to="/ride" className="hover:text-white">Ride</Link>
            <Link to="/drive" className="hover:text-white">Drive</Link>
            <Link to="/business" className="hover:text-white">Business</Link>
            <div className="relative group">
              <button className="flex items-center gap-1 hover:text-white">About <span className="text-xs">▾</span></button>
            </div>
          </nav>
        </div>

        {/* Right: actions */}
        <div className="flex items-center gap-4">
          <div className="hidden md:flex items-center gap-4 text-sm text-white/90">
            <button className="flex items-center gap-2 hover:text-white">
              <span className="w-5 h-5 rounded-full border border-white/30 flex items-center justify-center text-xs">🌐</span>
              <span className="uppercase">EN</span>
            </button>
            <Link to="/help" className="hover:text-white">Help</Link>
            <Link to="/login" className="hover:text-white">Log in</Link>
          </div>

          <Link to="/signup" className="px-4 py-2 bg-white text-black rounded-full text-sm">Sign up</Link>

          <button className="md:hidden p-2 text-white/90">☰</button>
        </div>
      </div>
    </header>
  )
}
