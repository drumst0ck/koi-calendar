import {getRequestConfig} from 'next-intl/server';
import {cookies} from 'next/headers';

export default getRequestConfig(async () => {
  // Get locale from cookies or use default
  const cookieStore = await cookies();
  const locale = cookieStore.get('locale')?.value || 'es';
  
  // Validate that the locale is supported
  const supportedLocales = ['es', 'en', 'fr'];
  const validLocale = supportedLocales.includes(locale) ? locale : 'es';
  
  return {
    locale: validLocale,
    messages: (await import(`../messages/${validLocale}.json`)).default
  };
});