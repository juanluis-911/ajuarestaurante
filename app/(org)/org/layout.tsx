import { redirect } from 'next/navigation'
import { getUserContext } from '@/lib/auth/get-user-context'
import { AppHeader } from '@/components/layout/app-header'

export default async function OrgLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const ctx = await getUserContext()

  if (!ctx.isSuperAdmin && ctx.orgRoles.length === 0) redirect('/login')

  return (
    <div className="min-h-screen bg-gray-50">
      <AppHeader userName={ctx.full_name} />
      <main className="p-6">{children}</main>
    </div>
  )
}
