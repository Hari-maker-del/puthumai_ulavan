import React from 'react';
import { useAuth } from '@/context/AuthContext';
import { Download, FileText, Printer } from 'lucide-react';
import { buildFarmReportText } from '../../services/farmReportService';

export default function FarmReportPage() {
  const { user } = useAuth();
  const report = buildFarmReportText({
    farmerName: user?.email || 'Current farmer',
    notes: 'Review this report against your actual farm records before using it for financial or agricultural decisions.',
  });

  const printReport = () => window.print();

  const download = () => {
    const blob = new Blob([report], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = 'puthumai-uzhavan-farm-report.txt'; a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      <div><p className="text-sm font-medium text-emerald-600">Season summary</p><h1 className="text-3xl font-bold">Farm Report</h1><p className="mt-1 text-sm text-slate-600">Export a simple farm-season summary from currently available data.</p></div>
      <div className="rounded-2xl border bg-white p-6 shadow-sm">
        <div className="flex items-center gap-3 mb-4"><FileText className="text-emerald-600" /><h2 className="font-semibold">Report preview</h2></div>
        <pre className="whitespace-pre-wrap rounded-xl bg-slate-50 p-4 text-sm">{report}</pre>
        <div className="mt-4 flex flex-wrap gap-2">
          <button onClick={printReport} className="rounded-xl bg-emerald-600 px-5 py-3 font-medium text-white"><Printer className="mr-2 inline h-4 w-4" />Print / Save as PDF</button>
          <button onClick={download} className="rounded-xl border px-5 py-3 font-medium text-slate-700"><Download className="mr-2 inline h-4 w-4" />Export text</button>
        </div>
      </div>
    </div>
  );
}
