import { ButtonProps } from "@/types/ButtonProps"


const Button = ({label, type, ...rest} : ButtonProps) => {
  return (
    <button type={type} className='bg-[#02111B] px-4 py-2 rounded-md text-white !mt-6 w-full cursor-pointer' {...rest}>{label}</button>
  )
}

export default Button