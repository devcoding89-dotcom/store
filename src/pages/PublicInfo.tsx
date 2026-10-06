import { type ReactNode } from 'react'
import { ArrowLeft, ArrowRight, CircleHelp, FileText, RotateCcw, ShieldCheck } from 'lucide-react'
import { Link } from 'react-router'
import { MARKETPLACE_CONFIG } from '@/lib/config'

export type PublicInfoPage = 'terms' | 'returns' | 'faq'

const termsSections = [
  {
    title: '1. About TownSquare',
    paragraphs: [
      'TownSquare Marketplace helps customers discover products offered by marketplace sellers and contact the store about orders. Unless a listing says otherwise, the product is offered by the seller shown in the marketplace, not manufactured by TownSquare.',
      'The store’s legal business name, registered address, and support contact should be added here before these terms are treated as final.',
    ],
  },
  {
    title: '2. Accounts and account security',
    paragraphs: [
      'You must provide accurate account and delivery information, keep your password private, and tell us promptly if you believe someone has accessed your account without permission.',
      'You are responsible for activity carried out using your account. We may suspend access where we reasonably believe there is fraud, misuse, or a risk to customers or the marketplace.',
    ],
  },
  {
    title: '3. Listings, prices, and availability',
    paragraphs: [
      'We aim to keep product descriptions, photographs, prices, and availability current, but seller-provided information may change or contain errors. A listing is not a confirmed order or a guarantee that an item remains available.',
      'Any negotiated price, delivery charge, payment method, and order details should be confirmed with the store before an order is fulfilled. Do not send payment to an account that has not been confirmed by the store.',
    ],
  },
  {
    title: '4. Orders, payment, and delivery',
    paragraphs: [
      'An order request is subject to seller availability and confirmation. The store should confirm the final item, total amount, delivery destination, estimated delivery arrangement, and payment instructions with you.',
      'Delivery estimates are estimates, not guaranteed arrival times. You are responsible for providing a complete address and reachable phone number. The store should be contacted promptly if delivery details need to change.',
    ],
  },
  {
    title: '5. Acceptable use',
    paragraphs: [
      'Do not use the marketplace to break the law, submit false order or account information, interfere with the service, access another person’s account, or harass sellers, staff, or other customers.',
    ],
  },
  {
    title: '6. Privacy and service availability',
    paragraphs: [
      'Account details are used to operate sign-in, customer profiles, order handling, and support. Do not include payment card details or passwords in chat or WhatsApp messages.',
      'We work to keep the marketplace available but cannot promise uninterrupted or error-free service. Features may change as the store improves the service.',
    ],
  },
  {
    title: '7. Questions and updates',
    paragraphs: [
      'These terms should be reviewed and updated with the store’s legal identity, privacy notice, governing law, and any consumer rights that apply before public launch. If terms change, the updated version and effective date should be shown on this page.',
    ],
  },
]

const returnSections = [
  {
    title: 'Requesting a return',
    paragraphs: [
      'Proposed starter rule: contact TownSquare within 7 calendar days after delivery to request a return for an eligible non-perishable item. Please include your order code, the reason for the request, and clear photos if the item is damaged, faulty, or different from its listing.',
      'For an item that is damaged, faulty, or incorrect, contact us as soon as you notice the issue and, where possible, within 48 hours of delivery so we can investigate promptly.',
    ],
  },
  {
    title: 'Condition of returned items',
    paragraphs: [
      'Proposed starter rule: items should be unused, unwashed, undamaged, and returned with their original packaging, labels, and included accessories. Some product types may have additional hygiene or safety restrictions.',
    ],
  },
  {
    title: 'Food, personal-care, and perishable items',
    paragraphs: [
      'Proposed starter rule: food, perishable goods, opened personal-care products, and other hygiene-sensitive items are not returnable for change of mind. If one arrives damaged, unsafe, expired, or materially different from what you ordered, contact us immediately with photos and your order code.',
    ],
  },
  {
    title: 'Refunds, replacements, and return delivery',
    paragraphs: [
      'After reviewing a request, the store may offer an eligible refund, replacement, exchange, or another agreed resolution. The store must confirm the outcome and any return instructions before you send an item back.',
      'Proposed starter rule: the store covers reasonable return delivery costs when an item is confirmed faulty, damaged on arrival, or sent in error. For an approved change-of-mind return, the customer pays return delivery. The store should confirm any refund method and timing before approving the return.',
    ],
  },
  {
    title: 'Items that cannot be returned',
    paragraphs: [
      'A change of mind, a size or colour preference where the item matches the listing, or damage caused after delivery may not qualify. This policy does not limit rights you may have under applicable consumer-protection law.',
    ],
  },
  {
    title: 'Contact us before returning anything',
    paragraphs: [
      'Do not send an item back before the store has reviewed your request and provided return instructions. Include your order code in every message so we can find your order.',
    ],
  },
]

