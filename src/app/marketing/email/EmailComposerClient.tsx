"use client";

import { FormEvent, useEffect, useRef, useState } from "react";

type EmailForm = {
  recipientEmail: string;
  recipientName: string;
  recipientCompany: string;
  emailType: string;
  subject: string;
  campaign: string;
  status: string;
  sendDate: string;
  goal: string;
  tone: string;
  notes: string;
  body: string;
};

const initialForm: EmailForm = {
  recipientEmail: "",
  recipientName: "",
  recipientCompany: "",
  emailType: "Price increase email",
  subject: "",
  campaign: "Distributor communication",
  status: "draft",
  sendDate: "",
  goal: "explain the update clearly, preserve trust, and make the next step easy",
  tone: "professional, direct, respectful, and confident",
  notes: "Explain that material costs increased, the new distributor price is $750, and the change is effective May 1. Keep it practical and distributor-friendly.",
  body: "",
};

const emailTypes = [
  "Price increase email",
  "Distributor follow-up email",
  "Customer quote follow-up",
  "Order status email",
  "Campaign announcement",
  "Product education email",
  "General marketing email",
];

const tones = [
  "professional, direct, respectful, and confident",
  "friendly and simple",
  "strong sales-focused",
  "educational and helpful",
  "premium and polished",
  "short and direct",
];

type SpeechRecognitionConstructor = new () => SpeechRecognition;

type SpeechRecognition = EventTarget & {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  start: () => void;
  stop: () => void;
  onresult: ((event: SpeechRecognitionEvent) => void) | null;
  onend: (() => void) | null;
  onerror: ((event?: { error?: string }) => void) | null;
};

type SpeechRecognitionEvent = {
  results: ArrayLike<{ 0: { transcript: string } }>;
};

function getSpeechRecognition(): SpeechRecognitionConstructor | null {
  if (typeof window === "undefined") return null;
  const browserWindow = window as unknown as {
    SpeechRecognition?: SpeechRecognitionConstructor;
    webkitSpeechRecognition?: SpeechRecognitionConstructor;
  };
  return browserWindow.SpeechRecognition ?? browserWindow.webkitSpeechRecognition ?? null;
}

