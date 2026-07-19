'use client';

import { FormEvent, useState } from 'react';

type Message = {
  role: 'assistant' | 'user';
  content: string;
};

type LanguageCode = 'english' | 'urdu' | 'french';

const languageOptions: Array<{ value: LanguageCode; label: string; greeting: string; placeholder: string; sendLabel: string }> = [
  { value: 'english', label: 'English', greeting: 'Hi! How can I help you today?', placeholder: 'Ask about hours, menu, or reservations', sendLabel: 'Send' },
  { value: 'urdu', label: 'اردو', greeting: 'السلام علیکم! آج میں آپ کی کس طرح مدد کر سکتا ہوں؟', placeholder: 'کلاک کی معلومات، منو، یا رزرو کے بارے میں پوچھیں', sendLabel: 'بھیجیں' },
  { value: 'french', label: 'Français', greeting: 'Bonjour ! Comment puis-je vous aider aujourd’hui ?', placeholder: 'Demandez-nous à propos des horaires, du menu ou des réservations', sendLabel: 'Envoyer' },
];

export default function RestaurantChat() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [draft, setDraft] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [selectedLanguage, setSelectedLanguage] = useState<LanguageCode>('english');

  const openChat = () => {
    setIsOpen(true);
    const initialMessage = languageOptions.find((option) => option.value === selectedLanguage)?.greeting ?? languageOptions[0].greeting;
    setMessages((current) =>
      current.length > 0
        ? current
        : [{ role: 'assistant', content: initialMessage }]
    );
  };

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    const trimmed = draft.trim();
    if (!trimmed || isSending) {
      return;
    }

    const userMessage: Message = { role: 'user', content: trimmed };
    setMessages((current) => [...current, userMessage]);
    setDraft('');
    setIsSending(true);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: trimmed, language: selectedLanguage }),
      });

      const data = await response.json();
      const answer = data?.answer || 'Sorry, I could not answer that right now.';
      setMessages((current) => [...current, { role: 'assistant', content: answer }]);
    } catch {
      const fallback =
        selectedLanguage === 'urdu'
          ? 'معذرت، میں ابھی جواب دینے میں مشکل ہو رہی ہے۔ براہ کرم +1 (206) 555-0148 پر کال کریں۔'
          : selectedLanguage === 'french'
            ? 'Désolé, je rencontre des difficultés pour répondre pour le moment. Veuillez nous appeler au +1 (206) 555-0148.'
            : 'Sorry, I am having trouble answering right now. Please call us at +1 (206) 555-0148.';
      setMessages((current) => [
        ...current,
        {
          role: 'assistant',
          content: fallback,
        },
      ]);
    } finally {
      setIsSending(false);
    }
  };

  const activeLanguage = languageOptions.find((option) => option.value === selectedLanguage) ?? languageOptions[0];

  return (
    <>
      <button
        type="button"
        onClick={() => (isOpen ? setIsOpen(false) : openChat())}
        className="fixed bottom-5 right-5 z-50 flex h-14 w-14 items-center justify-center rounded-full border border-amber-400/30 bg-gradient-to-br from-amber-400 to-orange-500 text-white shadow-2xl shadow-orange-600/30 transition hover:scale-105"
        aria-label="Open restaurant support chat"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="currentColor"
          className="h-7 w-7"
        >
          <path d="M4 6a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H8l-4 3V6Z" />
        </svg>
      </button>

      {isOpen ? (
        <div className="fixed bottom-24 right-4 z-50 flex w-[min(92vw,28rem)] flex-col overflow-hidden rounded-3xl border border-white/10 bg-slate-950/95 shadow-2xl shadow-black/50 backdrop-blur xl:right-6">
          <div className="flex items-center justify-between border-b border-white/10 bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 px-4 py-3">
            <div>
              <p className="text-sm font-semibold text-white">Aurora Bistro Support</p>
              <p className="text-xs text-slate-400">Usually replies in a few seconds</p>
            </div>
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="rounded-full p-2 text-slate-400 transition hover:bg-white/10 hover:text-white"
              aria-label="Close chat"
            >
              ×
            </button>
          </div>

          <div className="flex-1 space-y-3 overflow-y-auto bg-[radial-gradient(circle_at_top_left,_rgba(245,158,11,0.14),_transparent_45%)] p-4">
            <div className="mb-2 flex items-center justify-between rounded-full border border-white/10 bg-slate-900/70 px-3 py-2 text-xs text-slate-300">
              <span>Language</span>
              <select
                value={selectedLanguage}
                onChange={(event) => {
                  const nextValue = event.target.value as LanguageCode;
                  setSelectedLanguage(nextValue);
                  const nextGreeting = languageOptions.find((option) => option.value === nextValue)?.greeting ?? languageOptions[0].greeting;
                  setMessages([{ role: 'assistant', content: nextGreeting }]);
                }}
                className="rounded-full bg-slate-800 px-2 py-1 text-sm text-white outline-none"
              >
                {languageOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
            {messages.map((message, index) => (
              <div
                key={`${message.role}-${index}`}
                className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[85%] rounded-2xl px-3 py-2 text-sm leading-6 ${
                    message.role === 'user'
                      ? 'bg-amber-500 text-slate-950'
                      : 'bg-white/10 text-slate-100'
                  }`}
                >
                  {message.content}
                </div>
              </div>
            ))}
            {isSending ? (
              <div className="flex justify-start">
                <div className="rounded-2xl bg-white/10 px-3 py-2 text-sm text-slate-300">
                  Thinking...
                </div>
              </div>
            ) : null}
          </div>

          <form onSubmit={handleSubmit} className="border-t border-white/10 bg-slate-900/80 p-3">
            <label className="sr-only" htmlFor="restaurant-chat-input">
              Type your message
            </label>
            <div className="flex items-center gap-2 rounded-full border border-white/10 bg-slate-800/90 px-3 py-2">
              <input
                id="restaurant-chat-input"
                value={draft}
                onChange={(event) => setDraft(event.target.value)}
                placeholder={activeLanguage.placeholder}
                className="flex-1 bg-transparent text-sm text-white outline-none placeholder:text-slate-400"
              />
              <button
                type="submit"
                className="rounded-full bg-amber-500 px-3 py-2 text-sm font-semibold text-slate-950 transition hover:bg-amber-400"
              >
                {activeLanguage.sendLabel}
              </button>
            </div>
          </form>
        </div>
      ) : null}
    </>
  );
}
