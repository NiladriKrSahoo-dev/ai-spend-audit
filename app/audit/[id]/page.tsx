import { Redis } from '@upstash/redis';
import { notFound } from 'next/navigation';

export const dynamic = 'force-dynamic';

export default async function AuditReportPage(props: any) {
  const params = await props.params;
  const id = params.id;

  const dbUrl = process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL;
  const dbToken = process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN;
  if (!dbUrl || !dbToken) return <div>Config Error</div>;

  const redis = new Redis({ url: dbUrl, token: dbToken });
  const auditData: any = await redis.get(`audit:${id}`);

  if (!auditData) notFound();

  const { aiResponse, totals, email, createdAt } = auditData;
  const dateStr = new Date(createdAt).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });

  return (
    <div className="min-h-screen bg-[#F7F7F5] text-[#111111] font-sans pb-20">
      <nav className="pt-6 pb-4 px-8 max-w-[800px] mx-auto flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-[#111111] rounded-sm"></div>
          <span className="font-bold text-[15px] tracking-tight">Vantage</span>
        </div>
        <a href="/" className="text-[13px] font-semibold text-[#666666] hover:text-[#111111]">Back to Dashboard</a>
      </nav>

      <main className="max-w-[800px] mx-auto px-8 py-12">
        <h1 className="text-3xl font-bold tracking-tight mb-2">Executive Audit Report</h1>
        <p className="text-[#666666] text-[15px] mb-12">Generated on {dateStr} for {email}</p>

        <div className="bg-white rounded-[24px] border border-[#E5E5E5] p-8 shadow-sm flex gap-24 mb-12">
           <div>
             <p className="text-[13px] font-semibold text-[#666666] mb-2 uppercase tracking-wider">Identified Waste</p>
             <p className="text-6xl font-bold tracking-tighter text-emerald-600">${totals.savings.toLocaleString()}</p>
           </div>
           <div>
             <p className="text-[13px] font-semibold text-[#666666] mb-2 uppercase tracking-wider">Total Spend</p>
             <p className="text-4xl font-bold text-[#111111]">${totals.current.toLocaleString()}</p>
           </div>
        </div>

        <div className="bg-white border border-[#E5E5E5] rounded-[24px] p-8 shadow-sm">
          <h2 className="text-[15px] font-bold mb-6 uppercase tracking-widest">AI Strategic Summary</h2>
          <div className="text-[#111111] text-[17px] leading-relaxed space-y-4">
             {aiResponse.split('\n').map((para: string, i: number) => <p key={i}>{para}</p>)}
          </div>
        </div>
      </main>
    </div>
  );
}
