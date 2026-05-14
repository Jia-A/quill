'use client'
import { useCustomer } from '@/hooks/useCustomer'
import React from 'react'
import LoggedinUserHeader from './LoggedinUserHeader'
import HomepageHeader from './HomepageHeader'
import { useSession } from 'next-auth/react'

const Header = () => {
const {isLogin, isLoading}= useCustomer()
const {status} = useSession()
console.log(isLogin, isLoading)
  return (
    <div>
      {!isLoading && 
      (status==="authenticated" || isLogin ? <LoggedinUserHeader /> : <HomepageHeader />)}
      
    </div>
  )
}
export default Header