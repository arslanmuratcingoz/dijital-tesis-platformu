import { NextResponse } from 'next/server';
import { createAnonSupabase, createServiceSupabase } from '@/lib/supabaseServer';
import { env } from '@/lib/env';

export async function POST(request: Request) {
  try {
    const authHeader = request.headers.get('authorization') || '';
    const token = authHeader.replace(/^Bearer\s+/i, '').trim();
    if (!token) return NextResponse.json({ error: 'Oturum token eksik.' }, { status: 401 });

    const anon = createAnonSupabase();
    const { data: userData, error: userError } = await anon.auth.getUser(token);
    if (userError || !userData.user) return NextResponse.json({ error: 'Oturum doğrulanamadı.' }, { status: 401 });

    const user = userData.user;
    const email = (user.email || '').toLowerCase();
    const role = env.adminEmails.includes(email) ? 'admin' : 'editor';
    const fullName = typeof user.user_metadata?.full_name === 'string' ? user.user_metadata.full_name : email.split('@')[0];
    const service = createServiceSupabase();

    const { error } = await service.from('profiles').upsert({
      id: user.id,
      email,
      username: fullName,
      full_name: fullName,
      role,
      updated_at: new Date().toISOString()
    }, { onConflict: 'id' });

    if (error) throw error;
    return NextResponse.json({ ok: true, role });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Profil oluşturulamadı.' }, { status: 500 });
  }
}
