'use client'
import { useCustomer } from '@/hooks/useCustomer'
import React from 'react'
import LoggedinUserHeader from './LoggedinUserHeader'
import HomepageHeader from './HomepageHeader'

const Header = () => {
const {isLogin, isLoading}= useCustomer()
console.log(isLogin, isLoading)
  return (
    <div>
      {!isLoading && 
      (isLogin ? <LoggedinUserHeader /> : <HomepageHeader />)}
      
    </div>
  )
}
export default Header