import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { secret_key } = body as { secret_key: string }

    if (!secret_key || typeof secret_key !== 'string') {
      return NextResponse.json({ valid: false, error: 'secret_key requerida' }, { status: 400 })
    }

    const response = await fetch('https://api.stripe.com/v1/account', {
      headers: {
        'Authorization': `Basic ${Buffer.from(`${secret_key}:`).toString('base64')}`,
      },
    })

    if (response.ok) {
      const data = await response.json()
      return NextResponse.json({
        valid: true,
        account: {
          id: data.id,
          email: data.email,
          display_name: data.settings?.dashboard?.display_name ?? data.business_profile?.name ?? null,
        },
      })
    } else {
      const errorData = await response.json().catch(() => ({}))
      const errorMessage = errorData?.error?.message ?? 'Credenciales inválidas'
      return NextResponse.json({ valid: false, error: errorMessage })
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Error desconocido'
    return NextResponse.json({ valid: false, error: message }, { status: 500 })
  }
}
