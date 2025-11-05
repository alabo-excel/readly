import { redirect } from 'next/navigation';

export default function Hage() {
  redirect('/auth/login');
  return null;
}