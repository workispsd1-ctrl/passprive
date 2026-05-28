'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowRight, Loader2 } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

type Mode = 'signin' | 'signup'

export default function LoginDialog({ variant }: { variant?: 'hero' } = {}) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [mode, setMode] = useState<Mode>('signin')
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [googleLoading, setGoogleLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  function handleOpenChange(next: boolean) {
    if (loading || googleLoading) return
    setOpen(next)
    if (next) {
      setError('')
      setSuccess('')
      setName('')
      setEmail('')
      setPassword('')
      setLoading(false)
      setGoogleLoading(false)
      setMode('signin')
    }
  }

  async function handleSubmit() {
    if (mode === 'signup' && !name.trim()) { setError('Name is required'); return }
    if (!email || !password) { setError('Email and password are required'); return }
    if (password.length < 6) { setError('Password must be at least 6 characters'); return }

    setLoading(true)
    setError('')
    setSuccess('')

    const endpoint = mode === 'signin' ? '/api/auth/signin' : '/api/auth/signup'
    const res = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password, name: name.trim() }),
    })

    const data = await res.json()

    if (!res.ok) {
      setError(data.error ?? 'Something went wrong. Please try again.')
      setLoading(false)
      return
    }

    if (mode === 'signup') {
      setSuccess('Account created! Check your email to confirm, then sign in.')
      setLoading(false)
      return
    }

    setOpen(false)
    router.refresh()
  }

  async function handleGoogleSignIn() {
    setGoogleLoading(true)
    setError('')
    const supabase = createClient()
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${window.location.origin}/api/auth/callback` },
    })
    if (error) {
      setError(error.message)
      setGoogleLoading(false)
    }
  }

  function switchMode(next: Mode) {
    setMode(next)
    setName('')
    setError('')
    setSuccess('')
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger
        render={
          <Button
            variant={variant === 'hero' ? 'default' : 'outline'}
            size={variant === 'hero' ? 'lg' : 'default'}
            className={variant === 'hero' ? 'group mt-10 h-12 px-8 text-base rounded-xl shadow-md hover:shadow-lg transition-shadow' : ''}
          />
        }
      >
        {variant === 'hero' ? (
          <>
            Get started
            <ArrowRight className="ml-1 size-4 transition-transform group-hover:translate-x-0.5" />
          </>
        ) : 'Login'}
      </DialogTrigger>

      <DialogContent className="sm:max-w-sm p-0 overflow-hidden">
        <div className="px-6 pt-6 pb-6">
          <DialogHeader className="mb-5 text-center items-center">
            <DialogTitle className="text-xl font-bold">
              {mode === 'signin' ? 'Welcome back' : 'Create account'}
            </DialogTitle>
            <DialogDescription>
              {mode === 'signin' ? 'Sign in to Passprive' : 'Get started with Passprive'}
            </DialogDescription>
          </DialogHeader>

          {/* Tabs */}
          <div className="flex rounded-lg bg-muted p-0.5 mb-5">
            {(['signin', 'signup'] as Mode[]).map((m) => (
              <button
                key={m}
                type="button"
                onClick={() => switchMode(m)}
                className={`flex-1 rounded-md py-1.5 text-sm font-medium transition-all ${
                  mode === m
                    ? 'bg-background text-foreground shadow-sm'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                {m === 'signin' ? 'Sign In' : 'Sign Up'}
              </button>
            ))}
          </div>

          {/* Fields */}
          <div className="flex flex-col gap-3">
            {mode === 'signup' && (
              <div className="grid gap-1.5">
                <Label htmlFor="name">Full Name</Label>
                <Input
                  id="name"
                  type="text"
                  placeholder="Jane Doe"
                  value={name}
                  autoFocus
                  onChange={(e) => { setName(e.target.value); setError('') }}
                  onKeyDown={(e) => e.key === 'Enter' && !loading && handleSubmit()}
                />
              </div>
            )}
            <div className="grid gap-1.5">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="you@example.com"
                value={email}
                autoFocus={mode === 'signin'}
                onChange={(e) => { setEmail(e.target.value); setError('') }}
                onKeyDown={(e) => e.key === 'Enter' && !loading && handleSubmit()}
              />
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => { setPassword(e.target.value); setError('') }}
                onKeyDown={(e) => e.key === 'Enter' && !loading && handleSubmit()}
              />
            </div>
          </div>

          {error && <p className="mt-3 text-xs text-destructive">{error}</p>}
          {success && <p className="mt-3 text-xs text-green-600">{success}</p>}

          <Button
            type="button"
            className="mt-4 w-full h-10"
            disabled={loading || googleLoading}
            onClick={handleSubmit}
          >
            {loading ? (
              <>
                <Loader2 className="size-4 animate-spin" />
                {mode === 'signin' ? 'Signing in…' : 'Creating account…'}
              </>
            ) : mode === 'signin' ? 'Sign In' : 'Create Account'}
          </Button>

          {/* Divider */}
          <div className="my-4 flex items-center gap-3">
            <div className="h-px flex-1 bg-border" />
            <span className="text-xs text-muted-foreground">or</span>
            <div className="h-px flex-1 bg-border" />
          </div>

          {/* Google */}
          <Button
            type="button"
            variant="outline"
            className="w-full h-10 gap-2"
            disabled={googleLoading || loading}
            onClick={handleGoogleSignIn}
          >
            {googleLoading ? (
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-muted-foreground border-t-foreground" />
            ) : (
              <GoogleIcon />
            )}
            Continue with Google
          </Button>

          <p className="mt-5 text-center text-xs text-muted-foreground">
            By continuing, you agree to our{' '}
            <Link href="/terms" className="underline hover:text-foreground">Terms</Link>{' '}
            &amp;{' '}
            <Link href="/privacy" className="underline hover:text-foreground">Privacy</Link>
          </p>
        </div>
      </DialogContent>
    </Dialog>
  )
}

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24">
      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05" />
      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
    </svg>
  )
}
