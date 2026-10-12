import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

const SITE_URL = 'https://puthumai-ulavan.vercel.app';

type SeoEntry = { title: string; description: string };

const indexablePages: Record<string, SeoEntry> = {
  '/': {
    title: 'Puthumai Ulavan | AI-powered smart farming',
    description: 'Plan crops, organize farm records, track expenses and explore weather and farming insights with Puthumai Ulavan, a digital farming companion.',
  },
  '/pages': {
    title: 'All Website Pages | Puthumai Ulavan',
    description: 'Find Puthumai Ulavan farming guides, product information, support resources and farmer workspace tools in one page directory.',
  },
  '/about': {
    title: 'About Puthumai Ulavan | Digital Farming Companion',
    description: 'Learn how Puthumai Ulavan brings farm records, crop planning, expense tracking and farming decision-support tools together.',
  },
  '/features': {
    title: 'Smart Farming Features | Puthumai Ulavan',
    description: 'Explore crop recommendations, farm records, expense tracking, seasonal planning, weather information and farming insights.',
  },
  '/how-it-works': {
    title: 'How Puthumai Ulavan Works | Smart Farming',
    description: 'Learn how to organize your farm profile, review crop options, record expenses and use farming information to plan your season.',
  },
  '/for-farmers': {
    title: 'Digital Farm Tools for Farmers | Puthumai Ulavan',
    description: 'Discover practical digital tools for farm planning, crop records, seasonal expenses and informed farming decisions.',
  },
  '/crop-calendar': {
    title: 'Crop Calendar and Seasonal Planning | Puthumai Ulavan',
    description: 'Use crop-calendar guidance to organize sowing, field activities and seasonal planning, then verify timing with local agricultural sources.',
  },
  '/soil-health-guide': {
    title: 'Soil Health Guide for Farmers | Puthumai Ulavan',
    description: 'Learn why soil testing, pH, nutrients and local agronomic guidance matter when planning crops and managing soil health.',
  },
  '/water-management': {
    title: 'Water Management for Farms | Puthumai Ulavan',
    description: 'Explore practical water-management considerations for farm planning and verify irrigation decisions against crop needs and local conditions.',
  },
  '/pest-management': {
    title: 'Responsible Pest Management | Puthumai Ulavan',
    description: 'Review responsible pest-management principles and verify treatment decisions with official agricultural guidance and product labels.',
  },
  '/market-prices': {
    title: 'Agricultural Market Price Guidance | Puthumai Ulavan',
    description: 'Learn how to compare agricultural market information by market, commodity grade, unit, date and selling costs.',
  },
  '/government-schemes': {
    title: 'Government Schemes for Farmers | Puthumai Ulavan',
    description: 'Find guidance for researching farmer schemes and verify current eligibility, deadlines and application steps through official government sources.',
  },
  '/farmer-resources': {
    title: 'Farmer Learning Resources | Puthumai Ulavan',
    description: 'Explore learning topics for crop planning, soil care, water management and farm records using trusted agricultural sources.',
  },
  '/weather-guidance': {
    title: 'Weather Guidance for Farm Planning | Puthumai Ulavan',
    description: 'Use weather information carefully when planning field work, and check forecast timestamps and official local weather alerts.',
  },
  '/expense-guidance': {
    title: 'Farm Expense Tracking Guide | Puthumai Ulavan',
    description: 'Learn how consistent records of inputs, labour, sales and seasonal costs can support farm budgeting and review.',
  },
  '/yield-estimates': {
    title: 'Understanding Crop Yield Estimates | Puthumai Ulavan',
    description: 'Understand how crop, field area, weather, soil and management affect yield estimates, which are planning aids rather than guarantees.',
  },
  '/crop-planning': {
    title: 'Crop Planning Guide | Puthumai Ulavan',
    description: 'Compare crop options using soil, water availability, season, field size and local growing conditions.',
  },
  '/farm-records': {
    title: 'Farm Records and Seasonal History | Puthumai Ulavan',
    description: 'Organize planting, input use, irrigation, harvest and sales records to review farm activities across seasons.',
  },
  '/faq': {
    title: 'Frequently Asked Questions | Puthumai Ulavan',
    description: 'Get answers about farm tools, connectivity, crop recommendations, account safety and using Puthumai Ulavan.',
  },
  '/help': {
    title: 'Help Center | Puthumai Ulavan',
    description: 'Find help with your farm profile, crop tools, expenses, reports, account access and connection issues.',
  },
  '/contact': {
    title: 'Contact Puthumai Ulavan | Support',
    description: 'Find guidance for contacting the Puthumai Ulavan project team about product questions, farming tools or technical issues.',
  },
  '/privacy': {
    title: 'Privacy Policy | Puthumai Ulavan',
    description: 'Read privacy information for Puthumai Ulavan and review how account and farm information should be handled.',
  },
  '/terms': {
    title: 'Terms and Conditions | Puthumai Ulavan',
    description: 'Review the terms for using Puthumai Ulavan and its digital farm-management and decision-support tools.',
  },
  '/accessibility': {
    title: 'Accessibility Statement | Puthumai Ulavan',
    description: 'Read accessibility information and find out how to report barriers when using Puthumai Ulavan.',
  },
};

function upsertMeta(attribute: 'name' | 'property', key: string, content: string) {
  let element = document.head.querySelector<HTMLMetaElement>(`meta[${attribute}="${key}"]`);
  if (!element) {
    element = document.createElement('meta');
    element.setAttribute(attribute, key);
    document.head.appendChild(element);
  }
  element.content = content;
}

export default function RouteSEO() {
  const { pathname } = useLocation();

  useEffect(() => {
    const normalizedPath = pathname.length > 1 ? pathname.replace(/\/+$/, '') : '/';
    const page = indexablePages[normalizedPath];
    const privateOrUnreviewed = !page || normalizedPath.startsWith('/dashboard') || normalizedPath.startsWith('/onboarding');
    const fallbackLabel = normalizedPath === '/' ? 'Home' : normalizedPath.split('/').filter(Boolean).join(' ').replace(/[-_]/g, ' ').replace(/\b\w/g, (letter) => letter.toUpperCase());
    const title = page?.title ?? `${fallbackLabel} | Puthumai Ulavan`;
    const description = page?.description ?? 'Puthumai Ulavan is a digital farming companion for farm records, crop planning and farming information.';

    document.title = title;
    upsertMeta('name', 'description', description);
    upsertMeta('name', 'robots', privateOrUnreviewed ? 'noindex, nofollow' : 'index, follow');
    upsertMeta('property', 'og:title', title);
    upsertMeta('property', 'og:description', description);
    upsertMeta('property', 'og:type', 'website');
    upsertMeta('property', 'og:site_name', 'Puthumai Ulavan');
    upsertMeta('name', 'twitter:card', 'summary_large_image');
    upsertMeta('name', 'twitter:title', title);
    upsertMeta('name', 'twitter:description', description);

    let canonical = document.head.querySelector<HTMLLinkElement>('link[rel="canonical"]');
    if (page) {
      if (!canonical) {
        canonical = document.createElement('link');
        canonical.rel = 'canonical';
        document.head.appendChild(canonical);
      }
      canonical.href = `${SITE_URL}${normalizedPath === '/' ? '/' : normalizedPath}`;
      upsertMeta('property', 'og:url', canonical.href);
    } else {
      canonical?.remove();
      document.head.querySelector('meta[property="og:url"]')?.remove();
    }
  }, [pathname]);

  return null;
}
