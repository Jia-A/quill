export interface AvatarProps {
    size? : "sm" | "md" | "lg" | "xl";
    avImage?: string;
    alt?: string;
    name?: string;
    onClick: () => void
}