import { GoogleLogin } from '@react-oauth/google'
import { toast } from 'sonner'

type GoogleAuthButtonProps = {
  onCredential: (credential: string) => void | Promise<void>
  mode: 'signin' | 'signup'
}

export default function GoogleAuthButton({ onCredential, mode }: GoogleAuthButtonProps) {
  if (!import.meta.env.VITE_GOOGLE_CLIENT_ID) {
    return (
      <p role="alert" className="text-center text-sm text-red-700">
        Google sign-in is unavailable. Configure VITE_GOOGLE_CLIENT_ID in frontend/.env.
      </p>
    )
  }

  return (
    <div className="flex justify-center">
      <GoogleLogin
        text={mode === 'signup' ? 'signup_with' : 'signin_with'}
        theme="outline"
        shape="rectangular"
        size="large"
        width="384"
        onSuccess={({ credential }) => {
          if (!credential) {
            toast.error('Google did not return an ID token. Please try again.')
            return
          }

          void onCredential(credential)
        }}
        onError={() => {
          toast.error('Google sign-in could not be completed. Please try again.')
        }}
      />
    </div>
  )
}
