"use client";

import { FormEvent, useState } from "react";

type FormStatus =
  | { kind: "idle"; message: "" }
  | { kind: "loading"; message: "Submitting..." }
  | { kind: "success"; message: string }
  | { kind: "error"; message: string };

export default function WaitlistForm() {
  const [status, setStatus] = useState<FormStatus>({
    kind: "idle",
    message: "",
  });

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (status.kind === "loading") return;

    const form = event.currentTarget;
    const formData = new FormData(form);

    setStatus({ kind: "loading", message: "Submitting..." });

    try {
      const response = await fetch("/api/waitlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fullName: formData.get("fullName"),
          email: formData.get("email"),
          phone: formData.get("phone"),
          website: formData.get("website"),
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "We couldn't submit your details. Please try again.");
      }

      form.reset();
      setStatus({
        kind: "success",
        message: "You're on the list. We'll be in touch when SAFEN is ready.",
      });
    } catch (error) {
      setStatus({
        kind: "error",
        message: error instanceof Error ? error.message : "Something went wrong. Please try again.",
      });
    }
  }

  return (
    <form className="waitlist-card" onSubmit={handleSubmit}>
      <div className="card-heading">
        <h2>Get early access</h2>
        <p>Leave your details and we’ll keep you in the loop.</p>
      </div>

      <label htmlFor="fullName">Full name</label>
      <input
        id="fullName"
        name="fullName"
        type="text"
        placeholder="Enter your full name"
        autoComplete="name"
        minLength={2}
        maxLength={120}
        required
      />

      <label htmlFor="email">Email address</label>
      <input
        id="email"
        name="email"
        type="email"
        placeholder="you@example.com"
        autoComplete="email"
        maxLength={254}
        required
      />

      <label htmlFor="phone">Phone number</label>
      <input
        id="phone"
        name="phone"
        type="tel"
        placeholder="Enter your phone number"
        autoComplete="tel"
        minLength={7}
        maxLength={32}
        required
      />

      <div className="honeypot" aria-hidden="true">
        <label htmlFor="website">Leave this field empty</label>
        <input id="website" name="website" type="text" tabIndex={-1} autoComplete="off" />
      </div>

      <button type="submit" disabled={status.kind === "loading"}>
        {status.kind === "loading" ? "Joining..." : "Join the waitlist"}
        <span aria-hidden="true">→</span>
      </button>

      {status.kind !== "idle" && (
        <p className={`form-message ${status.kind}`} role="status" aria-live="polite">
          {status.message}
        </p>
      )}
    </form>
  );
}
