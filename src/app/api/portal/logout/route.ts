import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
    const cookieStore = await cookies();
    cookieStore.delete('portal_client_id');

    const redirectUrl = new URL('/portal/login', request.url);
    return NextResponse.redirect(redirectUrl);
}
