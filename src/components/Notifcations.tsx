'use client';

import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useNotifications } from '@/contexts/NotificationsContext';
import { BellIcon, X } from 'lucide-react';
import Link from 'next/link';

export default function Notifications() {
  const { notifications, removeNotification } = useNotifications();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        asChild
        className="focus:ring-none hover:bg-transparent focus:ring-0"
      >
        <Button
          variant="ghost"
          size="sm"
          className="h-5 w-5 px-0 text-muted-foreground focus:ring-0"
        >
          <BellIcon className="absolute rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100 dark:hover:text-foreground" />
          {notifications.length > 0 && (
            <span className="absolute top-0 right-0 inline-flex items-center justify-center px-1 py-0.5 text-xs font-bold leading-none text-red-100 bg-red-600 rounded-full">
              {notifications.length}
            </span>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        className="w-80 max-h-[400px] overflow-auto p-2"
        sideOffset={10}
      >
        <div className="grid gap-4 p-4">
          <h4 className="font-medium leading-none">Notifications</h4>
          {notifications.length === 0 ? (
            <p className="text-sm text-gray-500">No new notifications.</p>
          ) : (
            notifications.map((notification) => (
              <div
                key={notification.id}
                className="flex items-start justify-between"
              >
                <div>
                  <Link
                    href={notification.link}
                    className="text-sm font-medium text-blue-600 hover:underline"
                  >
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
