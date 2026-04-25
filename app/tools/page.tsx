'use client'
import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function ToolsRedirect() {
  const router = useRouter()
  useEffect(() => { router.replace('/dashboard') }, [router])
  return (
    <div style={{minHeight:'100vh',display:'flex',alignItems:'center',justifyContent:'center',fontFamily:"'DM Sans', sans-serif",color:'#4a5568',fontSize:14}}>
      Redirecting to Dashboard...
    </div>
  )
}
