import { Link } from "react-router-dom";

const NotFound: React.FC = () => {
  return (
    <div className="gl-page gl-page-center">
      <h1 className="gl-page-title">404</h1>
      <p className="gl-muted">Сторінку не знайдено.</p>
      <Link to="/" className="gl-btn gl-btn-primary gl-mt-md">
        На головну
      </Link>
    </div>
  );
};

export default NotFound;

