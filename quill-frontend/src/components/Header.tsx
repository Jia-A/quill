'use client'
import LoggedinUserHeader from './LoggedinUserHeader'
import HomepageHeader from './HomepageHeader'
import { useSession } from 'next-auth/react'

const Header = () => {
const {status, data : session} = useSession()
console.log("Session status:", status)
  return (
    <div>
      { status==="authenticated"  ? <LoggedinUserHeader session={session}/> : <HomepageHeader />}
      
    </div>
  )
}
export default Header