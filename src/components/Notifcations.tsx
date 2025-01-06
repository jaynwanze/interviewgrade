// src/components/Notifications.tsx

'use client';

import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { BellIcon, X } from "lucide-react";
import { useNotifications } from "@/contexts/NotificationsContext";
import Link from "next/link";

export default function Notifications() {
  const { notifications, removeNotification } = useNotifications();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" className="relative">
          <BellIcon className="h-4 w-4 mr-2" />
          Notifications
          {notifications.length > 0 && (
            <span className="absolute top-0 right-0 inline-flex items-center justify-center px-1 py-0.5 text-xs font-bold leading-none text-red-100 bg-red-600 rounded-full">
              {notifications.length}
            </span>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-80 max-h-[400px] overflow-auto">
        <div className="grid gap-4 p-4">
          <h4 className="font-medium leading-none">Notifications</h4>
          {notifications.length === 0 ? (
            <p className="text-sm text-gray-500">No new notifications.</p>
          ) : (
            notifications.map((notification) => (
              <div key={notification.id} className="flex items-start justify-between">
                <div>
                  <Link href={notification.link} className="text-sm font-medium text-blue-600 hover:underline">
                    {notification.title}
                  </Link>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {notification.message}
                  </p>
                  <p className="text-xs text-gray-400">
                    {notification.timestamp.toLocaleString()}
                  </p>
                </div>
                <button
                  onClick={() => removeNotification(notification.id)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            ))
          )}
          {notifications.length > 0 && (
            <Button
              variant="outline"
              className="mt-4 w-full"
              onClick={() => {
                // Optionally, implement "Mark All as Read" functionality
                notifications.forEach((n) => removeNotification(n.id));
              }}
            >
              Mark All as Read
            </Button>
          )}
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
