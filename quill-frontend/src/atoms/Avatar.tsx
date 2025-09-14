import Image from "next/image";
import { AvatarProps } from '@/types/AvatarProps'
import React from 'react'

const Avatar = ({size= "md", avImage, alt, name, onClick} : AvatarProps) => {
    let sizeClasses = ""
    switch(size){
        case "sm": {
            sizeClasses = "w-9 h-9 font-bold text-[25px]"
            break
        }
        case "md": {
            sizeClasses = "w-12 h-12 text-[35px]"
            break
        }
        case "lg": {
            sizeClasses = "w-16 h-16 text-xl"
            break;
        }
        case "xl": {
            sizeClasses = "w-24 h-24 text-2xl"
            break;
        }
    }
  return (
    <div className={`rounded-full overflow-hidden border-2 border-[#0d2738] cursor-pointer ${sizeClasses}`} onClick={onClick}>
      {avImage ? (
        <Image src={avImage} alt={alt || name || "avatar"} className="object-cover w-full h-full" fill />
      ) : (
        <span className="flex items-center justify-center w-full h-full ">
          {name?.charAt(0)}
        </span>
      )}
    </div>
  )
}

export default Avatar