import { Link } from 'react-router-dom'
import AccordionItem from '../components/AccordionItem.jsx'
import FeatureCard from '../components/FeatureCard.jsx'
import TestimonialCard from '../components/TestimonialCard.jsx'

const STEPS = [
  {
    number: '01',
    title: 'Create your account',
    text: 'Sign up in under a minute — just your name, email, password and where you are.',
  },
  {
    number: '02',
    title: 'Pick your local governments',
    text: 'Choose up to 3 Lagos local governments during registration so we know which communities you belong to.',
  },
  {
    number: '03',
    title: 'Get notified',
    text: 'When something happens at your location, everyone there hears about it instantly.',
  },
]

const FEATURES = [
  {
    title: 'Same-location alerts',
    text: 'Only people who selected the same location receive your notification — no noise, no spam.',
    icon: <path d="M12 21s7-5.5 7-11a7 7 0 1 0-14 0c0 5.5 7 11 7 11z" />,
  },
  {
    title: 'Real-time delivery',
    text: 'Alerts land the moment they are sent, so nobody at your spot misses what matters.',
    icon: <path d="M13 2 4 14h7l-1 8 9-12h-7l1-8z" />,
  },
  {
    title: 'Simple registration',
    text: 'Name, email, password, location — that is the whole sign-up flow. Done before your tea cools.',
    icon: (
      <>
        <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
        <circle cx="9" cy="7" r="4" />
        <path d="M19 8v6M22 11h-6" />
      </>
    ),
  },
  {
    title: 'Location-based community',
    text: 'Connect naturally with people around you — from Ikeja to Lagos Island, your LGA to your street.',
    icon: (
      <>
        <circle cx="12" cy="12" r="9" />
        <path d="M3 12h18M12 3a15 15 0 0 1 0 18 15 15 0 0 1 0-18z" />
      </>
    ),
  },
  {
    title: 'Private by design',
    text: 'Your location is only used to match you with your community. We never sell your data.',
    icon: (
      <>
        <rect x="4" y="10" width="16" height="11" rx="2" />
        <path d="M8 10V7a4 4 0 0 1 8 0v3" />
      </>
    ),
  },
  {
    title: 'Works everywhere',
    text: 'Install it like a native app on your phone or desktop — even when you are offline.',
    icon: (
      <>
        <rect x="6" y="2" width="12" height="20" rx="2.5" />
        <path d="M11 18.5h2" />
      </>
    ),
  },
]

const STATS = [
  { value: '120k+', label: 'People onboard' },
  { value: '20', label: 'Lagos LGAs covered' },
  { value: '2.4M', label: 'Notifications sent' },
  { value: '<1s', label: 'Average delivery' },
]

const TESTIMONIALS = [
  {
    quote:
      'When the flood started on our street, the alert reached everybody before the water even reached the junction. E don save us serious wahala.',
    name: 'Chinedu Okafor',
    role: 'Resident, Lagos',
    initials: 'CO',
  },
  {
    quote:
      'I set my location once during registration and now I know exactly when something happens around my campus. Simple and honestly addictive.',
    name: 'Ama Mensah',
    role: 'Student, Accra',
    initials: 'AM',
  },
  {
    quote:
      'Our market association uses it for closure notices. Everyone at the same location gets the message — no more rumours.',
    name: 'Bisi Adeyemi',
    role: 'Trader, Ibadan',
    initials: 'BA',
  },
]

const FAQS = [
  {
    q: 'What is "E don happen"?',
    a: 'It is a location-based notification app. You register and pick up to 3 Lagos local governments, and from then on you receive notifications from — and send notifications to — everyone who selected the same location.',
  },
  {
    q: 'How do local governments work?',
    a: 'During registration you pick up to 3 of the 20 Lagos local governments (Ikeja, Surulere, Lagos Island…). Those LGAs become your communities, and you receive notifications from all of them.',
  },
  {
    q: 'Is it free to use?',
    a: 'Yes. Creating an account, receiving notifications and sending them to people at your location is completely free.',
  },
  {
    q: 'Who can see my location?',
    a: 'Nobody sees your precise address. Your selected local governments only match you into communities — other members see notifications, not where you live.',
  },
  {
    q: 'Do I need to keep the app open?',
    a: 'No. Once installed as a PWA on your phone or computer, "E don happen" can alert you even when it is running in the background.',
  },
]

