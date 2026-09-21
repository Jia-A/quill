import Button from "@/atoms/Button";

const NotFound = () => {
  return (
    <main className="mx-auto max-w-md px-4 py-20 text-center">
      <p className="text-sm font-medium text-muted">404</p>
      <h1 className="mt-2 text-xl font-semibold">Story not found</h1>
      <p className="mt-2 text-sm leading-relaxed text-muted">
        {`The story you're looking for doesn't exist or may have been moved.`}
      </p>
      <div className="mt-6 flex justify-center">
        <Button href="/blogs" variant="primary" label="Browse all stories" />
      </div>
    </main>
  );
};

export default NotFound;
