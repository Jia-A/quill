import { ButtonProps } from "@/types/ButtonProps";
import classNames from "classnames";

const Spinner = () => (
  <span className="ml-2 inline-block w-3.5 h-3.5 border-[1.5px] border-current border-t-transparent rounded-full animate-spin" />
);

const base =
  "group relative inline-flex items-center justify-center font-medium tracking-wide uppercase select-none cursor-pointer transition-colors duration-300 ease-out disabled:opacity-50 disabled:cursor-not-allowed";

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
      sizeClasses = "text-[11px] py-2 px-3.5";
      break;
    case "md":
      sizeClasses = "text-xs py-3 px-5";
      break;
    case "lg":
      sizeClasses = "text-sm py-4 px-8";
      break;
  }

  const content = (
    <>
      <span className="relative z-10 flex items-center font-mono">
        {label}
        {loading ? <Spinner /> : icon ? <span className="ml-2">{icon}</span> : null}
      </span>
    </>
  );

  switch (variant) {
    case "primary":
      // Solid ink button with an ember fill that sweeps up on hover.
      return (
        <button
          type={type}
          disabled={isDisabled}
          className={classNames(
            base,
            "overflow-hidden bg-foreground text-background",
            sizeClasses,
            className
          )}
          {...rest}
        >
          <span className="absolute inset-0 z-0 origin-bottom scale-y-0 bg-accent transition-transform duration-300 ease-out group-hover:scale-y-100 group-active:scale-y-100" />
          <span className="relative z-10 flex items-center font-mono group-hover:text-accent-foreground group-active:text-accent-foreground transition-colors duration-300">
            {label}
            {loading ? <Spinner /> : icon ? <span className="ml-2">{icon}</span> : null}
          </span>
        </button>
      );
    case "secondary":
      // Hairline-bordered button; border + text shift to ember on hover.
      return (
        <button
          type={type}
          disabled={isDisabled}
          className={classNames(
            base,
            "border border-foreground/30 text-foreground hover:border-accent hover:text-accent active:border-accent active:text-accent",
            sizeClasses,
            className
          )}
          {...rest}
        >
          {content}
        </button>
      );
    case "iconOnly":
      return (
        <button
          type={type}
          className={classNames(
            "inline-flex items-center justify-center text-foreground hover:text-accent transition-colors cursor-pointer",
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