export default function Landing() {
  return (
    <>
      {/* Hero */}
      <section id="hero" className="relative overflow-hidden bg-white">
        <div
          aria-hidden
          className="pointer-events-none absolute -top-32 right-[-10%] size-[28rem] rounded-full bg-primary/15 blur-3xl"
        />
        <div
          aria-hidden
          className="pointer-events-none absolute bottom-[-40%] left-[-15%] size-[26rem] rounded-full bg-ink/5 blur-3xl"
        />
        <div className="container-app relative grid items-center gap-12 py-16 sm:py-20 lg:grid-cols-2 lg:py-24">
          <div>
            {/* <span className="inline-flex items-center gap-2 rounded-full border border-primary/40 bg-primary-soft px-4 py-1.5 text-xs font-semibold text-ink">
              <span className="size-1.5 animate-pulse rounded-full bg-primary" />
              Live across Lagos
            </span> */}
            <h1 className="mt-5 text-4xl font-black leading-[1.05] tracking-tight text-ink sm:text-5xl lg:text-6xl">
              Something happen?
              <br />
              <span className="text-primary-dark">E don happen.</span>
            </h1>
            <p className="mt-5 max-w-lg text-base leading-relaxed text-ink-soft sm:text-lg">
              Pick up to 3 Lagos local governments at sign-up and get notified the moment
              something happens where you are. Everyone at the same spot, one alert — no noise
              from anywhere else.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link to="/register" className="btn-primary">
                Get started free
                <svg viewBox="0 0 24 24" className="size-4" fill="none" stroke="currentColor" strokeWidth="2.2">
                  <path d="M5 12h14M13 6l6 6-6 6" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </Link>
              <a href="#how-it-works" className="btn-outline">
                See how it works
              </a>
            </div>
            <div className="mt-8 flex items-center gap-4 text-sm text-ink-soft">
              <div className="flex -space-x-2">
                {['CO', 'AM', 'BA', 'UD'].map((initials) => (
                  <span
                    key={initials}
                    className="grid size-9 place-items-center rounded-full border-2 border-white bg-ink text-[10px] font-bold text-white"
                  >
                    {initials}
                  </span>
                ))}
              </div>
              <p>
                <span className="font-semibold text-ink">120,000+</span> people already
                hearing it first
              </p>
            </div>
          </div>

          {/* App mockup */}
          <div className="relative mx-auto w-full max-w-sm">
            <div className="rounded-[2rem] border border-ink/10 bg-ink p-3 shadow-2xl shadow-ink/20">
              <div className="rounded-[1.5rem] bg-white">
                <div className="flex items-center justify-between border-b border-ink/10 px-4 py-3">
                  <span className="text-sm font-bold text-ink">E don happen</span>
                  <span className="flex items-center gap-1.5 rounded-full bg-primary-soft px-2.5 py-1 text-[10px] font-semibold text-ink">
                    <span className="size-1.5 rounded-full bg-primary" />
                    Ikeja +2
                  </span>
                </div>
                <div className="space-y-3 p-4">
                  {[
                    { name: 'Tunde B.', text: 'Traffic blocked at Third Mainland Bridge.', time: 'now' },
                    { name: 'Amaka N.', text: 'Power just restored in Yaba!', time: '2m' },
                    { name: 'Segun A.', text: 'Free concert starting at the park.', time: '9m' },
                  ].map((alert) => (
                    <div key={alert.name} className="rounded-xl border border-ink/10 bg-white p-3 shadow-sm">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold text-ink">{alert.name}</span>
                        <span className="text-[10px] text-ink-soft">{alert.time}</span>
                      </div>
                      <p className="mt-1 text-xs leading-relaxed text-ink-soft">{alert.text}</p>
                    </div>
                  ))}
                  <div className="flex items-center gap-2 rounded-xl bg-primary-soft p-3">
                    <span className="grid size-7 place-items-center rounded-full bg-primary text-xs font-black text-ink">
                      !
                    </span>
                    <p className="text-[11px] font-semibold text-ink">
                      3 new notifications at your location
                    </p>
                  </div>
                </div>
              </div>
            </div>
            <span className="absolute -right-4 -top-4 rounded-full bg-primary px-3 py-1.5 text-xs font-bold text-ink shadow-lg">
              Live
            </span>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section id="how-it-works" className="bg-ink py-16 sm:py-20">
        <div className="container-app">
          <div className="mx-auto max-w-2xl text-center">
            <span className="text-xs font-bold uppercase tracking-[0.2em] text-primary">
              How it works
            </span>
            <h2 className="mt-3 text-3xl font-extrabold tracking-tight text-white sm:text-4xl">
              Three steps. That is all.
            </h2>
            <p className="mt-4 text-sm leading-relaxed text-white/60 sm:text-base">
              From sign-up to your first alert in less than two minutes.
            </p>
          </div>
          <div className="mt-12 grid gap-6 md:grid-cols-3">
            {STEPS.map((step) => (
              <div
                key={step.number}
                className="relative rounded-2xl border border-white/10 bg-white/5 p-7 transition hover:border-primary/50 hover:bg-white/10"
              >
                <span className="text-4xl font-black text-primary">{step.number}</span>
                <h3 className="mt-4 text-lg font-bold text-white">{step.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-white/60">{step.text}</p>
              </div>
            ))}
          </div>
          <div className="mt-10 text-center">
            <Link to="/register" className="btn-primary">
              Create your free account
            </Link>
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="bg-white py-16 sm:py-20">
        <div className="container-app">
          <div className="mx-auto max-w-2xl text-center">
            <span className="text-xs font-bold uppercase tracking-[0.2em] text-primary-dark">
              Features
            </span>
            <h2 className="mt-3 text-3xl font-extrabold tracking-tight text-ink sm:text-4xl">
              Built for people at the same place
            </h2>
            <p className="mt-4 text-sm leading-relaxed text-ink-soft sm:text-base">
              Everything you need to know about what's happening around you — nothing you don't.
            </p>
          </div>
          <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {FEATURES.map((feature) => (
              <FeatureCard key={feature.title} title={feature.title} icon={feature.icon}>
                {feature.text}
              </FeatureCard>
            ))}
          </div>
        </div>
      </section>

      {/* Social proof */}
      <section className="bg-primary-soft py-16 sm:py-20">
        <div className="container-app">
          <div className="grid gap-8 rounded-3xl bg-white p-8 shadow-lg sm:grid-cols-2 lg:grid-cols-4">
            {STATS.map((stat) => (
              <div key={stat.label} className="text-center">
                <p className="text-3xl font-black tracking-tight text-ink sm:text-4xl">
                  {stat.value}
                </p>
                <p className="mt-1 text-sm text-ink-soft">{stat.label}</p>
              </div>
            ))}
          </div>

          <div className="mx-auto mt-16 max-w-2xl text-center">
            <span className="text-xs font-bold uppercase tracking-[0.2em] text-primary-dark">
              Testimonials
            </span>
            <h2 className="mt-3 text-3xl font-extrabold tracking-tight text-ink sm:text-4xl">
              People are already hearing it first
            </h2>
          </div>
          <div className="mt-10 grid gap-6 md:grid-cols-3">
            {TESTIMONIALS.map((testimonial) => (
              <TestimonialCard key={testimonial.name} {...testimonial} />
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" className="bg-white py-16 sm:py-20">
        <div className="container-app grid gap-10 lg:grid-cols-[1fr_1.4fr]">
          <div>
            <span className="text-xs font-bold uppercase tracking-[0.2em] text-primary-dark">
              FAQ
            </span>
            <h2 className="mt-3 text-3xl font-extrabold tracking-tight text-ink sm:text-4xl">
              Frequently asked questions
            </h2>
            <p className="mt-4 text-sm leading-relaxed text-ink-soft">
              Everything else you might want to know before you join. Still curious?{' '}
              <a
                href="mailto:hello@edonhappen.app"
                className="font-semibold text-primary-dark underline-offset-4 hover:underline"
              >
                Send us a message
              </a>
              .
            </p>
          </div>
          <div className="border-t border-ink/10">
            {FAQS.map((faq, index) => (
              <AccordionItem key={faq.q} question={faq.q} defaultOpen={index === 0}>
                {faq.a}
              </AccordionItem>
            ))}
          </div>
        </div>
      </section>

      {/* CTA band */}
      <section className="bg-primary py-16 sm:py-20">
        <div className="container-app text-center">
          <h2 className="mx-auto max-w-2xl text-3xl font-black tracking-tight text-ink sm:text-4xl">
            Your location is already talking. E don happen — go hear am.
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-sm leading-relaxed text-ink/70 sm:text-base">
            Join thousands who get the news from their own location first. Free forever.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Link to="/register" className="btn bg-ink text-white hover:bg-black">
              Sign up now
            </Link>
            <Link to="/login" className="btn border-2 border-ink/25 text-ink hover:bg-ink/10">
              I already have an account
            </Link>
          </div>
        </div>
      </section>
    </>
  )
}
