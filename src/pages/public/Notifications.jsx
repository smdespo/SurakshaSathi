import { AppShell } from "../../components/layout/AppShell";
import { Card } from "../../components/ui/index";

export default function Notifications() {
  return (
    <AppShell title="Notifications">
      <div className="max-w-lg mx-auto">
        <Card>
          <div className="py-10 flex flex-col items-center text-center">
            <div className="w-14 h-14 rounded-2xl bg-brand-light flex items-center justify-center mb-4">
              <svg width="26" height="26" fill="none" viewBox="0 0 24 24" stroke="#2bbfa4" strokeWidth={1.8}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
              </svg>
            </div>
            <p className="text-sm font-bold text-gray-700 mb-1">All caught up</p>
            <p className="text-xs text-gray-400">No new notifications right now.</p>
          </div>
        </Card>
      </div>
    </AppShell>
  );
}