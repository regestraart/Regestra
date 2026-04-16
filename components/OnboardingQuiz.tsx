import React, { useState } from 'react';
import { supabase } from '../lib/supabase';

const P = '#7c3aed';
const P_LIGHT = '#f5f0ff';
const P_BORDER = '#c4b5fd';
const T = '#0d9488';

interface OnboardingQuizProps {
  userId: string;
  userName: string;
  onComplete: (preferences: UserPreferences) => void;
  skipDbWrite?: boolean;
}

export interface UserPreferences {
  styles: string[];
  themes: string[];
  vibe: string;
  intent: string[];
}

const STEPS = [
  {
    id: 'styles',
    eyebrow: 'Step 1 of 4',
    question: 'What kind of art speaks to you?',
    subtitle: 'Select everything that resonates — there are no wrong answers.',
    multi: true,
    options: [
      { value: 'abstract', label: 'Abstract' },
      { value: 'realism', label: 'Realism' },
      { value: 'photography', label: 'Photography' },
      { value: 'digital', label: 'Digital Art' },
      { value: 'sculpture', label: 'Sculpture' },
      { value: 'illustration', label: 'Illustration' },
      { value: 'watercolor', label: 'Watercolor' },
      { value: 'street art', label: 'Street Art' },
      { value: 'ai artwork', label: 'AI Art' },
    ],
  },
  {
    id: 'themes',
    eyebrow: 'Step 2 of 4',
    question: 'What themes draw you in?',
    subtitle: 'Pick as many as you like — this shapes your personal feed.',
    multi: true,
    options: [
      { value: 'nature', label: 'Nature' },
      { value: 'urban', label: 'Urban' },
      { value: 'portrait', label: 'People & Portraits' },
      { value: 'fantasy', label: 'Fantasy' },
      { value: 'history', label: 'History & Culture' },
      { value: 'emotion', label: 'Emotion & Identity' },
      { value: 'architecture', label: 'Architecture' },
      { value: 'animals', label: 'Animals' },
      { value: 'abstract', label: 'Concepts & Ideas' },
    ],
  },
  {
    id: 'vibe',
    eyebrow: 'Step 3 of 4',
    question: "What's your aesthetic?",
    subtitle: 'Choose the one that feels most like you.',
    multi: false,
    options: [
      { value: 'bold', label: 'Bold & Colorful' },
      { value: 'minimal', label: 'Minimal & Clean' },
      { value: 'dark', label: 'Dark & Moody' },
      { value: 'warm', label: 'Warm & Earthy' },
      { value: 'dreamy', label: 'Dreamy & Surreal' },
      { value: 'raw', label: 'Raw & Expressive' },
    ],
  },
  {
    id: 'intent',
    eyebrow: 'Step 4 of 4',
    question: 'What brings you to Regestra?',
    subtitle: 'Select all that apply — we\'ll tailor everything to your goals.',
    multi: true,
    options: [
      { value: 'discover', label: 'Discover new art' },
      { value: 'collect', label: 'Build a collection' },
      { value: 'buy', label: 'Purchase artwork' },
      { value: 'connect', label: 'Connect with artists' },
      { value: 'share', label: 'Share my own work' },
      { value: 'invest', label: 'Art as investment' },
    ],
  },
];

