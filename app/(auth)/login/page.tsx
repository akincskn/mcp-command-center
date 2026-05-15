import { signInWithGoogle } from '@/actions/auth';
import { PageTransition } from '@/components/shared/PageTransition';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Terminal } from 'lucide-react';

function GoogleIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 18 18" aria-hidden="true">
      <path
        fill="#4285F4"
        d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844a4.14 4.14 0 0 1-1.796 2.716v2.259h2.908c1.702-1.567 2.684-3.875 2.684-6.615Z"
      />
      <path
        fill="#34A853"
        d="M9 18c2.43 0 4.467-.806 5.956-2.184l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18Z"
      />
      <path
        fill="#FBBC05"
        d="M3.964 10.706A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.706V4.962H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.038l3.007-2.332Z"
      />
      <path
        fill="#EA4335"
        d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.962L3.964 7.294C4.672 5.163 6.656 3.58 9 3.58Z"
      />
    </svg>
  );
}

export default function LoginPage() {
  return (
    <PageTransition>
      <Card className="w-full max-w-sm border-border bg-card/60 backdrop-blur-sm">
        <CardHeader className="items-center pb-2 pt-8">
          <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 ring-1 ring-primary/20">
            <Terminal className="h-5 w-5 text-primary" />
          </div>
          <h1 className="text-2xl font-semibold tracking-tight">
            MCP Command Center
          </h1>
          <p className="text-center text-sm text-muted-foreground">
            Orchestrate AI tools with natural language
          </p>
        </CardHeader>

        <CardContent className="flex flex-col gap-3 pb-6 pt-4">
          <form action={signInWithGoogle}>
            <Button
              type="submit"
              className="w-full gap-2 bg-primary text-primary-foreground hover:bg-primary/90"
            >
              <GoogleIcon />
              Continue with Google
            </Button>
          </form>

          <p className="pt-2 text-center text-xs text-muted-foreground">
            Demo mode · No production data
          </p>
        </CardContent>
      </Card>
    </PageTransition>
  );
}
