'use client';

import { useEffect, useState } from 'react';

type AnalyticsData = {
  totalConversations: number;
  totalMessages: number;
  unansweredCount: number;
  unansweredQuestions: { question: string; count: number }[];
  totalLeads: number;
};

export default function AnalyticsPage() {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/analytics')
      .then((res) => res.json())
      .then((d) => {
        setData(d);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  return (
    <div className="min-h-screen bg-slate-950 px-6 py-10 text-slate-100">
      <div className="mx-auto max-w-5xl space-y-6">
        <div>
          <p className="text-sm font-medium uppercase tracking-[0.3em] text-amber-400">
            Analytics
          </p>
          <h1 className="mt-2 text-3xl font-semibold text-white">
            Customer Insights
          </h1>
          <p className="mt-1 text-slate-400">
            See what visitors are asking and where your bot needs more training.
          </p>
        </div>

        {loading ? (
          <p className="text-slate-400">Loading...</p>
        ) : (
          <>
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
              <StatCard label="Conversations" value={data?.totalConversations ?? 0} />
              <StatCard label="Messages" value={data?.totalMessages ?? 0} />
              <StatCard label="Unanswered" value={data?.unansweredCount ?? 0} />
              <StatCard label="Leads Captured" value={data?.totalLeads ?? 0} />
            </div>

            <div className="rounded-3xl border border-slate-800 bg-slate-900/80 p-6 shadow-xl shadow-black/20">
              <h2 className="text-lg font-semibold text-white">
                Questions Your Bot Couldn't Answer
              </h2>
              <p className="mt-1 text-sm text-slate-400">
                These are things visitors asked that weren't covered in your
                uploaded documents. Add answers to your FAQ to fix these.
              </p>

              <div className="mt-4 space-y-2">
                {(data?.unansweredQuestions ?? []).length === 0 ? (
                  <p className="text-sm text-slate-500">
                    No unanswered questions yet — nice!
                  </p>
                ) : (
                  data!.unansweredQuestions.map((item, i) => (
                    <div
                      key={i}
                      className="flex items-center justify-between rounded-xl border border-slate-800 bg-slate-950/60 px-4 py-3"
                    >
                      <span className="text-sm text-slate-200">
                        {item.question}
                      </span>
                      <span className="ml-4 shrink-0 rounded-full bg-amber-500/15 px-3 py-1 text-xs font-semibold text-amber-400">
                        Asked {item.count}x
                      </span>
                    </div>
                  ))
                )}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-5 text-center shadow-lg shadow-black/20">
      <p className="text-2xl font-bold text-white">{value}</p>
      <p className="mt-1 text-xs uppercase tracking-wide text-slate-400">
        {label}
      </p>
    </div>
  );
}