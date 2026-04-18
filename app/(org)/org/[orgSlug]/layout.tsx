import { redirect } from 'next/navigation'
import { getUserContext, canAccessOrgBySlug } from '@/lib/auth/get-user-context'
import { AppHeader } from '@/components/layout/app-header'
import { OrgNav } from '@/components/layout/org-nav'

interface Props {
  children: React.ReactNode
  params: Promise<{ orgSlug: string }>
}

export default async function OrgSlugLayout({ children, params }: Props) {
  const { orgSlug } = await params
  const ctx = await getUserContext()

  if (!canAccessOrgBySlug(ctx, orgSlug)) redirect('/login')

  const dashboardHref = ctx.isSuperAdmin ? '/admin/dashboard' : `/org/${orgSlug}/dashboard`

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <AppHeader userName={ctx.full_name} dashboardHref={dashboardHref} />
      <OrgNav orgSlug={orgSlug} />
      <main className="flex-1 p-4 md:p-6">{children}</main>
    </div>
  )
}
