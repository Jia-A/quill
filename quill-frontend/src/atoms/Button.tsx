import { ButtonProps } from "@/types/ButtonProps";
import classNames from "classnames";
import NextLink from "next/link";

const Spinner = () => (
  <span className="inline-block w-3.5 h-3.5 border-[1.5px] border-current border-t-transparent rounded-full animate-spin" />
);

const base =
  "group relative inline-flex items-center justify-center select-none cursor-pointer transition-colors duration-300 ease-out disabled:opacity-50 disabled:cursor-not-allowed";

const variantClasses = {
  primary:
    "eyebrow bg-foreground text-background hover:bg-accent hover:text-accent-foreground active:bg-accent active:text-accent-foreground",
  secondary:
    "eyebrow border border-foreground/30 text-foreground hover:border-accent hover:text-accent active:border-accent active:text-accent",
  ghost: "eyebrow text-foreground hover:text-accent active:text-accent",
};

const sizeClasses = {
  sm: "text-[11px] py-2 px-3 sm:px-3.5",
  md: "text-xs py-2.5 px-4 sm:py-3 sm:px-5",
  lg: "text-sm py-3 px-6 sm:py-4 sm:px-8",
};

const squareSizeClasses = {
  sm: "w-7 h-7",
  md: "w-9 h-9",
  lg: "w-11 h-11",
};

const Button = ({
  label,
  children,
  type,
  size = "md",
  variant = "secondary",
  className,
  icon,
  loading = false,
  disabled,
  href,
  prefetch,
  square = false,
  ...rest
}: ButtonProps) => {
  const isDisabled = disabled || loading;

  const content = square ? (
    loading ? (
      <Spinner />
    ) : (
      icon
    )
  ) : (
    <span className="flex items-center gap-2">
      {icon}
      {children ?? label}
      {loading ? <Spinner /> : null}
    </span>
  );

  const sharedClassName = classNames(
    base,
    variantClasses[variant],
    square ? squareSizeClasses[size] : sizeClasses[size],
    className
  );

  // Renders as a Link when href is provided, otherwise a <button>.
  if (href) {
    return (
      <NextLink
        href={href}
        prefetch={prefetch}
        className={sharedClassName}
        aria-disabled={isDisabled}
      >
        {content}
      </NextLink>
    );
  }

  return (
    <button type={type} disabled={isDisabled} className={sharedClassName} {...rest}>
      {content}
    </button>
  );
};

export default Button;
