import PromotionCodeTable from '@/components/promotion-code/promotion-code-table'

export const dynamic = 'force-dynamic'

type CouponPromotionCodesPageProps = {
  params: Promise<{ id: string }>
}

const CouponPromotionCodesPage = async ({
  params,
}: CouponPromotionCodesPageProps) => {
  const { id } = await params
  return <PromotionCodeTable couponId={id} />
}

export default CouponPromotionCodesPage
