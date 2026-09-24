import { useContext } from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { AdminContext } from '../contexts/AdminContext';
import { environment } from '../../config/environment';

export const AdminRouteGuard = () => {
  const { isAdmin, authChecked } = useContext(AdminContext);
  const location = useLocation();
  if (!authChecked) return <div className="dhl-admin-auth-loading" role="status">Checking admin access...</div>;
  return isAdmin || environment.devAdminBypass ? <Outlet /> : <Navigate to={`/signin?next=${encodeURIComponent(location.pathname)}`} replace />;
};
