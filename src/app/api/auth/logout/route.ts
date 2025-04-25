import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export async function POST() {
  try {
    // Clear the authentication cookie by setting its maxAge to 0
    cookies().set('auth_token', '', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      path: '/',
      maxAge: 0, // Expire the cookie immediately
    });

    return NextResponse.json({ message: 'Logout successful' });
  } catch (error) {
    console.error('Logout failed:', error);
    return NextResponse.json({ message: 'Internal server error during logout' }, { status: 500 });
  }
}
