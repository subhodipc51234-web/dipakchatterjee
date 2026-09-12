// app/admin/(protected)/logs/page.tsx
//
// Read-only view of dashboard_activity_logs. The table itself is
// self-pruning (see the AFTER INSERT trigger in
// supabase/migrations/20260922010000_dashboard_activity_logs.sql), so
// this query never needs its own retention logic — it always reflects
// "at most 20 rows, all within the last 24 hours" as stored.

import type { Metadata } from "next";
import { History } from "lucide-react";
import { createClient } from "@/utils/supabase/server";
import type { DashboardActivityLog } from "@/types/domain";
import { formatRelativeTime } from "@/lib/relative-time";

export const metadata: Metadata = {
  title: "Activity Logs - Dashboard | Dipak Chatterjee",
};

function formatAbsolute(iso: string) {
  return new Date(iso).toLocaleString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
    timeZone: "Asia/Kolkata",
  });
}

const ACTION_BADGE_CLASS: Record<string, string> = {
  CREATE: "border-forest/30 text-forest bg-forest-100",
  UPDATE: "border-saffron/30 text-saffron-600 bg-saffron-100",
  DELETE: "border-rust/30 text-rust bg-rust/10",
};

function actionBadgeClass(action: string) {
  const prefix = Object.keys(ACTION_BADGE_CLASS).find((p) => action.startsWith(p));
  return prefix ? ACTION_BADGE_CLASS[prefix] : "border-line text-ink-400 bg-paper-100";
}

export default async function ActivityLogsPage() {
  const supabase = await createClient();

  const { data: logs } = await supabase
    .from("dashboard_activity_logs")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(20);

  const logList = (logs as DashboardActivityLog[]) ?? [];

  return (
    <div>
      <div className="flex items-center gap-3 mb-2">
        <History className="w-5 h-5 text-saffron-600" />
        <p className="text-sm font-semibold text-saffron-600">Activity Logs</p>
      </div>
      <h1 className="font-display text-3xl text-navy-900 mb-1.5">Dashboard activity</h1>
      <p className="text-sm text-ink-600 mb-8">
        Retains up to 20 events within a rolling 24-hour window.
      </p>

      {logList.length === 0 ? (
        <div className="border border-dashed border-line rounded-lg p-10 text-center text-sm text-ink-400">
          No activity recorded in the last 24 hours.
        </div>
      ) : (
        <div className="bg-white border border-line rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-line bg-paper-100 text-left">
                  <th className="px-4 py-3 font-semibold text-ink-600">Timestamp</th>
                  <th className="px-4 py-3 font-semibold text-ink-600">Admin User</th>
                  <th className="px-4 py-3 font-semibold text-ink-600">Action</th>
                  <th className="px-4 py-3 font-semibold text-ink-600">Details</th>
                </tr>
              </thead>
              <tbody>
                {logList.map((log) => (
                  <tr key={log.id} className="border-b border-line last:border-0">
                    <td className="px-4 py-3 whitespace-nowrap align-top">
                      <p className="text-navy-900 font-medium">{formatRelativeTime(log.created_at)}</p>
                      <p className="text-xs text-ink-400 mt-0.5">{formatAbsolute(log.created_at)}</p>
                    </td>
                    <td className="px-4 py-3 align-top text-ink-600">{log.user_email}</td>
                    <td className="px-4 py-3 align-top">
                      <span
                        className={`inline-flex text-[11px] font-semibold px-2 py-0.5 rounded border ${actionBadgeClass(log.action)}`}
                      >
                        {log.action}
                      </span>
                    </td>
                    <td className="px-4 py-3 align-top text-ink-600">{log.details}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
