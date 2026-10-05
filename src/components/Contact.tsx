import React, { useState } from 'react';
import { Mail, Phone, MapPin, Send, CheckCircle2, AlertCircle } from 'lucide-react';
import { motion } from 'motion/react';
import { usePortfolio } from '../context/PortfolioContext';

interface FormState {
  name: string;
  email: string;
  project: string;
  message: string;
}

interface FormErrors {
  name?: string;
  email?: string;
  project?: string;
  message?: string;
}

export const Contact: React.FC = () => {
  const { data, triggerSfx } = usePortfolio();
  const { contact } = data;

  const [form, setForm] = useState<FormState>({
    name: '',
    email: '',
    project: '',
    message: '',
  });
  const [errors, setErrors] = useState<FormErrors>({});
  const [submitting, setSubmitting] = useState(false);
  const [submittedSuccess, setSubmittedSuccess] = useState(false);

  const validate = (): boolean => {
    const newErrors: FormErrors = {};
    if (!form.name.trim() || form.name.trim().length < 2) {
      newErrors.name = 'Please enter your name.';
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!form.email.trim() || !emailRegex.test(form.email.trim())) {
      newErrors.email = 'Please enter a valid email address.';
    }
    if (!form.project.trim()) {
      newErrors.project = 'Please specify your project type (e.g., YouTube Video, Reels, Commercial).';
    }
    if (!form.message.trim() || form.message.trim().length < 10) {
      newErrors.message = 'Please write a short message (at least 10 characters).';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    triggerSfx('contact');
    setSubmitting(true);

    // Format exact WhatsApp prefilled message and open wa.me/<number>?text=<encoded_message>
    const rawWhatsAppNumber = contact.whatsappNumber || contact.phone || '+917654800013';
    const cleanDigits = rawWhatsAppNumber.replace(/[^0-9]/g, '');

    const whatsappText = `Hello Ranjan,

Name: ${form.name.trim()}
Email: ${form.email.trim()}
Project: ${form.project.trim()}
Message: ${form.message.trim()}`;

    const whatsappUrl = `https://wa.me/${cleanDigits}?text=${encodeURIComponent(whatsappText)}`;

    // Open WhatsApp via anchor element click with target="_blank" so it works cleanly across desktop & mobile
    const link = document.createElement('a');
    link.href = whatsappUrl;
    link.target = '_blank';
    link.rel = 'noopener noreferrer';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    setTimeout(() => {
      setSubmitting(false);
      setSubmittedSuccess(true);
      setForm({ name: '', email: '', project: '', message: '' });
      setErrors({});
    }, 300);
  };

  return (
    <section id="contact" className="py-6 sm:py-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="glass-panel rounded-[32px] p-6 sm:p-10 relative overflow-hidden">
          {/* Decorative Soft Glass Orb Accent in Bottom-Right matching reference */}
          <div
            className="hidden lg:block absolute -right-12 -bottom-12 w-56 h-56 rounded-full bg-gradient-to-tr from-[#6C63FF]/25 via-[#8B5CF6]/20 to-sky-300/30 blur-xl pointer-events-none"
            aria-hidden="true"
          />

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start relative z-10">
            {/* Left Side: Contact Information */}
            <motion.div
              initial={{ opacity: 0, y: 18 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4 }}
              className="lg:col-span-5 space-y-6"
            >
              <div className="space-y-2">
                <span className="text-xs font-bold tracking-[0.16em] uppercase text-[#6C63FF]">
                  LET&apos;S CONNECT
                </span>
                <h2 className="text-2xl sm:text-3xl font-extrabold text-[#10152B] tracking-tight">
                  {contact.heading}
                </h2>
                <p className="text-sm sm:text-[15px] text-[#667085]">
                  {contact.subheading}
                </p>
              </div>

              <div className="space-y-4 pt-2">
                {/* Email */}
                <a
                  href={`mailto:${contact.email}`}
                  className="glass-card rounded-2xl p-4 flex items-center gap-4 hover:-translate-y-0.5 transition-transform duration-200 group"
                >
                  <div className="w-10 h-10 rounded-xl bg-indigo-50 text-[#6C63FF] flex items-center justify-center shrink-0 group-hover:bg-[#6C63FF] group-hover:text-white transition-colors">
                    <Mail className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-[11px] font-semibold uppercase tracking-wider text-[#667085]">
                      Email
                    </p>
                    <p className="text-sm font-bold text-[#10152B] truncate">
                      {contact.email}
                    </p>
                  </div>
                </a>

                {/* Phone */}
                <a
                  href={`tel:${contact.phone.replace(/\s+/g, '')}`}
                  className="glass-card rounded-2xl p-4 flex items-center gap-4 hover:-translate-y-0.5 transition-transform duration-200 group"
                >
                  <div className="w-10 h-10 rounded-xl bg-purple-50 text-[#8B5CF6] flex items-center justify-center shrink-0 group-hover:bg-[#8B5CF6] group-hover:text-white transition-colors">
                    <Phone className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="text-[11px] font-semibold uppercase tracking-wider text-[#667085]">
                      Phone
                    </p>
                    <p className="text-sm font-bold text-[#10152B] tabular-nums">
                      {contact.phone}
                    </p>
                  </div>
                </a>

                {/* Location */}
                <div className="glass-card rounded-2xl p-4 flex items-center gap-4">
                  <div className="w-10 h-10 rounded-xl bg-blue-50 text-[#3B82F6] flex items-center justify-center shrink-0">
                    <MapPin className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="text-[11px] font-semibold uppercase tracking-wider text-[#667085]">
                      Location
                    </p>
                    <p className="text-sm font-bold text-[#10152B]">
                      {contact.location}
                    </p>
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Right Side: Premium Glassmorphism Contact Form */}
            <motion.div
              initial={{ opacity: 0, y: 18 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: 0.08 }}
              className="lg:col-span-7"
            >
              <div className="glass-card rounded-[28px] p-6 sm:p-8">
                {submittedSuccess ? (
                  <div className="py-10 text-center space-y-4">
                    <div className="w-14 h-14 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto">
                      <CheckCircle2 className="w-7 h-7" />
                    </div>
                    <h3 className="text-xl font-bold text-[#10152B]">
                      Message Prepared for WhatsApp!
                    </h3>
                    <p className="text-sm text-[#667085] max-w-md mx-auto">
                      Your project inquiry has been formatted and opened in WhatsApp so you can connect directly with {data.profile.name}.
                    </p>
                    <button
                      type="button"
                      onClick={() => setSubmittedSuccess(false)}
                      className="inline-flex items-center gap-2 px-6 py-2.5 rounded-full bg-[#10152B] text-white text-xs font-semibold hover:bg-[#6C63FF] transition-colors cursor-pointer"
                    >
                      Send Another Message
                    </button>
                  </div>
                ) : (
                  <form onSubmit={handleSubmit} noValidate className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {/* Your Name */}
                      <div>
                        <label
                          htmlFor="contact-name-input"
                          className="block text-xs font-bold text-[#10152B] mb-1.5"
                        >
                          Your Name
                        </label>
                        <input
                          id="contact-name-input"
                          type="text"
                          value={form.name}
                          onChange={(e) => {
                            setForm({ ...form, name: e.target.value });
                            if (errors.name) setErrors({ ...errors, name: undefined });
                          }}
                          placeholder="e.g., Aman Sharma"
                          className={`w-full px-4 py-3 rounded-2xl bg-white/85 border text-sm text-[#10152B] placeholder:text-[#98A2B3] focus:outline-none focus:ring-2 transition-all ${
                            errors.name
                              ? 'border-rose-400 focus:ring-rose-200'
                              : 'border-indigo-100/90 focus:border-[#6C63FF] focus:ring-[#6C63FF]/20'
                          }`}
                        />
                        {errors.name && (
                          <p className="mt-1 text-[11px] font-medium text-rose-600 flex items-center gap-1">
                            <AlertCircle className="w-3 h-3" /> {errors.name}
                          </p>
                        )}
                      </div>

                      {/* Your Email */}
                      <div>
                        <label
                          htmlFor="contact-email-input"
                          className="block text-xs font-bold text-[#10152B] mb-1.5"
                        >
                          Your Email
                        </label>
                        <input
                          id="contact-email-input"
                          type="email"
                          value={form.email}
                          onChange={(e) => {
                            setForm({ ...form, email: e.target.value });
                            if (errors.email) setErrors({ ...errors, email: undefined });
                          }}
                          placeholder="you@example.com"
                          className={`w-full px-4 py-3 rounded-2xl bg-white/85 border text-sm text-[#10152B] placeholder:text-[#98A2B3] focus:outline-none focus:ring-2 transition-all ${
                            errors.email
                              ? 'border-rose-400 focus:ring-rose-200'
                              : 'border-indigo-100/90 focus:border-[#6C63FF] focus:ring-[#6C63FF]/20'
                          }`}
                        />
                        {errors.email && (
                          <p className="mt-1 text-[11px] font-medium text-rose-600 flex items-center gap-1">
                            <AlertCircle className="w-3 h-3" /> {errors.email}
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Your Project */}
                    <div>
                      <label
                        htmlFor="contact-project-input"
                        className="block text-xs font-bold text-[#10152B] mb-1.5"
                      >
                        Your Project
                      </label>
                      <input
                        id="contact-project-input"
                        type="text"
                        value={form.project}
                        onChange={(e) => {
                          setForm({ ...form, project: e.target.value });
                          if (errors.project) setErrors({ ...errors, project: undefined });
                        }}
                        placeholder="Video Editing, Motion Graphics, Color Grading, UGC Reels..."
                        className={`w-full px-4 py-3 rounded-2xl bg-white/85 border text-sm text-[#10152B] placeholder:text-[#98A2B3] focus:outline-none focus:ring-2 transition-all ${
                          errors.project
                            ? 'border-rose-400 focus:ring-rose-200'
                            : 'border-indigo-100/90 focus:border-[#6C63FF] focus:ring-[#6C63FF]/20'
                        }`}
                      />
                      {errors.project && (
                        <p className="mt-1 text-[11px] font-medium text-rose-600 flex items-center gap-1">
                          <AlertCircle className="w-3 h-3" /> {errors.project}
                        </p>
                      )}
                    </div>

                    {/* Your Message */}
                    <div>
                      <label
                        htmlFor="contact-message-input"
                        className="block text-xs font-bold text-[#10152B] mb-1.5"
                      >
                        Your Message
                      </label>
                      <textarea
                        id="contact-message-input"
                        rows={3}
                        value={form.message}
                        onChange={(e) => {
                          setForm({ ...form, message: e.target.value });
                          if (errors.message) setErrors({ ...errors, message: undefined });
                        }}
                        placeholder="Tell me about your project goals, timeline, and style references..."
                        className={`w-full px-4 py-3 rounded-2xl bg-white/85 border text-sm text-[#10152B] placeholder:text-[#98A2B3] focus:outline-none focus:ring-2 transition-all resize-none ${
                          errors.message
                            ? 'border-rose-400 focus:ring-rose-200'
                            : 'border-indigo-100/90 focus:border-[#6C63FF] focus:ring-[#6C63FF]/20'
                        }`}
                      />
                      {errors.message && (
                        <p className="mt-1 text-[11px] font-medium text-rose-600 flex items-center gap-1">
                          <AlertCircle className="w-3 h-3" /> {errors.message}
                        </p>
                      )}
                    </div>

                    <div className="pt-1">
                      <button
                        type="submit"
                        disabled={submitting}
                        onMouseEnter={() => triggerSfx('buttonHover')}
                        className="w-full sm:w-auto inline-flex items-center justify-center gap-2.5 px-8 py-3.5 rounded-full bg-[#10152B] hover:bg-[#6C63FF] text-white text-sm font-semibold shadow-lg shadow-[#10152B]/15 hover:-translate-y-0.5 transition-all duration-200 cursor-pointer disabled:opacity-60"
                      >
                        <span>{submitting ? 'Opening WhatsApp...' : 'Send Message'}</span>
                        <Send className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </form>
                )}
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </section>
  );
};