export default function EmailComposerClient() {
  const [form, setForm] = useState<EmailForm>(initialForm);
  const [loadingAi, setLoadingAi] = useState(false);
  const [savingCrm, setSavingCrm] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [listeningField, setListeningField] = useState<keyof EmailForm | null>(null);
  const [supportsMic, setSupportsMic] = useState(false);
  const activeRecognition = useRef<SpeechRecognition | null>(null);

  useEffect(() => {
    setSupportsMic(Boolean(getSpeechRecognition()));
    return () => activeRecognition.current?.stop();
  }, []);

  function updateField(field: keyof EmailForm, value: string) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  function startDictation(field: keyof EmailForm) {
    const Recognition = getSpeechRecognition();
    if (!Recognition) {
      setError("Microphone dictation is not supported in this browser. Use Chrome or Edge and allow microphone access.");
      return;
    }

    if (activeRecognition.current && listeningField === field) {
      activeRecognition.current.stop();
      activeRecognition.current = null;
      setListeningField(null);
      return;
    }

    activeRecognition.current?.stop();

    const recognition = new Recognition();
    activeRecognition.current = recognition;
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = "en-US";
    setListeningField(field);
    setMessage("Listening. Speak now, then pause to insert text.");
    setError("");

    recognition.onresult = (event) => {
      const transcript = Array.from(event.results)
        .map((result) => result[0]?.transcript ?? "")
        .join(" ")
        .trim();

      if (transcript) {
        setForm((current) => ({
          ...current,
          [field]: current[field] ? `${current[field]} ${transcript}` : transcript,
        }));
        setMessage("Dictation inserted.");
      }
    };

    recognition.onerror = (event) => {
      activeRecognition.current = null;
      setListeningField(null);
      const reason = event?.error ? ` (${event.error})` : "";
      setError(`Could not capture microphone dictation${reason}. Check browser microphone permission and try again.`);
    };

    recognition.onend = () => {
      activeRecognition.current = null;
      setListeningField(null);
    };

    try {
      recognition.start();
    } catch {
      activeRecognition.current = null;
      setListeningField(null);
      setError("Microphone dictation could not start. Check browser permissions and try again.");
    }
  }

  async function generateEmail(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoadingAi(true);
    setMessage("");
    setError("");

    try {
      const response = await fetch("/api/marketing/ai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contentType: form.emailType,
          channel: "Email",
          audience: form.recipientCompany || form.recipientName || "customers and distributors",
          tone: form.tone,
          offer: "CowStop reusable cattle guard forms",
          goal: form.goal,
          notes: [
            form.notes,
            form.subject ? `Suggested subject: ${form.subject}` : "",
            form.campaign ? `Campaign: ${form.campaign}` : "",
            form.recipientCompany ? `Recipient company: ${form.recipientCompany}` : "",
          ].filter(Boolean).join("\n"),
        }),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data?.error ?? "Unable to generate email.");

      const output = data.output ?? "";
      setForm((current) => ({
        ...current,
        body: output,
        subject: current.subject || inferSubject(output) || current.emailType,
      }));
      setMessage("Email generated. Review it, then save it to CRM.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to generate email.");
    } finally {
      setLoadingAi(false);
    }
  }

  async function saveToCrm() {
    setSavingCrm(true);
    setMessage("");
    setError("");

    try {
      const response = await fetch("/api/marketing/email-activity", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      const data = await response.json();
      if (!response.ok || !data.ok) throw new Error(data?.error ?? "Unable to save email activity to CRM.");
      setMessage(`Email activity saved to CRM. CRM order/activity ID: ${data.order_id ?? "created"}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to save email activity to CRM.");
    } finally {
      setSavingCrm(false);
    }
  }

  async function copyEmail() {
    await navigator.clipboard.writeText([`Subject: ${form.subject}`, "", form.body].join("\n"));
    setMessage("Email copied to clipboard.");
  }

  return (
    <div className="mt-8 grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
      <section className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-neutral-200">
        <h2 className="text-xl font-semibold">AI Email Generator</h2>
        <p className="mt-2 text-sm leading-6 text-neutral-600">
          Create distributor emails, price increase notices, customer follow-ups, quote replies, and campaign emails. Use the microphone icon beside supported fields for browser dictation.
        </p>

        {!supportsMic ? <div className="mt-4 rounded border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">Microphone dictation requires a supported browser such as Chrome or Edge and microphone permission.</div> : null}
        {message ? <div className="mt-4 rounded border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-900">{message}</div> : null}
        {error ? <div className="mt-4 rounded border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">{error}</div> : null}

        <form onSubmit={generateEmail} className="mt-6 grid gap-4">
          <Select label="Email type" value={form.emailType} options={emailTypes} onChange={(value) => updateField("emailType", value)} />
          <div className="grid gap-4 md:grid-cols-2">
            <Input label="Recipient email" value={form.recipientEmail} onChange={(value) => updateField("recipientEmail", value)} type="email" />
            <Input label="Recipient name" value={form.recipientName} onChange={(value) => updateField("recipientName", value)} />
          </div>
          <Input label="Recipient company" value={form.recipientCompany} onChange={(value) => updateField("recipientCompany", value)} />
          <VoiceInput label="Subject" value={form.subject} onChange={(value) => updateField("subject", value)} onMic={() => startDictation("subject")} listening={listeningField === "subject"} supportsMic={supportsMic} />
          <div className="grid gap-4 md:grid-cols-2">
            <Input label="Campaign" value={form.campaign} onChange={(value) => updateField("campaign", value)} />
            <Select label="Status" value={form.status} options={["draft", "scheduled", "sent", "needs review"]} onChange={(value) => updateField("status", value)} />
          </div>
          <Input label="Send date" value={form.sendDate} onChange={(value) => updateField("sendDate", value)} type="date" />
          <Select label="Tone" value={form.tone} options={tones} onChange={(value) => updateField("tone", value)} />
          <VoiceTextarea label="Goal" value={form.goal} onChange={(value) => updateField("goal", value)} onMic={() => startDictation("goal")} listening={listeningField === "goal"} supportsMic={supportsMic} />
          <VoiceTextarea label="Facts / notes to include" value={form.notes} onChange={(value) => updateField("notes", value)} onMic={() => startDictation("notes")} listening={listeningField === "notes"} supportsMic={supportsMic} />

          <button type="submit" disabled={loadingAi} className="rounded bg-green-800 px-5 py-3 text-sm font-semibold text-white hover:bg-green-900 disabled:cursor-not-allowed disabled:bg-neutral-400">
            {loadingAi ? "Generating..." : "Generate Email with AI"}
          </button>
        </form>
      </section>

      <section className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-neutral-200">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h2 className="text-xl font-semibold">Email Draft + CRM Save</h2>
            <p className="mt-2 text-sm leading-6 text-neutral-600">Review or edit the email, then save it to CRM email activity. This also creates/updates the recipient contact by email.</p>
          </div>
          <div className="flex gap-2">
            <button type="button" onClick={copyEmail} disabled={!form.body && !form.subject} className="rounded border border-neutral-300 px-4 py-2 text-sm font-semibold hover:border-green-800 hover:bg-green-50 disabled:opacity-50">Copy</button>
            <button type="button" onClick={saveToCrm} disabled={savingCrm} className="rounded bg-green-800 px-4 py-2 text-sm font-semibold text-white hover:bg-green-900 disabled:bg-neutral-400">{savingCrm ? "Saving..." : "Save to CRM"}</button>
          </div>
        </div>

        <div className="mt-5 grid gap-4">
          <VoiceInput label="Subject" value={form.subject} onChange={(value) => updateField("subject", value)} onMic={() => startDictation("subject")} listening={listeningField === "subject"} supportsMic={supportsMic} />
          <VoiceTextarea label="Email body" value={form.body} onChange={(value) => updateField("body", value)} onMic={() => startDictation("body")} listening={listeningField === "body"} supportsMic={supportsMic} large />
        </div>
      </section>
    </div>
  );
}

function inferSubject(output: string) {
  const subjectLine = output.split("\n").find((line) => line.toLowerCase().startsWith("subject"));
  return subjectLine?.replace(/^subject\s*:?\s*/i, "").trim();
}

function Input({ label, value, onChange, type = "text" }: { label: string; value: string; onChange: (value: string) => void; type?: string }) {
  return (
    <label className="grid gap-2 text-sm font-medium text-neutral-700">
      {label}
      <input type={type} value={value} onChange={(event) => onChange(event.target.value)} className="rounded border border-neutral-300 px-3 py-2 font-normal" />
    </label>
  );
}

function MicButton({ onMic, listening, supportsMic }: { onMic: () => void; listening: boolean; supportsMic: boolean }) {
  return (
    <button
      type="button"
      onClick={onMic}
      disabled={!supportsMic}
      className={`inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full border text-base font-semibold transition ${listening ? "border-red-300 bg-red-50 text-red-700" : "border-neutral-300 bg-white text-neutral-700 hover:border-green-800 hover:bg-green-50"} disabled:cursor-not-allowed disabled:opacity-40`}
      title={supportsMic ? "Dictate with microphone" : "Microphone dictation not supported in this browser"}
      aria-label={listening ? "Stop microphone dictation" : "Start microphone dictation"}
    >
      {listening ? "●" : "🎙"}
    </button>
  );
}

function VoiceInput({ label, value, onChange, onMic, listening, supportsMic }: { label: string; value: string; onChange: (value: string) => void; onMic: () => void; listening: boolean; supportsMic: boolean }) {
  return (
    <label className="grid gap-2 text-sm font-medium text-neutral-700">
      {label}
      <div className="flex gap-2">
        <input value={value} onChange={(event) => onChange(event.target.value)} className="min-w-0 flex-1 rounded border border-neutral-300 px-3 py-2 font-normal" />
        <MicButton onMic={onMic} listening={listening} supportsMic={supportsMic} />
      </div>
    </label>
  );
}

function VoiceTextarea({ label, value, onChange, onMic, listening, supportsMic, large = false }: { label: string; value: string; onChange: (value: string) => void; onMic: () => void; listening: boolean; supportsMic: boolean; large?: boolean }) {
  return (
    <label className="grid gap-2 text-sm font-medium text-neutral-700">
      <span className="flex items-center justify-between gap-3">
        {label}
        <MicButton onMic={onMic} listening={listening} supportsMic={supportsMic} />
      </span>
      <textarea value={value} onChange={(event) => onChange(event.target.value)} className={`${large ? "min-h-[28rem]" : "min-h-28"} rounded border border-neutral-300 px-3 py-2 font-normal`} />
    </label>
  );
}

function Select({ label, value, options, onChange }: { label: string; value: string; options: string[]; onChange: (value: string) => void }) {
  return (
    <label className="grid gap-2 text-sm font-medium text-neutral-700">
      {label}
      <select value={value} onChange={(event) => onChange(event.target.value)} className="rounded border border-neutral-300 px-3 py-2 font-normal">
        {options.map((option) => <option key={option} value={option}>{option}</option>)}
      </select>
    </label>
  );
}