const faqItems = [
  {
    question: 'Do I need an account to use the marketplace?',
    answer: 'Yes. Create an account or sign in before entering the marketplace. The public landing page, FAQ, terms, and return policy remain available without signing in.',
  },
  {
    question: 'What information do I need to create an account?',
    answer: 'You need your name, email address, phone number, and a password. You can also add a delivery address. If email confirmation is enabled, confirm your address before signing in.',
  },
  {
    question: 'How do I find products?',
    answer: 'After signing in, browse the available categories or search the marketplace. Product availability and details may change, so confirm important details with the seller before placing an order.',
  },
  {
    question: 'How do I place an order?',
    answer: 'Add products to your cart or discuss an item with Amaka. Enter your name, delivery address, and contact number at checkout. The app saves an order code, then opens WhatsApp so you can confirm the details with the store.',
  },
  {
    question: 'How do I track an order?',
    answer: 'Use the tracking code saved after checkout, or open your account to view orders associated with your account. A code from an unsubmitted chat is not a saved order.',
  },
  {
    question: 'Why did WhatsApp open after checkout?',
    answer: 'The current checkout flow uses WhatsApp for the customer and store to confirm order details. Your app creates the order record first so the order code can be looked up.',
  },
  {
    question: 'How do I request a return or refund?',
    answer: 'Read the proposed return policy on this site and contact the store with your order code before sending anything back. The policy is a draft and should be confirmed by the business before launch.',
  },
  {
    question: 'Who do I contact if something goes wrong?',
    answer: 'Contact the store using the WhatsApp contact shown by the store. Include your order code and a brief description. Add the store’s verified support details to this page before launch.',
  },
]

const pageDetails = {
  terms: {
    eyebrow: 'The important details',
    title: 'Terms & Conditions',
    description: 'The ground rules for using TownSquare Marketplace.',
    icon: FileText,
    sections: termsSections,
  },
  returns: {
    eyebrow: 'If an order is not right',
    title: 'Returns & Refunds',
    description: 'How to ask the store for help with an item or order.',
    icon: RotateCcw,
    sections: returnSections,
  },
}

