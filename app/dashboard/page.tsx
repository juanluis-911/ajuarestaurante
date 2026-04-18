import { getUserContext, getRedirectByRole } from '@/lib/auth/get-user-context'
import { redirect } from 'next/navigation'

export default async function DashboardRedirect() {
  const ctx = await getUserContext()
  redirect(getRedirectByRole(ctx))
}
