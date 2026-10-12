import { Link, useLocation } from 'react-router-dom';
import {
  ArrowLeft, ArrowRight, BookOpen, CheckCircle2, HelpCircle, Clock3,
  CloudOff, FileText, Home, Leaf, Mail, RefreshCw, ShieldCheck,
  AlertTriangle, Wifi, Wrench, XCircle,
} from 'lucide-react';

type PageConfig = {
  title: string;
  eyebrow?: string;
  description: string;
  icon?: typeof Leaf;
  actions?: { label: string; to: string; primary?: boolean }[];
  sections?: { title: string; body: string }[];
};

const pages: Record<string, PageConfig> = {
  '/about': {
    eyebrow: 'OUR PURPOSE', title: 'About Puthumai Ulavan',
    description: 'Puthumai Ulavan is a digital farming companion designed to help farmers organize farm information and make better-informed decisions.',
    icon: Leaf,
    sections: [
      { title: 'Built around the farmer', body: 'Farm records, crop planning, expense tracking and advisory tools are brought together in one place.' },
      { title: 'Designed for practical use', body: 'Clear language, mobile-friendly layouts and connectivity-aware experiences help make digital tools easier to use in the field.' },
      { title: 'Decision support, not a guarantee', body: 'Recommendations are guidance. Check local conditions and consult qualified agricultural officers before making high-impact farming decisions.' },
    ],
  },
  '/features': {
    eyebrow: 'FARM TOOLS', title: 'Tools for every growing season',
    description: 'Manage farm information, review crop suggestions, track costs and explore farming insights from one workspace.',
    icon: Leaf, actions: [{ label: 'Open dashboard', to: '/dashboard', primary: true }],
    sections: [
      { title: 'Plan', body: 'Use crop recommendations, crop lifecycle tools and daily farm plans to organize upcoming work.' },
      { title: 'Monitor', body: 'Review weather information, crop health tools, alerts and farm health insights when the relevant services are available.' },
      { title: 'Learn', body: 'Use the AI assistant and government scheme information as starting points, then verify important advice with trusted local sources.' },
    ],
  },
  '/services': {
    eyebrow: 'FARM MANAGEMENT', title: 'One workspace for your farm',
    description: 'Puthumai Ulavan brings core farm-management tools together so you can spend less time searching and more time planning.',
    icon: BookOpen, actions: [{ label: 'Explore dashboard', to: '/dashboard', primary: true }],
    sections: [
      { title: 'Farm records', body: 'Keep your farm profile and relevant operational records organized.' },
      { title: 'Planning and insights', body: 'Explore crop planning, expenses, seasonal reports and yield estimation tools.' },
      { title: 'Advisory and information', body: 'Access the AI assistant, alerts, weather and scheme information. Availability depends on connectivity and configured data sources.' },
    ],
  },
  '/pricing': {
    eyebrow: 'ACCESS', title: 'Simple, transparent access',
    description: 'Check the plans and access options currently offered by your Puthumai Ulavan administrator. This page does not collect payment details.',
    icon: ShieldCheck,
    sections: [{ title: 'No surprise charges', body: 'Any paid feature should display its price and terms before you confirm. Never share an OTP or payment PIN with anyone.' }],
  },
  '/contact': {
    eyebrow: 'GET IN TOUCH', title: 'Contact Puthumai Ulavan',
    description: 'Need help using a farming tool or reporting a technical issue? Reach out through the support channel provided by your project administrator.',
    icon: Mail,
    sections: [
      { title: 'For account problems', body: 'Include the email address associated with your account, but never send your password, OTP or payment PIN.' },
      { title: 'For farming advice', body: 'Share relevant crop and location details only when necessary. Verify urgent or high-risk advice with a local agricultural expert.' },
    ],
  },
  '/faq': {
    eyebrow: 'COMMON QUESTIONS', title: 'Frequently asked questions',
    description: 'Quick answers to common questions about using Puthumai Ulavan.',
    icon: CircleHelp,
    sections: [
      { title: 'Can I use the app with weak internet?', body: 'Some previously loaded content may remain available. Live AI, weather, market data and server updates require a connection. Save important information before going offline.' },
      { title: 'Are crop recommendations guaranteed?', body: 'No. Recommendations are decision-support information and may not reflect every local condition. Consider soil testing and local agricultural guidance.' },
      { title: 'What should I do if a page fails?', body: 'Check your connection, retry once, and try again later. If the issue continues, contact support and include the page name and approximate time.' },
      { title: 'How do I protect my account?', body: 'Use a unique password, keep verification codes private, and sign out on shared devices.' },
    ],
  },
  '/help': {
    eyebrow: 'SUPPORT', title: 'How can we help?',
    description: 'Find guidance for your farm profile, crop tools, expenses, reports, account access and connection issues.',
    icon: BookOpen, actions: [{ label: 'View FAQs', to: '/faq', primary: true }, { label: 'Contact support', to: '/contact' }],
    sections: [
      { title: 'Account and profile', body: 'Use Profile and Settings in your dashboard to review available account and preference controls.' },
      { title: 'Farm tools', body: 'Open the relevant dashboard section for crop recommendations, crop lifecycle, expenses or farm reports.' },
      { title: 'Technical issues', body: 'Record the error message, page URL and whether you were online or offline before contacting support.' },
    ],
  },
  '/blog': {
    eyebrow: 'LEARNING', title: 'Farming resources',
    description: 'A place for practical farming guides and product updates. New articles will appear here when published by the project team.',
    icon: BookOpen,
    sections: [{ title: 'Use trusted sources', body: 'For time-sensitive advisories, pest outbreaks, weather warnings and government benefits, confirm details with official sources and local agricultural officers.' }],
  },
  '/reviews': {
    eyebrow: 'FEEDBACK', title: 'Farmer feedback',
    description: 'Your feedback helps the team improve the farming experience. We do not display invented testimonials or ratings.',
    icon: CheckCircle2,
    actions: [{ label: 'Send feedback', to: '/contact', primary: true }],
  },
  '/privacy': {
    eyebrow: 'LEGAL', title: 'Privacy policy',
    description: 'This page is a privacy-policy entry point. Before production launch, the project owner must publish a policy that accurately describes the data collected by the deployed application and its configured services.',
    icon: ShieldCheck,
    sections: [
      { title: 'Data minimization', body: 'Collect only information needed to provide the service, and explain why it is collected.' },
      { title: 'Storage and sharing', body: 'Document the actual database, hosting providers, analytics and AI services used, including retention and sharing practices.' },
      { title: 'Your choices', body: 'Explain how users can request access, correction or deletion, and provide a working contact channel.' },
      { title: 'Important before launch', body: 'This template is not legal advice and must be reviewed against the real production implementation and applicable law.' },
    ],
  },
  '/terms': {
    eyebrow: 'LEGAL', title: 'Terms and conditions',
    description: 'These terms explain the expected use of Puthumai Ulavan. The project owner should review and approve a legally complete version before production launch.',
    icon: FileText,
    sections: [
      { title: 'Responsible use', body: 'Use the service lawfully, protect your credentials and do not attempt to access another person’s account or data.' },
      { title: 'Information quality', body: 'Digital farming tools provide information to support decisions; they do not guarantee crop yield, market prices, scheme eligibility or outcomes.' },
      { title: 'Service availability', body: 'Some features depend on internet connectivity and third-party data providers and may be temporarily unavailable.' },
      { title: 'Important before launch', body: 'Have the project owner review these terms for the actual product, jurisdiction and business model.' },
    ],
  },
  '/cookies': {
    eyebrow: 'PRIVACY', title: 'Cookie and storage preferences',
    description: 'Puthumai Ulavan may use browser storage to remember preferences or support offline features. The actual storage used should be documented by the project owner.',
    icon: ShieldCheck,
    sections: [{ title: 'Manage your browser data', body: 'Clearing site data may sign you out or remove locally saved information. Synchronize pending changes first whenever possible.' }],
  },
  '/accessibility': {
    eyebrow: 'INCLUSIVE DESIGN', title: 'Accessibility statement',
    description: 'We aim to make Puthumai Ulavan usable across screen sizes and input methods, with readable content, keyboard access and clear feedback.',
    icon: CheckCircle2,
    sections: [{ title: 'Report an accessibility issue', body: 'Tell support which page you were using, what you were trying to do and which device or assistive technology was involved.' }],
  },
  '/data-consent': {
    eyebrow: 'YOUR DATA', title: 'Data and consent information',
    description: 'Before submitting personal or farm information, review why the application needs it and how it will be used.',
    icon: ShieldCheck,
    sections: [{ title: 'Share only what is needed', body: 'Avoid entering passwords, payment PINs or unrelated sensitive personal information into farming tools or AI prompts.' }],
  },
  '/system-status': {
    eyebrow: 'SERVICE HEALTH', title: 'System status',
    description: 'This page provides a place for service availability updates. Live monitoring is not connected here, so this page cannot confirm real-time system health.',
    icon: Wrench,
    sections: [{ title: 'Troubleshooting', body: 'If a feature is unavailable, check your connection and retry later. Contact support if the problem persists.' }],
  },
  '/maintenance': {
    eyebrow: 'TEMPORARILY UNAVAILABLE', title: 'We’re making improvements',
    description: 'Puthumai Ulavan is temporarily unavailable for maintenance. Please try again shortly.',
    icon: Wrench, actions: [{ label: 'Try again', to: '/', primary: true }],
  },
  '/offline': {
    eyebrow: 'CONNECTION', title: 'You’re offline',
    description: 'Your device cannot currently reach the internet. Previously cached pages may still be available, but live weather, AI advice and remote updates need a connection.',
    icon: CloudOff, actions: [{ label: 'Retry connection', to: '/dashboard/offline', primary: true }, { label: 'Go to home', to: '/' }],
    sections: [{ title: 'Before continuing', body: 'Keep unsynchronized farm notes on this device and avoid repeating payment or submission actions until you can confirm their status.' }],
  },
  '/network-error': {
    eyebrow: 'CONNECTION ERROR', title: 'Unable to connect',
    description: 'The request could not reach the service. Check your signal or Wi-Fi, then retry.',
    icon: Wifi, actions: [{ label: 'Retry', to: '/', primary: true }, { label: 'Help center', to: '/help' }],
  },
  '/session-expired': {
    eyebrow: 'ACCOUNT SECURITY', title: 'Your session has expired',
    description: 'For your security, sign in again to continue. Unsaved changes may not have been submitted.',
    icon: ShieldCheck, actions: [{ label: 'Sign in', to: '/login', primary: true }],
  },
  '/link-expired': {
    eyebrow: 'LINK EXPIRED', title: 'This link is no longer valid',
    description: 'The link may have expired or already been used. Return to the sign-in flow to request a new one.',
    icon: Clock3, actions: [{ label: 'Back to sign in', to: '/login', primary: true }],
  },
  '/account-suspended': {
    eyebrow: 'ACCOUNT ACCESS', title: 'Account access is restricted',
    description: 'If you believe this is a mistake, contact the project support team for help.',
    icon: ShieldCheck, actions: [{ label: 'Contact support', to: '/contact', primary: true }],
  },
  '/unsubscribe': {
    eyebrow: 'COMMUNICATIONS', title: 'Manage email updates',
    description: 'To stop receiving optional updates, use the unsubscribe link in the email you received or contact support. No subscription change is made from this informational page.',
    icon: Mail, actions: [{ label: 'Contact support', to: '/contact', primary: true }],
  },
  '/unsupported-browser': {
    eyebrow: 'BROWSER COMPATIBILITY', title: 'Please update your browser',
    description: 'For better security and compatibility, use a current version of Chrome, Edge, Firefox or Safari.',
    icon: Wrench, actions: [{ label: 'Return home', to: '/', primary: true }],
  },
  '/400': { title: 'Invalid request', description: 'The request could not be understood. Check the information and try again.', icon: AlertTriangle, actions: [{ label: 'Return home', to: '/', primary: true }] },
  '/401': { title: 'Sign in required', description: 'Sign in to access this part of Puthumai Ulavan.', icon: ShieldCheck, actions: [{ label: 'Sign in', to: '/login', primary: true }] },
  '/403': { title: 'Access denied', description: 'You do not have permission to view this page. If you think you should have access, contact support.', icon: ShieldCheck, actions: [{ label: 'Go to dashboard', to: '/dashboard', primary: true }, { label: 'Contact support', to: '/contact' }] },
  '/404': { title: 'Page not found', description: 'We couldn’t find the page you were looking for. It may have moved or the address may be incorrect.', icon: FileText, actions: [{ label: 'Go home', to: '/', primary: true }, { label: 'Open help center', to: '/help' }] },
  '/408': { title: 'Request timed out', description: 'The request took too long. Check your connection and try again.', icon: Clock3, actions: [{ label: 'Retry', to: '/', primary: true }] },
  '/429': { title: 'Too many requests', description: 'Please wait a little before trying again.', icon: Clock3, actions: [{ label: 'Go home', to: '/', primary: true }] },
  '/500': { title: 'Something went wrong', description: 'An unexpected server error occurred. Try again later. Your last action may not have completed, so check its status before repeating it.', icon: AlertTriangle, actions: [{ label: 'Try again', to: '/', primary: true }, { label: 'System status', to: '/system-status' }] },
  '/502': { title: 'Service connection problem', description: 'A service needed to complete this request did not respond correctly. Please try again later.', icon: AlertTriangle, actions: [{ label: 'Try again', to: '/', primary: true }] },
  '/503': { title: 'Service temporarily unavailable', description: 'The service is temporarily unavailable. Please try again shortly.', icon: Wrench, actions: [{ label: 'System status', to: '/system-status', primary: true }, { label: 'Go home', to: '/' }] },
  '/504': { title: 'Service timed out', description: 'A service took too long to respond. Check your connection and try again later.', icon: Clock3, actions: [{ label: 'Try again', to: '/', primary: true }] },

  '/how-it-works': {
    eyebrow: 'GET STARTED', title: 'How Puthumai Ulavan works',
    description: 'Start with your farm profile, add crop and field details, then use planning and record-keeping tools to organize your season.',
    icon: BookOpen, actions: [{ label: 'Create an account', to: '/signup', primary: true }, { label: 'Explore features', to: '/features' }],
    sections: [
      { title: '1. Set up your farm', body: 'Enter the location, field size, soil information and water source that you know. You can update details as you learn more.' },
      { title: '2. Plan and record', body: 'Review crop options and create farm tasks. Record expenses and important activities throughout the season.' },
      { title: '3. Review and verify', body: 'Use reports, weather information and advisory tools as decision support. Verify important recommendations locally.' },
    ],
  },
  '/for-farmers': {
    eyebrow: 'MADE FOR FARM WORK', title: 'A practical digital companion for farmers',
    description: 'Keep key farm details, crop plans, costs and seasonal records together in one mobile-friendly workspace.',
    icon: Leaf, actions: [{ label: 'Get started', to: '/signup', primary: true }, { label: 'View tools', to: '/features' }],
    sections: [
      { title: 'Small and large farms', body: 'Use the available farm profile and record tools to organize the information relevant to your operation.' },
      { title: 'Built for the field', body: 'Responsive layouts and connectivity-aware messaging help users understand when a feature needs the internet.' },
    ],
  },
  '/crop-calendar': {
    eyebrow: 'SEASON PLANNING', title: 'Crop calendar and seasonal planning',
    description: 'Plan important crop activities around your crop, sowing date, local season and field conditions.',
    icon: BookOpen, actions: [{ label: 'Open crop lifecycle', to: '/dashboard/crop-lifecycle', primary: true }],
    sections: [
      { title: 'Plan milestones', body: 'Track land preparation, sowing, irrigation, nutrient management, scouting and harvest dates.' },
      { title: 'Use local guidance', body: 'Crop timing varies by district, variety, weather and irrigation. Confirm schedules with local agricultural experts.' },
    ],
  },
  '/soil-health-guide': {
    eyebrow: 'SOIL MANAGEMENT', title: 'Understand your soil health',
    description: 'Use soil test results and field observations to make better-informed soil management decisions.',
    icon: Leaf, actions: [{ label: 'Open farm health', to: '/dashboard/farm-health', primary: true }],
    sections: [
      { title: 'Start with a soil test', body: 'Record pH and available nutrient values from a reliable laboratory report when possible.' },
      { title: 'Avoid guesswork', body: 'Do not apply fertilizer solely from a generic online suggestion. Consider crop needs, test results and local recommendations.' },
    ],
  },
  '/water-management': {
    eyebrow: 'WATER STEWARDSHIP', title: 'Plan water use carefully',
    description: 'Organize irrigation observations and make water decisions based on crop stage, soil moisture, rainfall and local conditions.',
    icon: Leaf, actions: [{ label: 'Check weather', to: '/dashboard/weather', primary: true }],
    sections: [
      { title: 'Observe before irrigating', body: 'Consider recent rain, soil moisture, crop stage and the irrigation method available on your farm.' },
      { title: 'Keep records', body: 'Record irrigation dates and issues to compare practices across the season.' },
    ],
  },
  '/pest-management': {
    eyebrow: 'CROP PROTECTION', title: 'Crop pest and disease management',
    description: 'Use careful field scouting and verified agricultural guidance to identify crop problems before choosing a treatment.',
    icon: AlertTriangle, actions: [{ label: 'Open crop health', to: '/dashboard/crop-health', primary: true }],
    sections: [
      { title: 'Inspect and document', body: 'Record affected crop, growth stage, symptoms, spread pattern and the date first noticed. Clear photos can help an expert review the issue.' },
      { title: 'Use safe, verified guidance', body: 'Do not apply pesticides based only on an unverified image or AI answer. Follow the product label and local agricultural advice.' },
    ],
  },
  '/market-prices': {
    eyebrow: 'MARKET INFORMATION', title: 'Check market information',
    description: 'Review available market information as one input into your selling decision. Prices can vary by market, grade, quantity and date.',
    icon: BookOpen, actions: [{ label: 'Open market intelligence', to: '/dashboard/market-intelligence', primary: true }],
    sections: [
      { title: 'Verify the source and date', body: 'Check the market, commodity grade, unit and update time before relying on a quoted price.' },
      { title: 'Compare net returns', body: 'Consider transport, handling, commissions, quality and payment terms—not just the headline price.' },
    ],
  },
  '/government-schemes': {
    eyebrow: 'PUBLIC BENEFITS', title: 'Government schemes for farmers',
    description: 'Explore scheme information and verify current eligibility, deadlines and application steps through official government sources.',
    icon: FileText, actions: [{ label: 'Open scheme directory', to: '/dashboard/schemes', primary: true }],
    sections: [
      { title: 'Check official details', body: 'Rules and application windows may change. Confirm details with the official scheme portal or your local agriculture office.' },
      { title: 'Protect your information', body: 'Use official channels for applications and never share OTPs, passwords or payment PINs with intermediaries.' },
    ],
  },
  '/farmer-resources': {
    eyebrow: 'LEARN', title: 'Farmer learning resources',
    description: 'Use reliable learning materials to strengthen crop planning, soil care, water management and farm record keeping.',
    icon: BookOpen, actions: [{ label: 'Browse farming guides', to: '/blog', primary: true }, { label: 'Get help', to: '/help' }],
    sections: [
      { title: 'Prefer trusted sources', body: 'Look for resources from agricultural universities, KVKs, ICAR institutions and official departments.' },
      { title: 'Apply locally', body: 'Adapt general guidance to your crop variety, soil, climate and local recommendations.' },
    ],
  },
  '/community': {
    eyebrow: 'FARMER CONNECTIONS', title: 'Farmer community',
    description: 'A future home for shared learning and farmer discussions. Community posting and messaging are not enabled on this informational page.',
    icon: Leaf, actions: [{ label: 'Send feedback', to: '/feedback', primary: true }],
    sections: [
      { title: 'Share responsibly', body: 'Avoid posting personal documents, precise private information or unverified claims about crop treatments.' },
      { title: 'Verify advice', body: 'Experiences from other farmers can be useful, but high-impact agronomic decisions should be checked with qualified local experts.' },
    ],
  },
  '/success-stories': {
    eyebrow: 'FARMER OUTCOMES', title: 'Farmer stories and outcomes',
    description: 'This page is ready for verified farmer stories when participants have given permission. No testimonials or yield improvements are invented here.',
    icon: CheckCircle2,
    sections: [
      { title: 'Evidence first', body: 'Any published story should include consent, relevant context, and a clear distinction between personal experience and typical results.' },
      { title: 'Share your experience', body: 'Contact the project team if you want to provide feedback or participate in a documented case study.' },
    ],
    actions: [{ label: 'Contact the team', to: '/contact', primary: true }],
  },
  '/report-issue': {
    eyebrow: 'TECHNICAL SUPPORT', title: 'Report a technical issue',
    description: 'Help the team investigate a problem by noting what happened, which page you were using and whether your connection was stable.',
    icon: AlertTriangle, actions: [{ label: 'Contact support', to: '/contact', primary: true }, { label: 'Visit help center', to: '/help' }],
    sections: [
      { title: 'Include useful details', body: 'Share the page URL, approximate time, device/browser and the exact error message.' },
      { title: 'Keep credentials private', body: 'Never include passwords, OTPs, access tokens, payment PINs or private keys in an issue report.' },
    ],
  },
  '/security': {
    eyebrow: 'ACCOUNT SAFETY', title: 'Security and account protection',
    description: 'Learn practical ways to protect your Puthumai Ulavan account and the farm information associated with it.',
    icon: ShieldCheck, actions: [{ label: 'Account settings', to: '/dashboard/settings', primary: true }],
    sections: [
      { title: 'Protect sign-in access', body: 'Use a unique password, keep verification codes private and sign out when using a shared device.' },
      { title: 'Report suspicious activity', body: 'If you notice unexpected account activity, stop sharing information and contact support promptly.' },
    ],
  },
  '/data-export': {
    eyebrow: 'YOUR FARM RECORDS', title: 'Export your farm data',
    description: 'This page explains the data-export request path. A self-service export is not provided by this informational page.',
    icon: FileText, actions: [{ label: 'Contact support', to: '/contact', primary: true }],
    sections: [
      { title: 'Request an export', body: 'Contact support from your registered email and describe the records you need. The team must verify your identity before sharing private data.' },
      { title: 'Keep a local copy', body: 'For important farm records, maintain your own secure backup where the application provides an appropriate export or download option.' },
    ],
  },
  '/delete-account': {
    eyebrow: 'ACCOUNT CONTROL', title: 'Request account deletion',
    description: 'You can contact the project team to request account deletion. This page does not automatically delete your account or farm records.',
    icon: ShieldCheck, actions: [{ label: 'Contact support', to: '/contact', primary: true }],
    sections: [
      { title: 'What to include', body: 'Use your registered email and ask for account deletion. Do not send your password or verification codes.' },
      { title: 'Review data implications', body: 'The team should explain what will be deleted, what must be retained by law and whether deletion can be reversed.' },
    ],
  },
  '/feedback': {
    eyebrow: 'HELP US IMPROVE', title: 'Share feedback',
    description: 'Tell the Puthumai Ulavan team what worked well, what was confusing and what would make farm work easier.',
    icon: CheckCircle2, actions: [{ label: 'Send feedback to support', to: '/contact', primary: true }],
    sections: [
      { title: 'Useful feedback', body: 'Mention the feature, what you expected, what happened and your device or browser if the issue is technical.' },
      { title: 'Protect your privacy', body: 'Do not include passwords, OTPs, payment PINs or unrelated personal information.' },
    ],
  },
  '/how-we-use-data': {
    eyebrow: 'TRANSPARENCY', title: 'How farm data is used',
    description: 'Farm details can help organize crop plans, reports and advisory experiences. The project owner must document actual production data flows before launch.',
    icon: ShieldCheck, actions: [{ label: 'Privacy policy', to: '/privacy', primary: true }, { label: 'Data choices', to: '/data-consent' }],
    sections: [
      { title: 'Use data for clear purposes', body: 'Explain why each category of farm or account information is needed and which services process it.' },
      { title: 'Verify actual implementation', body: 'This overview is informational and must be aligned with the deployed application, database, AI provider and retention settings.' },
    ],
  },
  '/app-download': {
    eyebrow: 'USE ON THE GO', title: 'Use Puthumai Ulavan on your phone',
    description: 'Puthumai Ulavan is designed for responsive use on mobile browsers. Native app availability should only be advertised once official app-store listings exist.',
    icon: Leaf, actions: [{ label: 'Open the web app', to: '/login', primary: true }],
    sections: [
      { title: 'Mobile-friendly access', body: 'Open the website in your phone browser and sign in. Availability of offline features depends on what has been cached and synchronized.' },
      { title: 'Avoid unofficial downloads', body: 'Install only from a verified official source if a native app is published in the future.' },
    ],
  },
  '/service-guidelines': {
    eyebrow: 'RESPONSIBLE USE', title: 'Responsible use guidelines',
    description: 'Use Puthumai Ulavan as a planning and record-keeping companion, while validating high-impact farming decisions with trusted local sources.',
    icon: ShieldCheck, actions: [{ label: 'Explore features', to: '/features', primary: true }],
    sections: [
      { title: 'Advisory is not a guarantee', body: 'Weather, crop health, yield and market information may be incomplete or delayed and cannot guarantee outcomes.' },
      { title: 'Protect people and crops', body: 'Follow product labels, local regulations and qualified agricultural advice for pesticide, fertilizer and other safety-sensitive decisions.' },
    ],
  },
  '/accessibility-help': {
    eyebrow: 'ACCESSIBILITY SUPPORT', title: 'Accessibility help',
    description: 'If you have difficulty using a page, contact support with the page name and the task you were trying to complete.',
    icon: CheckCircle2, actions: [{ label: 'Accessibility statement', to: '/accessibility', primary: true }, { label: 'Contact support', to: '/contact' }],
    sections: [
      { title: 'Helpful details', body: 'Tell us your device, browser, keyboard or assistive technology and the specific barrier you encountered.' },
      { title: 'Keep it simple', body: 'You do not need to share medical details to report an accessibility problem.' },
    ],
  },
  '/data-correction': {
    eyebrow: 'YOUR INFORMATION', title: 'Correct your account or farm details',
    description: 'Keep your profile and farm information accurate. Use the relevant profile settings where available, or contact support for help.',
    icon: FileText, actions: [{ label: 'Open profile', to: '/dashboard/profile', primary: true }, { label: 'Contact support', to: '/contact' }],
    sections: [
      { title: 'Check before saving', body: 'Confirm units, dates, field sizes and soil-test values before updating records.' },
      { title: 'Ask for help', body: 'For information you cannot edit yourself, contact support from your registered account.' },
    ],
  },
  '/weather-guidance': {
    eyebrow: 'WEATHER AWARENESS', title: 'Use weather information wisely',
    description: 'Weather forecasts can support planning, but local conditions may differ and forecasts can change quickly.',
    icon: Leaf, actions: [{ label: 'Open weather', to: '/dashboard/weather', primary: true }],
    sections: [
      { title: 'Check update time', body: 'Review the forecast location and timestamp before scheduling irrigation, spraying or field work.' },
      { title: 'Follow official alerts', body: 'During severe weather, prioritize official local warnings and emergency guidance.' },
    ],
  },
  '/expense-guidance': {
    eyebrow: 'FARM FINANCE RECORDS', title: 'Track farm costs and income',
    description: 'Consistent records help you understand input costs, labour, sales and seasonal profitability.',
    icon: FileText, actions: [{ label: 'Open expense tracker', to: '/dashboard/expenses', primary: true }],
    sections: [
      { title: 'Record expenses promptly', body: 'Capture the date, category, amount and field or crop association where available.' },
      { title: 'Review before decisions', body: 'Reports depend on the completeness and accuracy of the records entered by the farmer.' },
    ],
  },
  '/yield-estimates': {
    eyebrow: 'HARVEST PLANNING', title: 'Understand yield estimates',
    description: 'Yield estimates are planning aids, not guaranteed harvest quantities. Actual yield depends on crop, variety, weather, soil, management and other factors.',
    icon: Leaf, actions: [{ label: 'Open yield prediction', to: '/dashboard/yield-prediction', primary: true }],
    sections: [
      { title: 'Use realistic inputs', body: 'Review field area, crop, season and the source of any historical yield data.' },
      { title: 'Update as the season changes', body: 'Use field observations and verified local advice to revise plans as conditions change.' },
    ],
  },
  '/crop-planning': {
    eyebrow: 'PLAN YOUR SEASON', title: 'Crop planning workspace',
    description: 'Compare crop options against your soil, water availability, season, field size and local growing conditions.',
    icon: Leaf, actions: [{ label: 'Get crop recommendations', to: '/dashboard/crops', primary: true }],
    sections: [
      { title: 'Use farm-specific details', body: 'More accurate soil and field information can help make planning more relevant, but does not guarantee a successful crop.' },
      { title: 'Check local suitability', body: 'Validate seed variety, sowing window and input recommendations with local agricultural sources.' },
    ],
  },
  '/farm-records': {
    eyebrow: 'ORGANIZE YOUR FARM', title: 'Farm records and history',
    description: 'Keep farm profile details and seasonal records organized so you can review changes over time.',
    icon: FileText, actions: [{ label: 'Open farm profile', to: '/dashboard/farm-profile', primary: true }, { label: 'View reports', to: '/dashboard/farm-report' }],
    sections: [
      { title: 'Record key activities', body: 'Capture planting, irrigation, input use, scouting, harvest and sales when those records are available.' },
      { title: 'Use records for learning', body: 'Comparisons are only as reliable as the data entered and the consistency of units and dates.' },
    ],
  },

};

