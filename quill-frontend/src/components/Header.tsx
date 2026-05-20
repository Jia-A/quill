'use client'
import LoggedinUserHeader from './LoggedinUserHeader'
import HomepageHeader from './HomepageHeader'
import { useSession } from 'next-auth/react'

const Header = () => {
const {status, data : session} = useSession()
  return (
    <div>
      { status==="authenticated"  ? <LoggedinUserHeader session={session}/> : <HomepageHeader />}
      
    </div>
  )
}
export default Header