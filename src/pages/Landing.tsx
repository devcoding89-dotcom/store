import { useState } from 'react'
import { ArrowDown, ArrowRight, BadgeCheck, Check, CircleHelp, Menu, MessageCircle, PackageCheck, Search, ShieldCheck, ShoppingBag, Sparkles, X } from 'lucide-react'
import { CustomerAccount } from '@/sections/CustomerAccount'
import { CATEGORIES } from '@/lib/catalog'
import type { User } from '@/types/marketplace'

type LandingProps = {
  onLoginSuccess: (user: User) => void
}

const benefits = [
  {
    icon: BadgeCheck,
    title: 'Verified local sellers',
    description: 'Shop with more confidence. We bring trusted marketplace sellers together in one place.',
  },
  {
    icon: Sparkles,
    title: 'A little help negotiating',
    description: 'Chat with Amaka to ask questions and find a price that works for you.',
  },
  {
    icon: ShieldCheck,
    title: 'Your account, your orders',
    description: 'Sign in to keep your delivery details close and check the status of your orders.',
  },
]

const shoppingFeatures = [
  {
    icon: Search,
    title: 'Browse by category',
    description: 'Explore the kinds of things you need, from fashion and textiles to home, beauty, food, and accessories.',
  },
  {
    icon: MessageCircle,
    title: 'Ask before you buy',
    description: 'Use the marketplace chat to ask questions and get help discussing an item or its price.',
  },
  {
    icon: PackageCheck,
    title: 'Keep track of your order',
    description: 'Use your account to check order details and the tracking code provided for your purchase.',
  },
]

const faqs = [
  {
    question: 'Do I need an account to browse the marketplace?',
    answer: 'Yes. Create an account or sign in first; the marketplace is available to signed-in customers.',
  },
  {
    question: 'What do I need to create an account?',
    answer: 'Use an email address and password, and provide your name and delivery phone number. You can also add an address for easier checkout.',
  },
  {
    question: 'Why am I being asked to confirm my email?',
    answer: 'Email confirmation is controlled by the store’s Supabase authentication settings. If confirmation is enabled, follow the link in the email before signing in.',
  },
  {
    question: 'Can I ask about a product or price?',
    answer: 'Yes. Once you sign in, use the marketplace chat to ask questions or discuss an item with the sales assistant.',
  },
  {
    question: 'How do I check an order?',
    answer: 'Sign in and open your account to see orders associated with your account. You can also use an order tracking code when one has been provided.',
  },
]

