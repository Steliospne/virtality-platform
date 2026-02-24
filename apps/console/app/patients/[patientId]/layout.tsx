import TabBar from '@/components/ui/tab-bar'
import PageTransition from '@/components/ui/PageTransition'

export default async function PatientsLayout({
  children,
  params,
}: {
  params: Promise<{ patientId: string }>

  children: React.ReactNode
}) {
  const { patientId } = await params

  const dashboardURL = `/patients/${patientId}/patient-dashboard`
  const profileURL = `/patients/${patientId}/profile`
  const programsURL = `/patients/${patientId}/programs`

  return (
    <>
      <TabBar
        patientId={patientId}
        linkObject={[
          {
            textContext: 'Patient Dashboard',
            href: dashboardURL,
            featureAccess: true,
          },
          { textContext: 'Profile', href: profileURL, featureAccess: true },
          { textContext: 'Programs', href: programsURL, featureAccess: true },
        ]}
      />
      <PageTransition>{children}</PageTransition>
    </>
  )
}
