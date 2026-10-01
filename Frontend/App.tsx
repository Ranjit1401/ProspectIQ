import { Routes, Route, Navigate } from "react-router-dom";
import { lazy, Suspense } from "react";

// Auth guards
import { AuthGuard } from "@/components/auth/auth-guard";
import { GuestGuard } from "@/components/auth/guest-guard";

// Layout
import { AppShell } from "@/components/layout/app-shell";

// Auth pages (small — loaded eagerly)
import { AuthShell } from "@/components/auth/auth-shell";
import { LoginForm } from "@/components/auth/login-form";
import { SignupForm } from "@/components/auth/signup-form";
import { ForgotPasswordForm } from "@/components/auth/forgot-password-form";

// Landing page
const LandingPage = lazy(() => import("@/app/page"));

// Authenticated app pages (lazy loaded)
const WorkspacePage = lazy(() => import("@/app/(app)/workspace/page"));
const AccountsPage = lazy(() => import("@/app/(app)/accounts/page"));
const AccountDetailPage = lazy(() => import("@/app/(app)/accounts/[id]/page"));
const GraphPage = lazy(() => import("@/app/(app)/graph/page"));
const RecommendationsPage = lazy(() => import("@/app/(app)/recommendations/page"));
const QueuePage = lazy(() => import("@/app/(app)/queue/page"));
const AuditPage = lazy(() => import("@/app/(app)/audit/page"));
const ProfilePage = lazy(() => import("@/app/(app)/profile/page"));
const AgentRoomPage = lazy(() => import("@/app/(app)/agent-room/page"));

function PageLoader() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-[#090909] text-sm text-white/40">
      Loading…
    </div>
  );
}

export default function App() {
  return (
    <Suspense fallback={<PageLoader />}>
      <Routes>
        {/* Public landing */}
        <Route path="/" element={<LandingPage />} />

        {/* Guest-only routes (redirect to /workspace if already logged in) */}
        <Route
          path="/login"
          element={
            <GuestGuard>
              <AuthShell title="Welcome back" subtitle="Sign in to your ProspectIQ account">
                <LoginForm />
              </AuthShell>
            </GuestGuard>
          }
        />
        <Route
          path="/signup"
          element={
            <GuestGuard>
              <AuthShell title="Create account" subtitle="Start your free trial — no card required">
                <SignupForm />
              </AuthShell>
            </GuestGuard>
          }
        />
        <Route
          path="/forgot-password"
          element={
            <GuestGuard>
              <AuthShell title="Reset password" subtitle="We'll send a link to your inbox">
                <ForgotPasswordForm />
              </AuthShell>
            </GuestGuard>
          }
        />

        {/* Authenticated app routes */}
        <Route
          path="/*"
          element={
            <AuthGuard>
              <AppShell>
                <Routes>
                  <Route path="workspace" element={<WorkspacePage />} />
                  <Route path="accounts" element={<AccountsPage />} />
                  <Route path="accounts/:id" element={<AccountDetailPage />} />
                  <Route path="graph" element={<GraphPage />} />
                  <Route path="recommendations" element={<RecommendationsPage />} />
                  <Route path="queue" element={<QueuePage />} />
                  <Route path="audit" element={<AuditPage />} />
                  <Route path="profile" element={<ProfilePage />} />
                  <Route path="agent-room" element={<AgentRoomPage />} />
                  <Route path="*" element={<Navigate to="/workspace" replace />} />
                </Routes>
              </AppShell>
            </AuthGuard>
          }
        />
      </Routes>
    </Suspense>
  );
}
