import { Outlet } from "react-router-dom";
import Sidebar from "../components/Sidebar";
import Header from "../components/Header";

const Layout = () => {
  return (
    <>
      <Header />
      <Sidebar />

      <main className="sm:ml-25 pt-22 h-screen overflow-y-auto p-6">
        <Outlet />
      </main>
    </>
  );
};

export default Layout;