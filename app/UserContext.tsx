/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useRef,
} from "react";
// import { io, Socket } from 'socket.io-client';
// import localforage from 'localforage';
import { EstatesListRow, notification, UserContextType } from "./services/types";
import { User } from "./services/types";
import { fetchNotifications } from "./services/apis";

interface UnifiedUserContextType extends UserContextType {
  user: User | null;
  setUser: (user: User | null) => void;
  isSidebarOpen: boolean;
  setIsSidebarOpen: (isOpen: boolean) => void;
  isLoading: boolean;
  setIsLoading: (loading: boolean) => void;
  estatesList: EstatesListRow[];
  setEstatesList: (list: EstatesListRow[]) => void;
  notifications: notification[];
  setNotifications: (notifications: notification[]) => void;
  triggerRefresh: () => void;
  badgeCount: number;
  setBadgeCount: (count: number) => void;
  loadingNotifications: boolean;
}

const UserContext = createContext<UnifiedUserContextType | undefined>(
  undefined,
);

export const UserProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [estatesList, setEstatesList] = useState<EstatesListRow[]>([]);
  const [isLoading, setIsLoading] = useState(false);  
  const [notifications, setNotifications] = useState<notification[]>([]);
  const [loadingNotifications, setLoadingNotifications] = useState(false);
  // const socketRef = useRef<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [badgeCount, setBadgeCount] = useState<number>(0);
  const [refreshTrigger, setRefreshTrigger] = useState<boolean>(false);
  const triggerRefresh = () => setRefreshTrigger((prev) => !prev);

  useEffect(() => {
    const getNotifications = async () => {
      try {
        // console.log("fetching Notifications");
        setLoadingNotifications(true);
        const result = await fetchNotifications();
        if (result.success) {
          // console.log("fetched notifications:", result.list);
          setNotifications(result.list);

          const lastRead = new Date(result.lastReadAt || "1970-01-01");
          const unreadCount = result.list.filter(
            (n: any) => new Date(n.created_at) > lastRead,
          ).length;

          setBadgeCount(unreadCount);
        }
      } catch (error) {
        alert("Failed to fetch notifications");
      } finally {
        setLoadingNotifications(false);
      }
    };

    getNotifications();
  }, [user, refreshTrigger]);

  //   useEffect(() => {
  //     const newSocket = io('http://localhost:3066', {
  //       path: '/api/socket.io',
  //       withCredentials: true,
  //       autoConnect: true,
  //       reconnectionAttempts: 5,
  //     });

  //     newSocket.on('connect', () => setIsConnected(true));
  //     newSocket.on('onlineCheck', (users) => setOnlineMembers(users));

  //     newSocket.on('notification_deleted', (id: string) => {
  //       setNotifications((prev) => prev.filter((n) => n._id !== id));
  //     });

  //       });
  //     };

  //     newSocket.on('messages', (data) => {
  //       setNotifications((prev) => {
  //         const incoming = Array.isArray(data) ? data : [data];
  //         const combined = [...incoming, ...prev];
  //         return combined.filter((v, i, a) => a.findIndex((t) => t._id === v._id) === i);
  //       });
  //     });

  //     socketRef.current = newSocket;
  //     return () => {
  //       newSocket.close();
  //     };
  //   }, []);

  return (
    <UserContext.Provider
      value={{
        user,
        setUser,
        isSidebarOpen,
        setIsSidebarOpen,
        isLoading,
        setIsLoading,
        estatesList,
        setEstatesList,
        notifications,
        setNotifications,
        triggerRefresh,
        badgeCount,
        setBadgeCount,
        // socket: socketRef.current,
        loadingNotifications,
      }}
    >
      {children}
    </UserContext.Provider>
  );
};

export const useUser = () => {
  const context = useContext(UserContext);
  if (!context) throw new Error("useUser must be used within a UserProvider");
  return context;
};
