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
      <label htmlFor="Firstname" className="text-sm mb-1 text-gray-700">
        {label}
      </label>
      <input
        className="border border-gray-300 rounded p-2 w-full focus:outline-none focus:border-black "
        {...register}
      />
    </span>
  );
};

export default Input;
