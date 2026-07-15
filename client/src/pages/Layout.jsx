import { Outlet } from "react-router-dom";
import Sidebar from "../components/Sidebar";
import Header from "../components/Header";

const Layout = () => {
  return (
    <>
      <Header />
      <Sidebar />

      <main className="sm:ml-25 pt-18 h-screen overflow-y-auto">
        <Outlet />
      </main>
    </>
  );
};

export default Layout;