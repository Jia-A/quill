import { ButtonProps } from "@/types/ButtonProps";
import classNames from "classnames";
import NextLink from "next/link";

const Spinner = () => (
  <span className="w-3.5 h-3.5 rounded-full border-2 border-current border-t-transparent animate-spin" />
);

const base =
  "inline-flex items-center justify-center gap-2 rounded-md border font-medium cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed";

const variants = {
  primary: "bg-fg text-bg border-fg hover:opacity-90",
  secondary: "bg-bg text-fg border-border hover:bg-bg-subtle",
  ghost: "bg-transparent text-muted border-transparent hover:text-fg hover:bg-bg-subtle",
};

const sizes = {
  sm: "text-sm px-2.5 py-1",
  md: "text-sm px-3 py-1.5",
  lg: "text-base px-4 py-2",
};

const squareSizes = {
  sm: "w-7 h-7",
  md: "w-8 h-8",
  lg: "w-10 h-10",
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
    <>
      {loading ? <Spinner /> : icon}
      {children ?? label}
    </>
  );

  const classes = classNames(
    base,
    variants[variant],
    square ? squareSizes[size] : sizes[size],
    className
  );

  // Renders as a Link when href is provided, otherwise a <button>.
  if (href) {
    return (
      <NextLink href={href} prefetch={prefetch} className={classes} aria-disabled={isDisabled}>
        {content}
      </NextLink>
    );
  }

  return (
    <button type={type} disabled={isDisabled} className={classes} {...rest}>
      {content}
    </button>
  );
};

export default Button;
