import { Outlet } from "react-router-dom";
import Sidebar from "../components/Sidebar";
import Header from "../components/Header";

import { useWebSocket } from '../hooks/useWebSocket';
import { useAuth } from '../context/AuthContext';
import { useState } from "react";

const Layout = () => {

   const { user } = useAuth(); // Get current operator user
  const [notificationCount, setNotificationCount] = useState(0);

  const handleNewNotification = (notification) => {
    setNotificationCount(prev => prev + 1);
    
    // Optional: Show in-app notification banner
    // or update notification panel
  };

  const { isConnected, sendMessage, lastMessage } = useWebSocket(
    user?._id, // operatorId
    user?._id, // userId
    handleNewNotification
  );

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