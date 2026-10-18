import { NavLink } from 'react-router-dom';
import Icon from '@/components/ui/Icon';
import { bottomNav } from '@/data/navData';

export default function BottomNav() {
  return (
    <nav aria-label="Primary mobile navigation" className="lg:hidden fixed bottom-0 inset-x-0 z-40 px-3 pb-[max(0.5rem,env(safe-area-inset-bottom))] pt-2">
      <div className="mx-auto flex max-w-lg items-stretch justify-around rounded-[1.35rem] border border-[#E2E9DF] bg-white/95 px-1.5 py-1.5 shadow-[0_10px_35px_rgba(22,59,40,0.14)] backdrop-blur-xl">
        {bottomNav.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            end={item.path === '/dashboard'}
            className="relative flex min-h-[3.45rem] flex-1 min-w-0 flex-col items-center justify-center gap-1 rounded-xl px-1 py-1.5 transition-colors duration-200"
          >
            {({ isActive }) => (
              <>
                {isActive && (
                  <div className="absolute inset-0 rounded-xl bg-[#EAF3E5]" />
                )}
                <Icon
                  name={item.icon}
                  size={22}
                  className={`relative z-10 transition-transform duration-200 ${isActive ? 'text-[#28633B] -translate-y-0.5' : 'text-[#778478]'}`}
                  strokeWidth={isActive ? 2.2 : 1.8}
                />
                <span
                  className={`relative z-10 w-full truncate text-center text-[10px] leading-none transition-colors ${
                    isActive ? 'font-bold text-[#28633B]' : 'font-medium text-[#778478]'
                  }`}
                >
                  {item.label}
                </span>
              </>
            )}
          </NavLink>
        ))}
      </div>
    </nav>
  );
}