export default function Landing({ onLoginSuccess }: LandingProps) {
  const [authOpen, setAuthOpen] = useState(false)
  const [isRegister, setIsRegister] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)

  const openAuth = (register: boolean) => {
    setIsRegister(register)
    setAuthOpen(true)
    setMenuOpen(false)
  }

  return (
    <div className="min-h-screen overflow-hidden bg-[#f8faf8] text-slate-950">
      <header className="relative z-10 mx-auto flex max-w-7xl items-center justify-between px-5 py-5 sm:px-8 lg:px-12">
        <a href="#top" className="flex items-center gap-3" aria-label="TownSquare Marketplace home">
          <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-emerald-700 text-xl font-extrabold text-white shadow-lg shadow-emerald-900/15">T</span>
          <span>
            <span className="block font-display text-lg font-extrabold leading-tight tracking-tight">TownSquare</span>
            <span className="block text-[10px] font-bold uppercase tracking-[0.2em] text-emerald-700">Marketplace</span>
          </span>
        </a>

        <nav className="hidden items-center gap-8 text-sm font-semibold text-slate-600 md:flex">
          <a href="#why-townsquare" className="transition hover:text-emerald-700">Why TownSquare</a>
          <a href="#categories" className="transition hover:text-emerald-700">Categories</a>
          <a href="#how-it-works" className="transition hover:text-emerald-700">How it works</a>
          <a href="#faq" className="transition hover:text-emerald-700">FAQ</a>
        </nav>

        <div className="hidden items-center gap-3 sm:flex">
          <button onClick={() => openAuth(false)} className="rounded-full px-5 py-2.5 text-sm font-bold text-slate-700 transition hover:bg-white">
            Sign in
          </button>
          <button onClick={() => openAuth(true)} className="inline-flex items-center gap-2 rounded-full bg-emerald-700 px-5 py-2.5 text-sm font-bold text-white shadow-lg shadow-emerald-950/15 transition hover:bg-emerald-800">
            Create account <ArrowRight size={16} />
          </button>
        </div>

        <button
          className="flex h-11 w-11 items-center justify-center rounded-xl border border-slate-200 bg-white sm:hidden"
          aria-label={menuOpen ? 'Close menu' : 'Open menu'}
          onClick={() => setMenuOpen((open) => !open)}
        >
          {menuOpen ? <X size={20} /> : <Menu size={20} />}
        </button>
        {menuOpen && (
          <div className="absolute left-4 right-4 top-[calc(100%-0.5rem)] rounded-2xl border border-slate-200 bg-white p-4 shadow-xl sm:hidden">
            <a href="#why-townsquare" onClick={() => setMenuOpen(false)} className="block rounded-lg px-3 py-3 text-sm font-semibold text-slate-700">Why TownSquare</a>
            <a href="#categories" onClick={() => setMenuOpen(false)} className="block rounded-lg px-3 py-3 text-sm font-semibold text-slate-700">Categories</a>
            <a href="#how-it-works" onClick={() => setMenuOpen(false)} className="block rounded-lg px-3 py-3 text-sm font-semibold text-slate-700">How it works</a>
            <a href="#faq" onClick={() => setMenuOpen(false)} className="block rounded-lg px-3 py-3 text-sm font-semibold text-slate-700">FAQ</a>
            <button onClick={() => openAuth(false)} className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-3 text-sm font-bold">Sign in</button>
            <button onClick={() => openAuth(true)} className="mt-2 w-full rounded-xl bg-emerald-700 px-4 py-3 text-sm font-bold text-white">Create your account</button>
          </div>
        )}
      </header>

      <main id="top">
        <section className="relative mx-auto grid max-w-7xl items-center gap-12 px-5 pb-20 pt-10 sm:px-8 sm:pb-28 sm:pt-16 lg:grid-cols-[1.03fr_.97fr] lg:px-12 lg:pb-32 lg:pt-16">
          <div className="relative z-[1]">
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-white/80 px-3.5 py-2 text-xs font-bold text-emerald-800 shadow-sm">
              <span className="h-2 w-2 rounded-full bg-emerald-500" />
              YOUR NEIGHBORHOOD, ALL IN ONE MARKET
            </div>
            <h1 className="max-w-2xl font-display text-5xl font-extrabold leading-[1.04] tracking-[-0.055em] sm:text-6xl lg:text-[4.5rem]">
              Good finds.
              <br />
              <span className="text-emerald-700">Good people.</span>
              <br />
              Right around you.
            </h1>
            <p className="mt-6 max-w-xl text-base leading-7 text-slate-600 sm:text-lg sm:leading-8">
              Discover everyday essentials from local sellers, ask questions, bargain with Amaka, and keep your orders together in one simple marketplace.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <button onClick={() => openAuth(true)} className="inline-flex min-h-14 items-center justify-center gap-2 rounded-full bg-emerald-700 px-7 text-sm font-bold text-white shadow-xl shadow-emerald-950/15 transition hover:-translate-y-0.5 hover:bg-emerald-800">
                Create your free account <ArrowRight size={17} />
              </button>
              <button onClick={() => openAuth(false)} className="inline-flex min-h-14 items-center justify-center rounded-full border border-slate-300 bg-white/80 px-7 text-sm font-bold text-slate-800 transition hover:border-emerald-600 hover:text-emerald-800">
                I already have an account
              </button>
            </div>
            <div className="mt-6 flex flex-wrap items-center gap-x-5 gap-y-2 text-xs font-medium text-slate-500">
              <span className="inline-flex items-center gap-1.5"><Check size={14} className="text-emerald-700" /> Free to join</span>
              <span className="inline-flex items-center gap-1.5"><Check size={14} className="text-emerald-700" /> Your own private account</span>
              <span className="inline-flex items-center gap-1.5"><Check size={14} className="text-emerald-700" /> Made for mobile</span>
            </div>
          </div>

          <div className="relative mx-auto w-full max-w-[590px]">
            <div className="absolute -right-8 -top-12 h-44 w-44 rounded-full bg-lime-200/70 blur-3xl" />
            <div className="absolute -bottom-10 -left-8 h-48 w-48 rounded-full bg-emerald-200/70 blur-3xl" />
            <div className="relative overflow-hidden rounded-[2rem] border-[7px] border-white bg-emerald-950 shadow-2xl shadow-emerald-950/20">
              <div className="absolute inset-0 bg-gradient-to-br from-emerald-950/10 via-transparent to-emerald-950/70" />
              <img src="/img/hero.jpg" alt="A lively local marketplace" className="aspect-[1.12/1] w-full object-cover" />
              <div className="absolute inset-x-0 bottom-0 p-5 sm:p-7">
                <div className="rounded-2xl border border-white/25 bg-white/95 p-4 shadow-xl backdrop-blur sm:p-5">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="text-[10px] font-extrabold uppercase tracking-[0.18em] text-emerald-700">Your local marketplace</p>
                      <p className="mt-1 font-display text-lg font-extrabold tracking-tight sm:text-xl">Find what you need. Meet who sells it.</p>
                    </div>
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-100 text-emerald-800"><ShoppingBag size={19} /></span>
                  </div>
                  <div className="mt-4 flex items-center gap-2 border-t border-slate-100 pt-3 text-xs font-semibold text-slate-500">
                    <span className="flex -space-x-2">
                      <span className="h-6 w-6 rounded-full border-2 border-white bg-amber-300" />
                      <span className="h-6 w-6 rounded-full border-2 border-white bg-rose-300" />
                      <span className="h-6 w-6 rounded-full border-2 border-white bg-sky-300" />
                    </span>
                    Local sellers, one friendly place
                  </div>
                </div>
              </div>
            </div>
            <div className="absolute -left-3 top-8 hidden items-center gap-3 rounded-2xl border border-white bg-white px-4 py-3 shadow-xl sm:flex lg:-left-12">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-100 text-emerald-800"><BadgeCheck size={20} /></span>
              <span><span className="block text-sm font-extrabold">Verified sellers</span><span className="text-xs text-slate-500">Shop with confidence</span></span>
            </div>
          </div>
        </section>

        <section id="why-townsquare" className="border-y border-slate-200/80 bg-white py-16 sm:py-20">
          <div className="mx-auto max-w-7xl px-5 sm:px-8 lg:px-12">
            <div className="max-w-2xl">
              <p className="text-xs font-extrabold uppercase tracking-[0.2em] text-emerald-700">Shopping, made more human</p>
              <h2 className="mt-3 font-display text-3xl font-extrabold tracking-tight sm:text-4xl">A better way to shop your local market.</h2>
              <p className="mt-4 leading-7 text-slate-600">Sign in to get to the marketplace. Your account helps keep your details and orders in one place.</p>
            </div>
            <div className="mt-10 grid gap-4 md:grid-cols-3">
              {benefits.map(({ icon: Icon, title, description }, index) => (
                <article key={title} className="rounded-2xl border border-slate-200 bg-[#fbfcfb] p-6 sm:p-7">
                  <span className={`flex h-12 w-12 items-center justify-center rounded-2xl ${index === 1 ? 'bg-amber-100 text-amber-800' : 'bg-emerald-100 text-emerald-800'}`}>
                    <Icon size={22} />
                  </span>
                  <h3 className="mt-5 font-display text-lg font-extrabold">{title}</h3>
                  <p className="mt-2 text-sm leading-6 text-slate-600">{description}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section id="categories" className="scroll-mt-10 bg-[#f1f5f1] py-16 sm:py-20">
          <div className="mx-auto max-w-7xl px-5 sm:px-8 lg:px-12">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
              <div className="max-w-2xl">
                <p className="text-xs font-extrabold uppercase tracking-[0.2em] text-emerald-700">A little bit of everything</p>
                <h2 className="mt-3 font-display text-3xl font-extrabold tracking-tight sm:text-4xl">Explore the marketplace by category.</h2>
                <p className="mt-3 leading-7 text-slate-600">Here are some of the product categories you can discover after signing in.</p>
              </div>
              <button onClick={() => openAuth(true)} className="inline-flex min-h-12 items-center justify-center gap-2 self-start rounded-full border border-emerald-800/20 bg-white px-5 text-sm font-bold text-emerald-800 transition hover:bg-emerald-50 sm:self-auto">
                Join to explore <ArrowRight size={16} />
              </button>
            </div>
            <div className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-4">
              {CATEGORIES.map((category) => (
                <article key={category.name} className="group overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-lg">
                  <div className="aspect-[1.2/1] overflow-hidden bg-slate-100">
                    <img src={category.image} alt="" loading="lazy" className="h-full w-full object-cover transition duration-500 group-hover:scale-105" />
                  </div>
                  <h3 className="px-3 py-3 text-sm font-extrabold text-slate-800 sm:px-4 sm:py-4">{category.name}</h3>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="bg-white py-16 sm:py-20">
          <div className="mx-auto grid max-w-7xl gap-10 px-5 sm:px-8 lg:grid-cols-[.8fr_1.2fr] lg:px-12">
            <div>
              <p className="text-xs font-extrabold uppercase tracking-[0.2em] text-emerald-700">Made for the way you shop</p>
              <h2 className="mt-3 font-display text-3xl font-extrabold tracking-tight sm:text-4xl">From finding it to following up.</h2>
              <p className="mt-4 max-w-md leading-7 text-slate-600">TownSquare brings product discovery, helpful conversations, and order information into one marketplace experience.</p>
              <button onClick={() => openAuth(true)} className="mt-6 inline-flex items-center gap-2 rounded-full bg-emerald-700 px-6 py-3.5 text-sm font-bold text-white transition hover:bg-emerald-800">
                Get started <ArrowRight size={16} />
              </button>
            </div>
            <div className="grid gap-3">
              {shoppingFeatures.map(({ icon: Icon, title, description }, index) => (
                <article key={title} className="flex gap-4 rounded-2xl border border-slate-200 bg-[#fbfcfb] p-5 sm:p-6">
                  <span className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${index === 1 ? 'bg-amber-100 text-amber-800' : 'bg-emerald-100 text-emerald-800'}`}><Icon size={20} /></span>
                  <div>
                    <h3 className="font-display font-extrabold">{title}</h3>
                    <p className="mt-1 text-sm leading-6 text-slate-600">{description}</p>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section id="how-it-works" className="mx-auto grid max-w-7xl gap-10 px-5 py-16 sm:px-8 sm:py-20 lg:grid-cols-[.8fr_1.2fr] lg:px-12">
          <div>
            <p className="text-xs font-extrabold uppercase tracking-[0.2em] text-emerald-700">Easy as 1, 2, 3</p>
            <h2 className="mt-3 font-display text-3xl font-extrabold tracking-tight sm:text-4xl">Your next good find is close.</h2>
            <button onClick={() => openAuth(true)} className="mt-6 inline-flex items-center gap-2 rounded-full bg-slate-950 px-6 py-3.5 text-sm font-bold text-white transition hover:bg-emerald-800">
              Join TownSquare <ArrowRight size={16} />
            </button>
          </div>
          <div className="grid gap-3 sm:grid-cols-3">
            {[
              ['01', 'Create your account', 'A quick sign-up gets you into the marketplace.'],
              ['02', 'Explore local finds', 'Browse products and talk with sellers.'],
              ['03', 'Order with confidence', 'Keep your delivery details and orders together.'],
            ].map(([number, title, description]) => (
              <div key={number} className="rounded-2xl border border-slate-200 bg-white p-5">
                <span className="font-mono text-xs font-bold text-emerald-700">{number}</span>
                <h3 className="mt-5 font-display font-extrabold">{title}</h3>
                <p className="mt-2 text-sm leading-6 text-slate-600">{description}</p>
              </div>
            ))}
          </div>
        </section>

        <section id="faq" className="scroll-mt-10 border-t border-slate-200 bg-white py-16 sm:py-20">
          <div className="mx-auto grid max-w-7xl gap-10 px-5 sm:px-8 lg:grid-cols-[.7fr_1.3fr] lg:px-12">
            <div>
              <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-800"><CircleHelp size={23} /></span>
              <p className="mt-5 text-xs font-extrabold uppercase tracking-[0.2em] text-emerald-700">Good to know</p>
              <h2 className="mt-3 font-display text-3xl font-extrabold tracking-tight sm:text-4xl">Questions before you join?</h2>
              <p className="mt-4 leading-7 text-slate-600">A few quick answers to help you get started.</p>
              <button onClick={() => openAuth(true)} className="mt-6 inline-flex items-center gap-2 font-bold text-emerald-800 hover:text-emerald-950">
                Create your account <ArrowRight size={16} />
              </button>
            </div>
            <div className="divide-y divide-slate-200 border-y border-slate-200">
              {faqs.map(({ question, answer }) => (
                <details key={question} className="group py-5">
                  <summary className="flex cursor-pointer list-none items-center justify-between gap-4 font-display font-extrabold text-slate-900 marker:content-none">
                    {question}
                    <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-slate-100 text-emerald-800 transition group-open:rotate-45"><ArrowRight size={15} /></span>
                  </summary>
                  <p className="mt-3 max-w-2xl pr-8 text-sm leading-6 text-slate-600">{answer}</p>
                </details>
              ))}
            </div>
          </div>
        </section>

        <section className="bg-emerald-950 px-5 py-14 text-white sm:px-8 sm:py-16 lg:px-12">
          <div className="mx-auto flex max-w-7xl flex-col items-start justify-between gap-7 md:flex-row md:items-center">
            <div className="max-w-2xl">
              <p className="text-xs font-extrabold uppercase tracking-[0.2em] text-emerald-300">Ready when you are</p>
              <h2 className="mt-3 font-display text-3xl font-extrabold tracking-tight sm:text-4xl">Your next local find is waiting.</h2>
              <p className="mt-3 leading-7 text-emerald-100/80">Create an account to step inside TownSquare Marketplace.</p>
            </div>
            <button onClick={() => openAuth(true)} className="inline-flex min-h-14 shrink-0 items-center justify-center gap-2 rounded-full bg-white px-7 text-sm font-extrabold text-emerald-950 transition hover:bg-emerald-100">
              Create your account <ArrowRight size={17} />
            </button>
          </div>
        </section>
      </main>

      <footer className="border-t border-slate-200 bg-white">
        <div className="mx-auto flex max-w-7xl flex-col gap-3 px-5 py-6 text-xs text-slate-500 sm:flex-row sm:items-center sm:justify-between sm:px-8 lg:px-12">
          <span>© {new Date().getFullYear()} TownSquare Marketplace</span>
          <button onClick={() => openAuth(false)} className="inline-flex items-center gap-1 self-start font-bold text-emerald-800 sm:self-auto">
            Sign in to your account <ArrowDown className="rotate-[-45deg]" size={14} />
          </button>
        </div>
      </footer>

      {authOpen && (
        <CustomerAccount
          currentUser={null}
          onLoginSuccess={onLoginSuccess}
          onLogout={() => undefined}
          onTrackOrder={() => undefined}
          onClose={() => setAuthOpen(false)}
          initialMode={isRegister ? 'register' : 'login'}
        />
      )}
    </div>
  )
}
