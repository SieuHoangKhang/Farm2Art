export interface Notification {
  id: string;
  type: 'order' | 'promo' | 'system' | 'message';
  title: string;
  message: string;
  read: boolean;
  timestamp: number;
  icon: string;
  action?: {
    label: string;
    href: string;
  };
}
