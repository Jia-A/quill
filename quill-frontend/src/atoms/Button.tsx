import { ButtonProps } from "@/types/ButtonProps";
import classNames from "classnames";

const Button = ({
  label,
  type,
  size = "md",
  variant = "secondary",
  className,
  icon,
  ...rest
}: ButtonProps) => {
  let sizeClasses = "";
  switch (size) {
    case "sm":
      sizeClasses = "text-sm py-1.5 px-2.5";
      break;
    case "md":
      sizeClasses = "text-md py-2.5 px-4.5";
      break;
    case "lg":
      sizeClasses = "text-lg py-4 px-8";
      break;
  }
  switch (variant) {
    case "primary":
      return (
        <button
          type={type}
          className={classNames(
            "bg-[#02111B] self-center rounded-md text-white w-auto cursor-pointer transition transform duration-200 ease-in-out hover:scale-105 hover:shadow-lg hover:bg-[#0a2435] flex",
            sizeClasses,
            className
          )}
          {...rest}
        >
          {label}
          {icon ? 
          <span className="ml-2">{icon}</span>
          : null}
          
        </button>
      );
    case "secondary":
      return (
        <button
          type={type}
          className={classNames(
            "bg-[white] self-center border-[1.5px] border-[#8f8dac] font-semibold rounded-md text-[#02111B] w-auto cursor-pointer transition transform duration-200 ease-in-out hover:scale-101 hover:shadow-md flex",
            sizeClasses,
            className
          )}
          {...rest}
        >{label}
          {icon ? 
          <span className="ml-2">{icon}</span>
          : null}
          
        </button>
      );
    case "iconOnly":
      return (
        <button
          type={type}
          className={classNames(
            "rounded-full text-white  w-full cursor-pointer",
            sizeClasses,
            className
          )}
          {...rest}
        >
          {icon}
        </button>
      );
  }
};

export default Button;
