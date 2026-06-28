import { redirect } from 'next/navigation';
import { cookies } from 'next/headers';
import { verifyJWT } from '@/lib/auth';

export default async function IndexPage() {
  const cookieStore = await cookies();
  const token = cookieStore.get('token')?.value;

  if (!token) {
    redirect('/login');
  }

  const payload = await verifyJWT(token);
  if (!payload) {
    redirect('/login');
  }

  const mockRole = cookieStore.get('mock_role')?.value;
  const activeRole = (payload.role === 'SUPER_ADMIN' && mockRole) ? mockRole : payload.role;

  if (activeRole === 'SUPER_ADMIN') {
    redirect('/admin');
  } else if (activeRole === 'DOCTOR') {
    redirect('/doctor');
  } else if (activeRole === 'RECEPTIONIST') {
    redirect('/receptionist');
  } else {
    redirect('/login');
  }
}
