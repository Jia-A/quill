export interface ButtonProps {
    label: string;
    type?: "button" | "submit" | "reset";
    variant?: "primary" | "secondary" | "iconOnly";
    className?: string;
    size?: "sm" | "md" | "lg";
    icon?: React.ReactNode;
    rest?: React.ButtonHTMLAttributes<HTMLButtonElement>;
}