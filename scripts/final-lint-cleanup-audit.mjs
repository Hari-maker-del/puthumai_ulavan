import fs from 'node:fs';import path from 'node:path';
const root=process.cwd(), bad=[];
const files=['src/components/dashboard/CropRecommendationCard.tsx','src/components/dashboard/DashboardLayout.tsx','src/pages/LoginPage.tsx','src/pages/app/FarmProfilePage.tsx','src/pages/app/GovSchemesPage.tsx','src/pages/app/MarketIntelligencePage.tsx','src/hooks/useRealtimeDashboard.ts','src/services/cropService.ts','src/pages/app/AIAssistantPage.tsx','src/services/weatherService.ts','src/services/offlineSyncEngine.ts','src/services/runtimeMonitoringService.ts','src/services/notificationService.ts','src/services/farmOutcomeLearningService.ts','src/services/scannerService.ts','src/services/types.ts'];
for(const f of files){const p=path.join(root,f);if(!fs.existsSync(p))bad.push('Missing '+f);else{const t=fs.readFileSync(p,'utf8');if(t.includes('catch {}'))bad.push(f+': empty catch block');}}
if(bad.length){console.error('LINT CLEANUP AUDIT FAILED');bad.forEach(x=>console.error(x));process.exit(1)}
console.log('LINT CLEANUP STATIC AUDIT PASSED');
