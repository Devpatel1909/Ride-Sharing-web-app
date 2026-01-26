import React from 'react'
import Header from '../components/common/Header'

export default function Landing() {
  return (
    <div className="min-h-screen bg-white">
      <Header />

      <main className="max-w-7xl mx-auto px-6 py-20 grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
        <section>
          <h1 className="text-5xl font-extrabold leading-tight mb-6">Request a ride for now or later</h1>
          <p className="text-gray-600 mb-6">Fast, safe rides — wherever you are.</p>

          <div className="flex gap-4">
            <button className="px-6 py-3 bg-black text-white rounded-lg">Get a ride</button>
            <button className="px-6 py-3 border border-gray-200 rounded-lg">Drive with us</button>
          </div>
        </section>

        <section className="flex items-center justify-center">
          <div className="w-full max-w-lg rounded-2xl overflow-hidden shadow-lg">
            <img src="https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=1200&q=80" alt="ride" className="w-full h-80 object-cover" />
          </div>
        </section>
      </main>
    </div>
  )
}
