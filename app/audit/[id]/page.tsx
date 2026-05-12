import { Redis } from '@upstash/redis';

// 🚀 THE MAGIC LINE: Forces Next.js to NEVER cache this page so it always checks the real database
export const dynamic = 'force-dynamic';

export default async function AuditReportPage(props: any) {
  
  // 1. Safely handle the ID parameter for all versions of Next.js
  const params = await props.params;
  const id = params.id;

  const dbUrl = process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL;
  const dbToken = process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN;

  if (!dbUrl || !dbToken) {
    return <div className="p-10 text-red-600 font-bold">CRITICAL: Database keys are missing!</div>;
  }

  // 2. Initialize Redis
  const redis = new Redis({ url: dbUrl, token: dbToken });

  // 3. Fetch the data
  const auditData: any = await redis.get(`audit:${id}`);

  // 🛑 INSTEAD OF A 404, WE BUILD A CRASH REPORTER SCREEN
  if (!auditData) {
    return (
      <div className="min-h-screen bg-[#F7F7F5] p-10 font-sans flex items-center justify-center">
        <div className="bg-white border-2 border-[#111111] p-8 rounded-[24px] max-w-2xl w-full shadow-2xl">
          <h1 className="text-2xl font-bold text-[#111111] mb-4">⚠️ Data Not Found in Database</h1>
          <p className="mb-6 text-[#666666]">The page loaded successfully, but the Upstash Database returned <b>null</b>.</p>
          
          <div className="bg-[#F9F9F9] p-6 rounded-xl border border-[#E5E5E5] space-y-3 font-mono text-[13px] text-[#111111]">
            <p><b>ID Searched from URL:</b> {id}</p>
            <p><b>Database Key:</b> audit:{id}</p>
            <p><b>Database URL:</b> {dbUrl.substring(0, 25)}...</p>
          </div>

          <div className="mt-6 p-4 bg-red-50 text-red-600 rounded-xl text-[13px] font-medium border border-red-100">
            If you generated this report recently, the API Route failed to save it. If you generated it a long time ago, the database might have cleared. Generate a new report and try again!
          </div>
        </div>
      </div>
    );
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
               ${totals?.savings?.toLocaleString() || 0}
             </p>
           </div>
           <div className="hidden md:block w-px h-16 bg-[#E5E5E5]"></div>
           <div>
             <p className="text-[13px] font-semibold text-[#666666] mb-2">Total SaaS Spend</p>
             <p className="text-3xl font-semibold tracking-tight text-[#111111]">
               ${totals?.current?.toLocaleString() || 0}
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
             {aiResponse ? aiResponse.split('\n').map((para: string, i: number) => <p key={i}>{para}</p>) : <p>No summary generated.</p>}
          </div>
        </div>

      </main>
    </div>
  );
}
