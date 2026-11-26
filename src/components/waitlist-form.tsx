
"use client";

import { FormEvent, useState } from "react";

type FormStatus =
  | { kind: "idle"; message: "" }
  | { kind: "loading"; message: "Submitting..." }
  | { kind: "success"; message: string }
  | { kind: "duplicate"; message: string }
  | { kind: "error"; message: string };

export default function WaitlistForm() {
  const [status, setStatus] = useState<FormStatus>({
    kind: "idle",
    message: "",
  });

  const [fullName, setFullName] = useState("");

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (status.kind === "loading") return;

    const form = event.currentTarget;
    const formData = new FormData(form);
    const submittedName = String(formData.get("fullName") || "").trim();

    setFullName(submittedName);
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

      // Existing registration
      if (response.status === 409) {
        setStatus({
          kind: "duplicate",
          message: "This email address is already registered.",
        });
        return;
      }

      if (!response.ok) {
        throw new Error(
          result.error ||
            "We couldn't submit your details. Please try again."
        );
      }

      setStatus({
        kind: "success",
        message: "You're officially on the list!",
      });
    } catch (error) {
      setStatus({
        kind: "error",
        message:
          error instanceof Error
            ? error.message
            : "Something went wrong. Please try again.",
      });
    }
  }

  if (status.kind === "success" || status.kind === "duplicate") {
    const isDuplicate = status.kind === "duplicate";
    const firstName = fullName.trim().split(/\s+/)[0];

    return (
      <section
        className={`waitlist-card success-card ${
          isDuplicate ? "duplicate-card" : ""
        }`}
        aria-live="polite"
      >
        <div className="success-icon" aria-hidden="true">
          <svg
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M5 12.5L10 17L19 7"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </div>

        <div className="success-content">
          <p className="success-eyebrow">
            {isDuplicate ? "ALREADY REGISTERED" : "REGISTRATION CONFIRMED"}
          </p>

          <h2>
            {isDuplicate
              ? "You're already on the list!"
              : `You're on the list, ${firstName}!`}
          </h2>

          <p>
            {isDuplicate
              ? "Looks like you've already secured your spot on the SAFEN waitlist. There's nothing else you need to do."
              : "Thank you for joining SAFEN. Your details have been received successfully, and you've taken the first step towards a safer Nigeria."}
          </p>

          <p className="success-note">
            {isDuplicate
              ? "We'll keep you updated when SAFEN is ready. Keep an eye on your inbox."
              : "We're working behind the scenes to bring SAFEN to life. Keep an eye on your inbox. We'll be in touch."}
          </p>
        </div>

        <div className="success-footer">
          <span>SAFEN</span>
          <span>SAFE NIGERIA</span>
        </div>
      </section>
    );
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
        disabled={status.kind === "loading"}
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
        disabled={status.kind === "loading"}
      />

      <label htmlFor="phone">Phone number</label>
<input
  id="phone"
  name="phone"
  type="tel"
  placeholder="0801 234 5678"
  autoComplete="tel"
  inputMode="tel"
  minLength={10}
  maxLength={17}
  required
  disabled={status.kind === "loading"}
/>

      <div className="honeypot" aria-hidden="true">
        <label htmlFor="website">Leave this field empty</label>
        <input
          id="website"
          name="website"
          type="text"
          tabIndex={-1}
          autoComplete="off"
        />
      </div>

      <button type="submit" disabled={status.kind === "loading"}>
        {status.kind === "loading" ? "Joining..." : "Join the waitlist"}
        <span aria-hidden="true">→</span>
      </button>

      {status.kind === "error" && (
        <p className="form-message error" role="alert">
          {status.message}
        </p>
      )}
    </form>
  );
}
