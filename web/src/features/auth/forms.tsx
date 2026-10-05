"use client";

import Link from "next/link";
import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { Alert, Field, Input, Textarea } from "@/components/ui/form";
import type { ActionState } from "@/server/services/result";
import {
  forgotPasswordAction,
  resetPasswordAction,
  saveProfileAction,
  signInAction,
  signUpAction,
} from "./actions";

const idle: ActionState = { ok: false };

function invalid(state: ActionState, field: string) {
  const error = state.fieldErrors?.[field];
  return {
    error,
    props: error ? { "aria-invalid": true as const, "aria-describedby": `${field}-error` } : {},
  };
}

function Message({ state }: { state: ActionState }) {
  if (!state.message) return null;
  return <Alert tone={state.ok ? "success" : "danger"}>{state.message}</Alert>;
}

export function SignInForm({ next }: { next: string }) {
  const [state, action, pending] = useActionState(signInAction, idle);
  const email = invalid(state, "email");
  const password = invalid(state, "password");

  return (
    <form action={action} className="flex flex-col gap-4" noValidate>
      <input type="hidden" name="next" value={next} />
      <Message state={state} />
      <Field id="email" label="Email" error={email.error}>
        <Input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          required
          {...email.props}
        />
      </Field>
      <Field id="password" label="Password" error={password.error}>
        <Input
          id="password"
          name="password"
          type="password"
          autoComplete="current-password"
          required
          {...password.props}
        />
      </Field>
      <Button type="submit" disabled={pending}>
        {pending ? "Signing in…" : "Sign in"}
      </Button>
      <p className="text-center text-sm">
        <Link href="/forgot-password" className="font-bold text-brand-strong hover:underline">
          Forgot password?
        </Link>
      </p>
    </form>
  );
}

export function SignUpForm() {
  const [state, action, pending] = useActionState(signUpAction, idle);
  const name = invalid(state, "displayName");
  const email = invalid(state, "email");
  const password = invalid(state, "password");

  if (state.ok && state.message) return <Alert tone="success">{state.message}</Alert>;

  return (
    <form action={action} className="flex flex-col gap-4" noValidate>
      <Message state={state} />
      <Field id="displayName" label="Your name or business name" error={name.error}>
        <Input id="displayName" name="displayName" autoComplete="name" required {...name.props} />
      </Field>
      <Field id="email" label="Email" error={email.error}>
        <Input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          required
          {...email.props}
        />
      </Field>
      <Field id="password" label="Password" hint="At least 8 characters." error={password.error}>
        <Input
          id="password"
          name="password"
          type="password"
          autoComplete="new-password"
          minLength={8}
          required
          {...password.props}
        />
      </Field>
      <Button type="submit" disabled={pending}>
        {pending ? "Creating account…" : "Create account"}
      </Button>
    </form>
  );
}

export function ForgotPasswordForm() {
  const [state, action, pending] = useActionState(forgotPasswordAction, idle);
  const email = invalid(state, "email");

  if (state.ok && state.message) return <Alert tone="success">{state.message}</Alert>;

  return (
    <form action={action} className="flex flex-col gap-4" noValidate>
      <Message state={state} />
      <Field id="email" label="Email" error={email.error}>
        <Input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          required
          {...email.props}
        />
      </Field>
      <Button type="submit" disabled={pending}>
        {pending ? "Sending…" : "Send reset link"}
      </Button>
    </form>
  );
}

export function ResetPasswordForm() {
  const [state, action, pending] = useActionState(resetPasswordAction, idle);
  const password = invalid(state, "password");

  return (
    <form action={action} className="flex flex-col gap-4" noValidate>
      <Message state={state} />
      <Field
        id="password"
        label="New password"
        hint="At least 8 characters."
        error={password.error}
      >
        <Input
          id="password"
          name="password"
          type="password"
          autoComplete="new-password"
          minLength={8}
          required
          {...password.props}
        />
      </Field>
      <Button type="submit" disabled={pending}>
        {pending ? "Saving…" : "Save new password"}
      </Button>
    </form>
  );
}

export function ProfileForm({
  profile,
}: {
  profile: { displayName: string; city: string; country: string; bio: string };
}) {
  const [state, action, pending] = useActionState(saveProfileAction, idle);
  const name = invalid(state, "displayName");
  const bio = invalid(state, "bio");

  return (
    <form action={action} className="flex flex-col gap-4" noValidate>
      <Message state={state} />
      <Field id="displayName" label="Name shown to other members" error={name.error}>
        <Input
          id="displayName"
          name="displayName"
          defaultValue={profile.displayName}
          required
          {...name.props}
        />
      </Field>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field id="city" label="City">
          <Input id="city" name="city" defaultValue={profile.city} autoComplete="address-level2" />
        </Field>
        <Field id="country" label="Country">
          <Input
            id="country"
            name="country"
            defaultValue={profile.country}
            autoComplete="country-name"
          />
        </Field>
      </div>
      <Field id="bio" label="About you" hint="Up to 1000 characters." error={bio.error}>
        <Textarea id="bio" name="bio" rows={4} defaultValue={profile.bio} {...bio.props} />
      </Field>
      <Button type="submit" disabled={pending} className="self-start">
        {pending ? "Saving…" : "Save profile"}
      </Button>
    </form>
  );
}
