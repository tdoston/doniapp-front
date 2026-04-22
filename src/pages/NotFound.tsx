import { Link } from "react-router-dom";

const NotFound = () => {
  return (
    <div className="flex min-h-screen items-center justify-center bg-muted px-4">
      <div className="text-center">
        <h1 className="mb-3 text-4xl font-extrabold text-foreground">404</h1>
        <p className="mb-6 text-base text-muted-foreground">Sahifa topilmadi</p>
        <Link to="/" className="text-primary font-semibold underline underline-offset-4 hover:text-primary/90">
          Bosh sahifaga
        </Link>
      </div>
    </div>
  );
};

export default NotFound;
