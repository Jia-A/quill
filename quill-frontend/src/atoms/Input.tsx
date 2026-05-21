import type { UseFormRegisterReturn } from "react-hook-form";

const Input = ({
  label,
  register,
}: {
  label: string;
  register?: UseFormRegisterReturn<string>;
}) => {
  return (
    <span className="flex flex-col w-full">
      <label htmlFor="Firstname" className="text-sm mb-1 text-foreground">
        {label}
      </label>
      <input
        className="border border-border dark:border-muted-foreground/40 rounded p-2 w-full bg-background dark:bg-muted text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
        {...register}
      />
    </span>
  );
};

export default Input;
