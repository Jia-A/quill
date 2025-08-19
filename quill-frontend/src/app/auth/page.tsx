import AuthForm from "@/components/AuthForm"
import Quote from "@/components/Quote"

const Auth = () => {
  return (
    <div className='grid lg:grid-cols-2 h-screen'>
      <AuthForm />
      <div className="hidden lg:block">
        <Quote />
      </div>
      
    </div>
  )
}

export default Auth