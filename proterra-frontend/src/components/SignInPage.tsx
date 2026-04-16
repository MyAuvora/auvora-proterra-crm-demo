import { SignIn } from '@clerk/clerk-react'

export function SignInPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex flex-col items-center justify-center p-4">
      <div className="mb-8 text-center">
        <div className="mx-auto mb-4 w-48 rounded-xl bg-white p-4 shadow-xl">
          <img 
            src="/proterra-logo.png" 
            alt="ProTerra Design" 
            className="h-14 w-full object-contain"
          />
        </div>
        <h1 className="text-2xl font-bold text-white">Outdoor Design CRM</h1>
        <p className="text-sky-400 text-sm mt-1">Florida &amp; Alabama Gulf Coast</p>
      </div>
      
      <SignIn 
        appearance={{
          elements: {
            rootBox: 'mx-auto',
            card: 'shadow-2xl border-0',
            headerTitle: 'text-slate-800',
            headerSubtitle: 'text-slate-500',
            socialButtonsBlockButton: 'hidden',
            socialButtonsBlockButtonArrow: 'hidden',
            socialButtonsProviderIcon: 'hidden',
            dividerRow: 'hidden',
            formButtonPrimary: 'bg-gradient-to-r from-sky-600 to-cyan-500 hover:opacity-90 shadow-lg',
            footerActionLink: 'text-sky-600 hover:text-sky-700',
          }
        }}
        routing="hash"
        signUpUrl="#/sign-up"
        forceRedirectUrl="/"
      />

      <p className="mt-8 text-xs text-slate-500">
        &copy; {new Date().getFullYear()} Auvora LLC. All rights reserved.
      </p>
    </div>
  )
}
