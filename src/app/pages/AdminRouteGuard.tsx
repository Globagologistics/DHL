import React, { useContext } from 'react';
import { Outlet } from 'react-router-dom';
import NotFound from './NotFound';
import { AdminContext } from '../contexts/AdminContext';

export const AdminRouteGuard = () => {
  const { isAdmin } = useContext(AdminContext);
  return isAdmin ? <Outlet /> : <NotFound />;
};
