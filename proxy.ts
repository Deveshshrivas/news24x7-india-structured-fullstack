import {NextResponse} from 'next/server';

// Apply these even to cached homepage HTML; the hosting proxy repeats them.
export function proxy(){
 const response=NextResponse.next();
 response.headers.set('X-Content-Type-Options','nosniff');
 response.headers.set('X-Frame-Options','SAMEORIGIN');
 response.headers.set('Referrer-Policy','strict-origin-when-cross-origin');
 response.headers.set('Permissions-Policy','camera=(), microphone=(), geolocation=()');
 return response;
}
export const config={matcher:['/']};
