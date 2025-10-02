export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    label: string;
    variant?: "primary" | "secondary" | "iconOnly";
    size?: "sm" | "md" | "lg";
    icon?: React.ReactNode;
}