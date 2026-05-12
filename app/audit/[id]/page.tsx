import { Redis } from '@upstash/redis';
import { notFound } from 'next/navigation';

export default async function AuditReportPage({ params }: { params: { id: string } }) {
  
  // 1. Safely check for database keys
  const dbUrl = process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL;
  const dbToken = process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN;

  if (!dbUrl || !dbToken) {
    return (
      <div className="min-h-screen flex items-center justify-center p-10 bg-[#F7F7F5]">
        <div className="bg-red-50 text-red-600 p-6 rounded-xl border border-red-200 font-medium">
          CRITICAL: Database keys are missing in Vercel for this page!
        </div>
      </div>
    );
  }

  // 2. Initialize Redis safely inside the component
  const redis = new Redis({ url: dbUrl, token: dbToken });

  // 3. Fetch the data from the database using the URL parameter
  const auditData: any = await redis.get(`audit:${params.id}`);

  // 4. If the ID doesn't exist in the database, trigger the 404 page
  if (!auditData) {
    notFound();
  }

  const { aiResponse, totals, email, createdAt } = auditData;
  const dateStr = new Date(createdAt).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });

  // 5. Render the Premium Minimalist UI
  return (
    <div className="min-h-screen bg-[#F7F7F5] text-[#111111] font-sans selection:bg-black selection:text-white pb-20">
      <nav className="pt-6 pb-4 px-8 max-w-[800px] mx-auto flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-[#111111] rounded-sm"></div>
          <span className="font-bold text-[15px] tracking-tight">StackTrim</span>
        </div>
        <a href="/" className="text-[13px] font-semibold text-[#666666] hover:text-[#111111] transition-colors">Create New Audit</a>
      </nav>

      <main className="max-w-[800px] mx-auto px-8 py-12">
        <div className="mb-8">
          <h1 className="text-3xl font-bold tracking-tight mb-2">Executive Audit Report</h1>
          <p className="text-[#666666] text-[15px]">Generated on {dateStr} for {email}</p>
        </div>

        {/* Top Metrics */}
        <div className="bg-white rounded-[24px] border border-[#E5E5E5] p-8 shadow-sm flex flex-col md:flex-row gap-12 md:gap-24 mb-8">
           <div>
             <p className="text-[13px] font-semibold text-[#666666] mb-2 flex items-center gap-2">
                Identified Waste
                <span className="bg-[#F0F0F0] text-[#111111] px-2 py-0.5 rounded text-[10px] uppercase tracking-wider">Monthly</span>
             </p>
             <p className="text-5xl font-bold tracking-tighter leading-none text-emerald-600">
               ${totals.savings.toLocaleString()}
             </p>
           </div>
           <div className="hidden md:block w-px h-16 bg-[#E5E5E5]"></div>
           <div>
             <p className="text-[13px] font-semibold text-[#666666] mb-2">Total SaaS Spend</p>
             <p className="text-3xl font-semibold tracking-tight text-[#111111]">
               ${totals.current.toLocaleString()}
             </p>
           </div>
        </div>

        {/* AI Strategic Summary */}
        <div className="bg-white border border-[#E5E5E5] rounded-[24px] p-8 shadow-sm mb-12">
          <h2 className="text-[15px] font-bold text-[#111111] mb-4 uppercase tracking-wider flex items-center gap-2">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path></svg>
            AI Strategic Summary
          </h2>
          <div className="text-[#111111] text-[15px] leading-relaxed font-medium space-y-4 bg-[#F9F9F9] p-6 rounded-[16px] border border-[#E5E5E5]">
             {aiResponse.split('\n').map((para: string, i: number) => <p key={i}>{para}</p>)}
          </div>
        </div>

      </main>
    </div>
  );
}
