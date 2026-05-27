import { ButtonProps } from "@/types/ButtonProps";
import classNames from "classnames";

const Spinner = () => (
  <span className="ml-2 inline-block w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
);

const Button = ({
  label,
  type,
  size = "md",
  variant = "secondary",
  className,
  icon,
  loading = false,
  disabled,
  ...rest
}: ButtonProps) => {
  const isDisabled = disabled || loading;
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
          disabled={isDisabled}
          className={classNames(
            "bg-[#02111B] dark:bg-primary self-center rounded-md text-white dark:text-primary-foreground w-auto cursor-pointer transition transform duration-200 ease-in-out hover:scale-105 hover:shadow-lg hover:bg-[#0a2435] dark:hover:bg-primary/90 flex items-center disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:scale-100",
            sizeClasses,
            className
          )}
          {...rest}
        >
          {label}
          {loading ? <Spinner /> : icon ? <span className="ml-2">{icon}</span> : null}
        </button>
      );
    case "secondary":
      return (
        <button
          type={type}
          disabled={isDisabled}
          className={classNames(
            "bg-white dark:bg-transparent self-center border-[1.5px] border-[#8f8dac] dark:border-border font-semibold rounded-md text-[#02111B] dark:text-foreground w-auto cursor-pointer transition transform duration-200 ease-in-out hover:scale-101 hover:shadow-md dark:hover:bg-muted flex items-center disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:scale-100",
            sizeClasses,
            className
          )}
          {...rest}
        >
          {label}
          {loading ? <Spinner /> : icon ? <span className="ml-2">{icon}</span> : null}
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
