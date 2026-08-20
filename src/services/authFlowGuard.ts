export function getSafeRedirect(next:string|null|undefined){if(!next||!next.startsWith('/')||next.startsWith('//'))return '/dashboard';return next}
export function isVerifiedUser(user:{email_confirmed_at?:string|null}|null|undefined){return Boolean(user?.email_confirmed_at)}