export const OnboardingQuiz: React.FC<OnboardingQuizProps> = ({
  userId, userName, onComplete, skipDbWrite = false,
}) => {
  const [step, setStep] = useState(0);
  const [saving, setSaving] = useState(false);
  const [animKey, setAnimKey] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string | string[]>>({
    styles: [],
    themes: [],
    vibe: '',
    intent: [],
  });

  const current = STEPS[step];
  const isLast = step === STEPS.length - 1;

  const goTo = (next: number) => {
    setStep(next);
    setAnimKey(k => k + 1);
  };

  const toggle = (value: string) => {
    if (current.multi) {
      const arr = (answers[current.id] as string[]) || [];
      setAnswers(prev => ({
        ...prev,
        [current.id]: arr.includes(value)
          ? arr.filter(v => v !== value)
          : [...arr, value],
      }));
    } else {
      setAnswers(prev => ({ ...prev, [current.id]: value }));
    }
  };

  const isSelected = (value: string) => {
    const val = answers[current.id];
    return Array.isArray(val) ? val.includes(value) : val === value;
  };

  const canContinue = () => {
    const val = answers[current.id];
    return Array.isArray(val) ? val.length > 0 : !!val;
  };

  const handleFinish = async () => {
    setSaving(true);
    const preferences: UserPreferences = {
      styles: answers.styles as string[],
      themes: answers.themes as string[],
      vibe: answers.vibe as string,
      intent: answers.intent as string[],
    };
    try {
      if (!skipDbWrite) {
        await supabase
          .from('profiles')
          .update({ preferences, onboarding_completed: true })
          .eq('id', userId);
      }
    } catch { /* non-fatal */ } finally {
      setSaving(false);
      onComplete(preferences);
    }
  };

  const firstName = userName.split(' ')[0];

  return (
    <>
      <style>{`
        @keyframes oq-in {
          from { opacity: 0; transform: translateY(16px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes oq-spin { to { transform: rotate(360deg); } }

        .oq-screen {
          min-height: 100vh;
          background: #faf8ff;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: clamp(16px, 5vw, 40px) clamp(16px, 5vw, 24px);
          font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
          box-sizing: border-box;
        }

        .oq-card {
          width: 100%;
          max-width: 620px;
          background: #ffffff;
          border-radius: 24px;
          border: 1px solid #ede8fb;
          overflow: hidden;
        }

        .oq-header {
          background: linear-gradient(110deg, #7c3aed 0%, #9333ea 50%, #0d9488 100%);
          padding: 18px 28px;
          display: flex;
          align-items: center;
          justify-content: space-between;
        }

        .oq-step-dots {
          display: flex;
          gap: 6px;
          align-items: center;
        }

        .oq-dot {
          width: 6px;
          height: 6px;
          border-radius: 50%;
          background: #e5e0f7;
          transition: all 300ms ease;
        }
        .oq-dot.active {
          width: 20px;
          border-radius: 3px;
          background: rgba(255,255,255,0.95);
        }
        .oq-dot.done {
          background: rgba(255,255,255,0.4);
        }

        .oq-body {
          padding: clamp(24px, 5vw, 36px) clamp(20px, 5vw, 32px) clamp(24px, 5vw, 32px);
        }

        .oq-body-inner {
          animation: oq-in 380ms cubic-bezier(0.16, 1, 0.3, 1) both;
        }

        .oq-eyebrow {
          font-size: 0.7rem;
          font-weight: 700;
          letter-spacing: 0.1em;
          text-transform: uppercase;
          color: ${P};
          margin-bottom: 10px;
        }

        .oq-question {
          font-size: clamp(1.3rem, 4vw, 1.65rem);
          font-weight: 900;
          color: #1a1729;
          letter-spacing: -0.025em;
          line-height: 1.2;
          margin: 0 0 8px;
        }

        .oq-subtitle {
          font-size: 0.85rem;
          color: #9189ab;
          margin: 0 0 28px;
          line-height: 1.5;
        }

        .oq-grid {
          display: grid;
          gap: 8px;
          margin-bottom: 32px;
        }
        .oq-grid-3 { grid-template-columns: repeat(3, 1fr); }
        .oq-grid-2 { grid-template-columns: repeat(2, 1fr); }

        @media (max-width: 480px) {
          .oq-grid-3 { grid-template-columns: repeat(2, 1fr); }
        }

        .oq-option {
          padding: 14px 16px;
          border-radius: 12px;
          border: 1.5px solid #ede8fb;
          background-color: #f0ebff !important;
          background-image: none;
          -webkit-appearance: none;
          appearance: none;
          cursor: pointer;
          transition: border-color 150ms, background 150ms, color 150ms, transform 100ms;
          font-size: 0.875rem;
          font-weight: 600;
          color: #4b4568;
          text-align: center;
          line-height: 1.3;
          display: flex;
          align-items: center;
          justify-content: center;
          min-height: 52px;
          position: relative;
        }
        .oq-option:hover:not(.oq-selected) {
          border-color: ${P_BORDER};
          background-color: #e8f0ff !important;
          background-image: linear-gradient(135deg, #f0ebff 0%, #e8f8f5 100%) !important;
          color: #3b2f7a;
        }
        .oq-option.oq-selected {
          border-color: ${P};
          background-color: #ede8fb !important;
          background-image: linear-gradient(135deg, #ede8fb 0%, #d4f0ec 100%) !important;
          color: ${P};
          font-weight: 700;
        }
        .oq-option.oq-selected::after {
          content: '';
          position: absolute;
          top: 7px;
          right: 8px;
          width: 7px;
          height: 7px;
          border-radius: 50%;
          background: linear-gradient(135deg, ${P}, ${T});
        }
        .oq-option:active { transform: scale(0.97); }

        .oq-divider {
          height: 1px;
          background: #f0eafa;
          margin: 0 -32px 28px;
        }

        .oq-nav {
          display: flex;
          gap: 10px;
          align-items: center;
        }

        .oq-btn-back {
          padding: 0 22px;
          height: 50px;
          border-radius: 12px;
          border: 1.5px solid #ede8fb;
          background: #fff;
          color: #9189ab;
          font-size: 0.875rem;
          font-weight: 700;
          cursor: pointer;
          transition: border-color 150ms, color 150ms;
          white-space: nowrap;
          flex-shrink: 0;
        }
        .oq-btn-back:hover {
          border-color: ${P_BORDER};
          color: ${P};
        }

        .oq-btn-primary {
          flex: 1;
          height: 50px;
          border-radius: 12px;
          border: none;
          background: linear-gradient(110deg, ${P} 0%, #9333ea 50%, ${T} 100%);
          color: #fff;
          font-size: 0.925rem;
          font-weight: 800;
          cursor: pointer;
          letter-spacing: 0.01em;
          transition: opacity 150ms, transform 100ms;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
        }
        .oq-btn-primary:disabled {
          background: #f0eafa;
          color: #c4b5fd;
          cursor: not-allowed;
        }
        .oq-btn-primary:not(:disabled):hover { opacity: 0.9; }
        .oq-btn-primary:not(:disabled):active { transform: scale(0.98); }

        .oq-spinner {
          width: 16px; height: 16px;
          border: 2px solid rgba(255,255,255,0.35);
          border-top-color: #fff;
          border-radius: 50%;
          animation: oq-spin 0.7s linear infinite;
          flex-shrink: 0;
        }

        .oq-skip {
          display: block;
          width: 100%;
          margin-top: 14px;
          background: none;
          border: none;
          font-size: 0.78rem;
          color: #c4b5fd;
          cursor: pointer;
          padding: 4px;
          transition: color 150ms;
          text-align: center;
        }
        .oq-skip:hover { color: ${P}; }

        .oq-welcome-bar {
          padding: 14px 28px;
          background: #f0faf8;
          border-bottom: 1px solid #ccede8;
          font-size: 0.82rem;
          color: #0f6e56;
          font-weight: 600;
        }
        .oq-welcome-name { color: #0d9488; font-weight: 800; }
      `}</style>

      <div className="oq-screen">
        <div className="oq-card">

          {/* Header */}
          <div className="oq-header">
            <div />
            <div className="oq-step-dots">
              {STEPS.map((_, i) => (
                <div
                  key={i}
                  className={`oq-dot${i === step ? ' active' : i < step ? ' done' : ''}`}
                />
              ))}
            </div>
          </div>

          {/* Welcome bar */}
          <div className="oq-welcome-bar">
            Welcome, <span className="oq-welcome-name">{firstName}</span> — let's build your personal art experience.
          </div>

          {/* Body */}
          <div className="oq-body">
            <div className="oq-body-inner" key={animKey}>

              <div className="oq-eyebrow">{current.eyebrow}</div>
              <h2 className="oq-question">{current.question}</h2>
              <p className="oq-subtitle">{current.subtitle}</p>

              {/* Options */}
              <div className={`oq-grid ${current.options.length <= 6 ? 'oq-grid-2' : 'oq-grid-3'}`}>
                {current.options.map(opt => (
                  <button
                    key={opt.value}
                    className={`oq-option${isSelected(opt.value) ? ' oq-selected' : ''}`}
                    onClick={() => toggle(opt.value)}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>

              <div className="oq-divider" />

              {/* Navigation */}
              <div className="oq-nav">
                {step > 0 && (
                  <button className="oq-btn-back" onClick={() => goTo(step - 1)}>
                    Back
                  </button>
                )}
                <button
                  className="oq-btn-primary"
                  onClick={isLast ? handleFinish : () => goTo(step + 1)}
                  disabled={!canContinue() || saving}
                >
                  {saving ? (
                    <><div className="oq-spinner" /> Saving…</>
                  ) : isLast ? (
                    'Discover Your Feed'
                  ) : (
                    'Continue'
                  )}
                </button>
              </div>

              {!isLast && (
                <button className="oq-skip" onClick={() => goTo(step + 1)}>
                  Skip this question
                </button>
              )}

            </div>
          </div>

        </div>
      </div>
    </>
  );
};
