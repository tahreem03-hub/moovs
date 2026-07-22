// src/modules/admin/index.js
export { default as AdminDashboard } from './pages/AdminDashboard';
export { default as Operators } from './pages/Operators';
export { default as OperatorDetail } from './pages/OperatorDetail';
export { default as OperatorForm } from './components/OperatorForm';
export { default as StatsCards } from './components/StatsCards';
export { default as OperatorTable } from './components/OperatorTable';

export * from './services/adminService';
export { default as adminService } from './services/adminService';