export function PublicInfo({ page }: { page: PublicInfoPage }) {
  const supportNumber = MARKETPLACE_CONFIG.ownerWhatsApp.replace(/\D/g, '')

  if (page === 'faq') {
    return (
      <InfoLayout>
        <div className="mb-8 flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-800">
          <CircleHelp size={26} />
        </div>
        <p className="text-xs font-extrabold uppercase tracking-[0.2em] text-emerald-700">Here to help</p>
        <h1 className="mt-3 font-display text-4xl font-extrabold tracking-tight sm:text-5xl">Frequently asked questions</h1>
        <p className="mt-4 max-w-2xl leading-7 text-slate-600">Quick answers about accounts, orders, tracking, and returns.</p>
        <div className="mt-10 divide-y divide-slate-200 border-y border-slate-200">
          {faqItems.map(({ question, answer }) => (
            <details key={question} className="group py-5">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-4 font-display font-extrabold text-slate-900 marker:content-none">
                {question}
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-slate-100 text-emerald-800 transition group-open:rotate-45"><ArrowRight size={15} /></span>
              </summary>
              <p className="mt-3 max-w-3xl pr-8 text-sm leading-6 text-slate-600">{answer}</p>
            </details>
          ))}
        </div>
        <div className="mt-8 rounded-2xl border border-emerald-200 bg-emerald-50 p-5">
          <h2 className="font-display font-extrabold text-emerald-950">Still need a hand?</h2>
          <p className="mt-2 text-sm leading-6 text-emerald-900">Contact the store and include your order code if your question is about an order.</p>
          {supportNumber && (
            <a href={`https://wa.me/${supportNumber}`} target="_blank" rel="noreferrer" className="mt-4 inline-flex items-center gap-2 font-bold text-emerald-800 hover:text-emerald-950">
              Contact us on WhatsApp <ArrowRight size={16} />
            </a>
          )}
        </div>
      </InfoLayout>
    )
  }

  const details = pageDetails[page]
  const Icon = details.icon
  const isDraft = page === 'returns'

  return (
    <InfoLayout>
      <div className="mb-8 flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-800"><Icon size={26} /></div>
      <p className="text-xs font-extrabold uppercase tracking-[0.2em] text-emerald-700">{details.eyebrow}</p>
      <h1 className="mt-3 font-display text-4xl font-extrabold tracking-tight sm:text-5xl">{details.title}</h1>
      <p className="mt-4 max-w-2xl leading-7 text-slate-600">{details.description}</p>
      <p className="mt-3 text-xs text-slate-500">Last updated: October 5, 2026</p>

      <div className={`mt-8 flex gap-3 rounded-2xl border p-4 ${isDraft ? 'border-amber-300 bg-amber-50 text-amber-950' : 'border-blue-200 bg-blue-50 text-blue-950'}`}>
        {isDraft ? <ShieldCheck className="mt-0.5 shrink-0" size={19} /> : <FileText className="mt-0.5 shrink-0" size={19} />}
        <p className="text-sm leading-6">
          <strong>{isDraft ? 'Proposed starter policy — review before launch.' : 'Draft for the store owner to review before launch.'}</strong>{' '}
          {isDraft
            ? 'The return windows and cost rules below are suggested defaults, not confirmed business policy. Replace or approve them with your actual rules.'
            : 'This general template is not legal advice. Add your verified business identity, contact details, applicable local requirements, and have the final text reviewed.'}
        </p>
      </div>

      <div className="mt-10 space-y-8">
        {details.sections.map((section) => (
          <section key={section.title} className="border-b border-slate-200 pb-7 last:border-0">
            <h2 className="font-display text-xl font-extrabold tracking-tight">{section.title}</h2>
            <div className="mt-3 space-y-3">
              {section.paragraphs.map((paragraph) => <p key={paragraph} className="text-sm leading-7 text-slate-600">{paragraph}</p>)}
            </div>
          </section>
        ))}
      </div>

      <div className="mt-6 rounded-2xl border border-emerald-200 bg-emerald-50 p-5">
        <h2 className="font-display font-extrabold text-emerald-950">Need help with an order?</h2>
        <p className="mt-2 text-sm leading-6 text-emerald-900">Contact the store before returning anything, and include your order code.</p>
        {supportNumber && (
          <a href={`https://wa.me/${supportNumber}`} target="_blank" rel="noreferrer" className="mt-4 inline-flex items-center gap-2 font-bold text-emerald-800 hover:text-emerald-950">
            Contact us on WhatsApp <ArrowRight size={16} />
          </a>
        )}
      </div>
    </InfoLayout>
  )
}

function InfoLayout({ children }: { children: ReactNode }) {
  return (
    <main className="min-h-screen bg-[#f8faf8] px-4 py-6 text-slate-950 sm:px-8 sm:py-10">
      <div className="mx-auto max-w-4xl">
        <Link to="/" className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2.5 text-sm font-bold text-slate-700 transition hover:border-emerald-300 hover:text-emerald-800">
          <ArrowLeft size={16} /> Back to TownSquare
        </Link>
        <article className="mt-6 rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:mt-8 sm:p-10 lg:p-12">
          {children}
        </article>
        <nav aria-label="Legal and help pages" className="flex flex-wrap gap-x-5 gap-y-2 px-2 py-6 text-sm font-semibold text-slate-600">
          <Link to="/faq" className="hover:text-emerald-800">FAQ</Link>
          <Link to="/returns" className="hover:text-emerald-800">Returns & Refunds</Link>
          <Link to="/terms" className="hover:text-emerald-800">Terms & Conditions</Link>
        </nav>
      </div>
    </main>
  )
}
