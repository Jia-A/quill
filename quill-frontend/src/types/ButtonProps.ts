export interface ButtonProps {
    label: string;
    type?: "button" | "submit" | "reset";
    rest?: React.ButtonHTMLAttributes<HTMLButtonElement>;
}