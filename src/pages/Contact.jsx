import { jsx, jsxs } from "react/jsx-runtime";
import { useState } from "react";
import { Mail, ArrowRight, CheckCircle2 } from "lucide-react";

import { base44 } from "@/api/base44Client";
import { useToast } from "@/components/ui/use-toast";

export default function ContactPage() {
  const { toast } = useToast();

  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const [form, setForm] = useState({
    name: "",
    email: "",
    role: "",
    company: "",
    message: "",
  });

  const handleChange = (field) => (e) =>
    setForm((prev) => ({
      ...prev,
      [field]: e.target.value,
    }));

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!form.name || !form.email || !form.role || !form.message) {
      toast({
        title: "Please fill in the required fields.",
        description: "Name, email, role, and message are required.",
      });
      return;
    }

    setSubmitting(true);

    try {
      await base44.entities.Inquiry.create({
        name: form.name,
        email: form.email,
        message: `Role: ${form.role}
Company/Business: ${form.company || "Not provided"}

${form.message}`,
        event_type: "Other",
        status: "New",
      });

      setSubmitted(true);

      toast({
        title: "Message sent!",
        description: "We'll get back to you soon.",
      });
    } catch {
      toast({
        title: "Something went wrong",
        description: "Please try again.",
      });
    } finally {
      setSubmitting(false);
    }
  };

  if (submitted) {
    return jsx("div", {
      className: "min-h-[75vh] bg-[#F3E7D3] px-6 py-20 sm:py-28",
      children: jsxs("div", {
        className: "mx-auto flex max-w-2xl flex-col items-center text-center",
        children: [
          jsx("div", {
            className:
              "grid h-16 w-16 place-items-center rounded-full border border-[#7A2348]/30 text-[#7A2348]",
            children: jsx(CheckCircle2, { className: "h-8 w-8" }),
          }),
          jsx("p", {
            className:
              "mt-7 text-[11px] font-semibold uppercase tracking-[0.22em] text-[#7A2348]",
            children: "Message received",
          }),
          jsx("h1", {
            className:
              "mt-3 font-display text-4xl font-bold tracking-tight text-[#292525] sm:text-5xl",
            children: "Thank you for reaching out.",
          }),
          jsx("p", {
            className:
              "mx-auto mt-5 max-w-lg text-[15px] leading-7 text-[#756B69]",
            children:
              "We've received your message and will get back to you at the email address you provided.",
          }),
          jsx("button", {
            onClick: () => {
              setSubmitted(false);
              setForm({
                name: "",
                email: "",
                role: "",
                company: "",
                message: "",
              });
            },
            className:
              "mt-8 rounded-full border border-[#7A2348]/35 px-6 py-3 text-[14px] font-semibold text-[#7A2348] transition-all hover:bg-[#7A2348] hover:text-[#F3E7D3]",
            children: "Send another message",
          }),
        ],
      }),
    });
  }

  return jsx("div", {
    className: "min-h-screen bg-[#F3E7D3] px-6 pb-24 pt-12 sm:pt-16",
    children: jsxs("div", {
      className: "mx-auto max-w-6xl",
      children: [
        jsxs("section", {
          className: "max-w-6xl",
          children: [
            jsx("p", {
              className:
                "text-[11px] font-semibold uppercase tracking-[0.22em] text-[#7A2348]",
              children: "Let's connect",
            }),
            jsx("h1", {
              className:
                "mt-4 max-w-6xl font-display text-4xl font-bold leading-[1.08] tracking-tight text-[#292525] sm:text-5xl lg:text-[60px]",
              children: "Let’s build better events together — and make every event journey more connected.",
            }),
            jsx("p", {
              className:
                "mt-6 max-w-5xl text-[15.5px] leading-7 text-[#756B69]",
              children:
                "Whether you're a customer planning an event, an event planner managing experiences, a vendor looking to grow, or a company interested in collaborating with Eventneve — we'd love to hear from you. Share what you need, what you're building, or what you'd like to explore with us.",
            }),
          ],
        }),

        jsxs("section", {
          className:
            "mt-14 grid gap-14 lg:grid-cols-[0.72fr_1.28fr] lg:gap-20",
          children: [
            jsxs("div", {
              className: "lg:pt-4",
              children: [
                jsx("p", {
                  className:
                    "text-[11px] font-semibold uppercase tracking-[0.18em] text-[#7A2348]",
                  children: "Start a conversation",
                }),
                jsx("h2", {
                  className:
                    "mt-3 font-display text-3xl font-bold tracking-tight text-[#292525] sm:text-4xl",
                  children: "Tell us what’s on your mind.",
                }),
                jsx("p", {
                  className:
                    "mt-4 max-w-md text-[15px] leading-7 text-[#756B69]",
                  children:
                    "Have a question, idea, requirement, or collaboration in mind? Fill out the form and our team will get back to you.",
                }),
                jsxs("div", {
                  className:
                    "mt-9 border-t border-[#7A2348]/25 pt-6",
                  children: [
                    jsx("p", {
                      className:
                        "text-[11px] font-semibold uppercase tracking-[0.16em] text-[#756B69]",
                      children: "Email us directly",
                    }),
                    jsxs("a", {
                      href: "mailto:contact@eventneve.in",
                      className:
                        "mt-2 inline-flex items-center gap-2 text-[16px] font-semibold text-[#7A2348] transition-opacity hover:opacity-70",
                      children: [
                        jsx(Mail, { className: "h-4 w-4" }),
                        "contact@eventneve.in",
                      ],
                    }),
                  ],
                }),
              ],
            }),

            jsxs("form", {
              onSubmit: handleSubmit,
              className:
                "rounded-[28px] border border-[#7A2348]/30 bg-[#F3E7D3] p-6 shadow-[0_18px_55px_rgba(122,35,72,0.08)] sm:p-8 lg:p-10",
              children: [
                jsx("div", {
                  className: "mb-8",
                  children: jsxs("div", {
                    children: [
                      jsx("p", {
                        className:
                          "text-[11px] font-semibold uppercase tracking-[0.18em] text-[#7A2348]",
                        children: "Get in touch",
                      }),
                      jsx("h3", {
                        className:
                          "mt-2 font-display text-2xl font-bold text-[#292525] sm:text-3xl",
                        children: "How can we help?",
                      }),
                    ],
                  }),
                }),

                jsxs("div", {
                  className: "grid gap-5",
                  children: [
                    jsxs("div", {
                      className: "grid gap-5 sm:grid-cols-2",
                      children: [
                        jsx(Field, {
                          label: "Your name *",
                          placeholder: "Your name",
                          value: form.name,
                          onChange: handleChange("name"),
                        }),
                        jsx(Field, {
                          label: "Email address *",
                          placeholder: "you@example.com",
                          type: "email",
                          value: form.email,
                          onChange: handleChange("email"),
                        }),
                      ],
                    }),

                    jsxs("div", {
                      children: [
                        jsx("label", {
                          className:
                            "text-[11px] font-semibold uppercase tracking-[0.14em] text-[#756B69]",
                          children: "I am a *",
                        }),
                        jsx("select", {
                          value: form.role,
                          onChange: handleChange("role"),
                          className:
                            "mt-2 w-full rounded-2xl border border-[#BFA98A] bg-[#F3E7D3] px-4 py-3.5 text-[14px] text-[#292525] outline-none transition-all focus:border-[#7A2348] focus:ring-2 focus:ring-[#7A2348]/10",
                          children: [
                            jsx("option", {
                              value: "",
                              children: "Select one",
                            }),
                            jsx("option", {
                              value: "Customer",
                              children: "Customer",
                            }),
                            jsx("option", {
                              value: "Event Planner",
                              children: "Event Planner",
                            }),
                            jsx("option", {
                              value: "Vendor",
                              children: "Vendor",
                            }),
                            jsx("option", {
                              value: "Event Company",
                              children: "Event Company",
                            }),
                            jsx("option", {
                              value: "Collaboration Partner",
                              children: "Collaboration Partner",
                            }),
                            jsx("option", {
                              value: "Other",
                              children: "Other",
                            }),
                          ],
                        }),
                      ],
                    }),

                    jsx(Field, {
                      label: "Company / Business name",
                      placeholder: "Optional",
                      value: form.company,
                      onChange: handleChange("company"),
                    }),

                    jsxs("div", {
                      children: [
                        jsx("label", {
                          className:
                            "text-[11px] font-semibold uppercase tracking-[0.14em] text-[#756B69]",
                          children: "Your message *",
                        }),
                        jsx("textarea", {
                          rows: 6,
                          placeholder:
                            "Tell us what you're looking for, what you'd like to collaborate on, or how we can help...",
                          value: form.message,
                          onChange: handleChange("message"),
                          className:
                            "mt-2 w-full resize-none rounded-2xl border border-[#BFA98A] bg-[#F3E7D3] px-4 py-3.5 text-[14px] leading-6 text-[#292525] placeholder:text-[#8B817D] outline-none transition-all focus:border-[#7A2348] focus:ring-2 focus:ring-[#7A2348]/10",
                        }),
                      ],
                    }),

                    jsxs("button", {
                      type: "submit",
                      disabled: submitting,
                      className:
                        "mt-1 inline-flex w-full items-center justify-center gap-2 rounded-full bg-[#7A2348] px-6 py-3.5 text-[14px] font-semibold text-[#F3E7D3] shadow-[0_12px_30px_rgba(122,35,72,0.18)] transition-all hover:-translate-y-0.5 hover:bg-[#69213D] disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:translate-y-0",
                      children: [
                        submitting ? "Sending..." : "Send message",
                        jsx(ArrowRight, { className: "h-4 w-4" }),
                      ],
                    }),
                  ],
                }),
              ],
            }),
          ],
        }),
      ],
    }),
  });
}

function Field({ label, placeholder, type = "text", value, onChange }) {
  return jsxs("div", {
    children: [
      jsx("label", {
        className:
          "text-[11px] font-semibold uppercase tracking-[0.14em] text-[#756B69]",
        children: label,
      }),
      jsx("input", {
        type,
        placeholder,
        value,
        onChange,
        className:
          "mt-2 w-full rounded-2xl border border-[#BFA98A] bg-[#F3E7D3] px-4 py-3.5 text-[14px] text-[#292525] placeholder:text-[#8B817D] outline-none transition-all focus:border-[#7A2348] focus:ring-2 focus:ring-[#7A2348]/10",
      }),
    ],
  });
}
