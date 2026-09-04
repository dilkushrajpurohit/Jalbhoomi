'use client'
import { usePathname } from 'next/navigation';
import Link from 'next/link'

export default function Sidebar(){
    const pathname=usePathname();
   
    return(
<>
     <aside className="w-64 min-h-screen bg-gray-100 p-5">
      
      {/* Logo / Brand */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold">
          🌱 JalBhoomi
        </h1>

        <p className="text-sm text-gray-500 mt-1">
          Smart Water Management
        </p>
      </div>

      {/* Navigation */}
      <nav className="space-y-2">

        <Link
          href="/"
          className="block rounded-lg px-4 py-3 hover:bg-gray-200"
        >
          🏠 Overview
        </Link>

        <Link
          href="/pre-drilling"
          
          className={
             pathname === "/pre-drilling" || pathname === "/PreDrilling" || pathname === "/predrilling"
      ? "block rounded-lg px-4 py-3 bg-green-600 text-white"
      : "block rounded-lg px-4 py-3 text-gray-700 hover:bg-gray-200"
          }
        >
          🔍 Pre-Drilling
        </Link>

        <Link
  href="/PostDrilling"
          
          className={
             pathname === "/PostDrilling"
      ? "block rounded-lg px-4 py-3 bg-green-600 text-white"
      : "block rounded-lg px-4 py-3 text-gray-700 hover:bg-gray-200"
          }
        >
          💧 Post-Drilling
        </Link>

        <Link
  href="/Irrigation"
          
          className={
             pathname === "/Irrigation"
      ? "block rounded-lg px-4 py-3 bg-green-600 text-white"
      : "block rounded-lg px-4 py-3 text-gray-700 hover:bg-gray-200"
          }
        >
          🌱 Irrigation
        </Link>

        <Link
  href="/Analytics"
          
          className={
             pathname === "/Analytics"
      ? "block rounded-lg px-4 py-3 bg-green-600 text-white"
      : "block rounded-lg px-4 py-3 text-gray-700 hover:bg-gray-200"
          }
        >
          📊 Analytics
        </Link>

        <Link
  href="/Ai-advisor"
          
          className={
             pathname === "/Ai-advisor"
      ? "block rounded-lg px-4 py-3 bg-green-600 text-white"
      : "block rounded-lg px-4 py-3 text-gray-700 hover:bg-gray-200"
          }
        >
          🤖 AI Advisor
        </Link>

        <Link
  href="/weather"
          
          className={
             pathname === "/weather"
      ? "block rounded-lg px-4 py-3 bg-green-600 text-white"
      : "block rounded-lg px-4 py-3 text-gray-700 hover:bg-gray-200"
          }
        >
          🌦️ Weather
        </Link>

        <Link
  href="/setting"
          
          className={
             pathname === "/setting"
      ? "block rounded-lg px-4 py-3 bg-green-600 text-white"
      : "block rounded-lg px-4 py-3 text-gray-700 hover:bg-gray-200"
          }
        >
          ⚙️ Settings
        </Link>

      </nav>
    </aside>
  

</>
    )
}