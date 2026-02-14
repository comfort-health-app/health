import {NextRequest, NextResponse} from 'next/server'
import {CheckLogin} from '@app/api/prisma/login/checkLogin'

export const POST = async (req: NextRequest) => {
  const {email: authId, password: authPw} = await req.json()

  const data = await CheckLogin({authId, authPw})
  return NextResponse.json(data)
}
