import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'

import SignInCardBody from '@/components/auth/sign-in-card-body'

const SignIn = () => {
  return (
    <section className='h-screen-with-header flex flex-col items-center justify-center'>
      <Card className='w-full max-w-lg'>
        <CardHeader>
          <CardTitle className='text-2xl font-bold'>
            Sign in to Virtality
          </CardTitle>
          <CardDescription className='text-muted-foreground text-sm'>
            Please enter your credentials to sign in.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <SignInCardBody />
        </CardContent>
      </Card>
    </section>
  )
}

export default SignIn
