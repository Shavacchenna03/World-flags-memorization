import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';
import { getSupabaseConfig } from './config';

/**
 * Refreshes auth tokens in the request lifecycle and manages route protection.
 */
export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  });

  const { url, key, isConfigured } = getSupabaseConfig();
  if (!isConfigured) {
    return supabaseResponse;
  }

  const supabase = createServerClient(url, key, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
        supabaseResponse = NextResponse.next({
          request,
        });
        cookiesToSet.forEach(({ name, value, options }) =>
          supabaseResponse.cookies.set(name, value, options)
        );
      },
    },
  });

  // IMPORTANT: getUser() securely verifies token with Supabase Auth backend
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const path = request.nextUrl.pathname;

  // 1. Redirect authenticated users away from guest auth forms to learning dashboard
  if (user && (path === '/login' || path === '/signup' || path === '/forgot-password')) {
    const redirectUrl = request.nextUrl.clone();
    redirectUrl.pathname = '/learn';
    return NextResponse.redirect(redirectUrl);
  }

  // 2. Protect /reset-password: user must have an active session or a code query param
  if (!user && path === '/reset-password') {
    const hasCode = request.nextUrl.searchParams.has('code');
    if (!hasCode) {
      const redirectUrl = request.nextUrl.clone();
      redirectUrl.pathname = '/login';
      return NextResponse.redirect(redirectUrl);
    }
  }

  return supabaseResponse;
}
