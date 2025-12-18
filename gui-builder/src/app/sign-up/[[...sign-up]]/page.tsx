import { SignUp } from "@clerk/nextjs";

export default function SignUpPage() {
  const clerkPublishableKey = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;
  const isClerkConfigured = clerkPublishableKey && clerkPublishableKey !== 'your_clerk_publishable_key';

  if (!isClerkConfigured) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="max-w-md w-full bg-white rounded-lg shadow-md p-8">
          <h1 className="text-2xl font-bold text-center mb-4">Authentication Not Configured</h1>
          <p className="text-gray-600 text-center mb-6">
            Clerk authentication is not configured. Please set up your Clerk keys in the .env.local file.
          </p>
          <div className="bg-gray-50 p-4 rounded text-sm font-mono">
            NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=your_actual_clerk_key<br/>
            CLERK_SECRET_KEY=your_actual_secret_key
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <SignUp
        path="/sign-up"
        routing="path"
        signInUrl="/sign-in"
        redirectUrl="/games"
      />
    </div>
  );
}