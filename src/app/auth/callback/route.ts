import { NextResponse } from 'next/server';
import { createClient } from '../../../lib/supabase/server';
import { sanitizeRedirectUrl } from '../../../lib/supabase/redirect';

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');
  const next = searchParams.get('next') ?? '/learn';
  const safeNext = sanitizeRedirectUrl(next, '/learn');

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error) {
      const forwardedHost = request.headers.get('x-forwarded-host');
      const isLocalEnv = process.env.NODE_ENV === 'development';

      if (isLocalEnv) {
        return NextResponse.redirect(`${origin}${safeNext}`);
      } else if (forwardedHost) {
        return NextResponse.redirect(`https://${forwardedHost}${safeNext}`);
      } else {
        return NextResponse.redirect(`${origin}${safeNext}`);
      }
    }
  }

  // If code is missing or exchange failed, redirect to login with a clear error indication
  return NextResponse.redirect(`${origin}/login?error=auth-callback-failed`);
}
