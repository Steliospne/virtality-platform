import { redirect } from 'next/navigation'

type CouponPromotionCodesRedirectProps = {
  params: Promise<{ id: string }>
}

const CouponPromotionCodesRedirect = async ({
  params,
}: CouponPromotionCodesRedirectProps) => {
  const { id } = await params
  redirect(`/coupons?coupon=${encodeURIComponent(id)}`)
}

export default CouponPromotionCodesRedirect
