import { redirect } from 'next/navigation'
import { getUserContext } from '@/lib/auth/get-user-context'
import { AppHeader } from '@/components/layout/app-header'
import { AdminNav } from '@/components/layout/admin-nav'

export default async function SuperAdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const ctx = await getUserContext()

  if (!ctx.isSuperAdmin) redirect('/login')

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <AppHeader userName={ctx.full_name} dashboardHref="/admin/dashboard" />
      <AdminNav />
      <main className="flex-1 p-4 md:p-6">{children}</main>
    </div>
  )
}