export default function ProfessionalPage() {
  const location = useLocation();
  const page = pages[location.pathname] ?? pages['/404'];
  const Icon = page.icon ?? Leaf;

  return (
    <main className="min-h-screen bg-[#f7f9f4] text-slate-900">
      <header className="border-b border-emerald-100 bg-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-4 sm:px-6">
          <Link to="/" className="inline-flex items-center gap-2 font-bold tracking-tight text-emerald-900">
            <span className="grid h-9 w-9 place-items-center rounded-xl bg-emerald-700 text-white"><Leaf size={20} /></span>
            <span>புதுமை உழவன் <span className="block text-xs font-medium tracking-normal text-slate-500">Puthumai Ulavan</span></span>
          </Link>
          <nav className="flex items-center gap-3 text-sm">
            <Link className="hidden text-slate-600 hover:text-emerald-800 sm:inline" to="/help">Help</Link>
            <Link className="rounded-lg border border-emerald-200 px-3 py-2 font-semibold text-emerald-800 hover:bg-emerald-50" to="/login">Sign in</Link>
          </nav>
        </div>
      </header>

      <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6 sm:py-16">
        <div className="rounded-3xl border border-emerald-100 bg-white p-6 shadow-sm sm:p-10">
          {page.eyebrow && <p className="mb-3 text-xs font-bold uppercase tracking-[0.18em] text-emerald-700">{page.eyebrow}</p>}
          <div className="mb-5 grid h-14 w-14 place-items-center rounded-2xl bg-emerald-50 text-emerald-800"><Icon size={27} /></div>
          <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">{page.title}</h1>
          <p className="mt-4 max-w-2xl text-base leading-7 text-slate-600">{page.description}</p>

          {page.sections?.length ? (
            <div className="mt-8 grid gap-4 sm:grid-cols-2">
              {page.sections.map((section) => (
                <section key={section.title} className="rounded-2xl border border-slate-100 bg-slate-50 p-5">
                  <h2 className="font-semibold text-slate-900">{section.title}</h2>
                  <p className="mt-2 text-sm leading-6 text-slate-600">{section.body}</p>
                </section>
              ))}
            </div>
          ) : null}

          <div className="mt-8 flex flex-wrap gap-3">
            {(page.actions ?? [{ label: 'Go to home', to: '/', primary: true }]).map((action) => (
              <Link key={action.label} to={action.to} className={action.primary
                ? 'inline-flex items-center gap-2 rounded-xl bg-emerald-700 px-5 py-3 text-sm font-semibold text-white transition hover:bg-emerald-800 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2'
                : 'inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2'}>
                {action.primary ? <ArrowRight size={16} /> : <ArrowLeft size={16} />}
                {action.label}
              </Link>
            ))}
          </div>
        </div>
        <footer className="mt-8 flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-xs text-slate-500">
          <Link className="hover:text-emerald-800" to="/privacy">Privacy</Link>
          <Link className="hover:text-emerald-800" to="/terms">Terms</Link>
          <Link className="hover:text-emerald-800" to="/accessibility">Accessibility</Link>
          <Link className="hover:text-emerald-800" to="/contact">Contact</Link>
          <span>© {new Date().getFullYear()} Puthumai Ulavan</span>
        </footer>
      </div>
    </main>
  );
}
