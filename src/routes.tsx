import { RouteObject } from 'react-router-dom';
import DashboardPage from './presentation/pages/DashboardPage';
import AnalyticsPage from './presentation/pages/AnalyticsPage';

export const routes: RouteObject[] = [
  { path: '/', element: <DashboardPage /> },
  { path: '/month/:monthId', element: <DashboardPage /> },
  { path: '/analytics', element: <AnalyticsPage /> },
  { path: '*', element: <DashboardPage /> }
];
