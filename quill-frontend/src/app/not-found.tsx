import { ArrowLeft } from "lucide-react";
import Button from "@/atoms/Button";

const NotFound = () => {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-6">
      <div className="max-w-lg text-center">
        <span className="font-serif font-light text-[clamp(4rem,15vw,9rem)] leading-none accent-text block">
          404
        </span>
        <h1 className="font-serif text-3xl tracking-tightest mt-4 mb-4">Story not found</h1>
        <p className="text-muted-foreground mb-10 leading-relaxed">
          {`The story you're looking for doesn't exist or may have been moved.`}
        </p>
        <Button
          href="/blogs"
          variant="primary"
          icon={<ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-1" />}
          label="Browse all stories"
        />
      </div>
    </div>
  );
};

export default NotFound;
