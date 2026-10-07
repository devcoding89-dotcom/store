import { type ReactNode } from 'react'
import { ArrowLeft, ArrowRight, CircleHelp, FileText, RotateCcw, ShieldCheck } from 'lucide-react'
import { Link } from 'react-router'
import { MARKETPLACE_CONFIG } from '@/lib/config'

export type PublicInfoPage = 'terms' | 'returns' | 'faq'

const termsSections = [
  {
    title: '1. About SHOPLY TOWN',
    paragraphs: [
      'SHOPLY TOWN is the retailer for orders placed through this store and is your point of contact for payment, order support, returns, and delivery. We may source or dispatch products with the help of fulfillment partners. SHOPLY TOWN does not claim to manufacture products unless a listing explicitly says so; product brand and manufacturer details should be checked on the listing or packaging.',
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
      'We aim to keep product descriptions, photographs, prices, and availability current. Product details or availability may change or contain errors. A listing is not a confirmed order or a guarantee that an item remains available.',
      'Any negotiated price, delivery charge, payment method, and order details should be confirmed with the store before an order is fulfilled. Do not send payment to an account that has not been confirmed by the store.',
    ],
  },
  {
    title: '4. Orders, payment, delivery, and replacements',
    paragraphs: [
      'An order request is subject to availability and SHOPLY TOWN confirmation. SHOPLY TOWN should confirm the final item, total amount, delivery destination, estimated delivery arrangement, and payment instructions with you.',
      'Delivery estimates are estimates, not guaranteed arrival times. You are responsible for providing a complete address and reachable phone number. The store should be contacted promptly if delivery details need to change.',
      'For verified damaged, incorrect, or undelivered orders reported within the Returns & Replacements policy window, SHOPLY TOWN provides a replacement of the same product. SHOPLY TOWN does not provide cash refunds under this policy. This does not limit consumer rights that cannot legally be excluded.',
    ],
  },
  {
    title: '5. Acceptable use',
    paragraphs: [
      'Do not use the marketplace to break the law, submit false order or account information, interfere with the service, access another person’s account, or harass staff, suppliers, or other customers.',
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
    title: 'When a replacement may be requested',
    paragraphs: [
      'SHOPLY TOWN accepts replacement requests only for an order that was delivered damaged or faulty, contained an item different from the one ordered, or was not delivered by the expected delivery date SHOPLY TOWN gave you. A change of mind, or a size or colour preference when the correct item was delivered, does not qualify.',
      'Contact SHOPLY TOWN within 48 hours after delivery for a damaged, faulty, or incorrect item. For an undelivered order, contact SHOPLY TOWN within 48 hours after the expected delivery date. Include your order code, a description of the issue, and clear photos when relevant.',
    ],
  },
  {
    title: 'What happens after you contact us',
    paragraphs: [
      'SHOPLY TOWN will review the order and the reported issue. Do not send an item back before SHOPLY TOWN has reviewed your request and provided return or inspection instructions. Keep the item and its packaging until you hear from us.',
    ],
  },
  {
    title: 'Replacement only — no cash refunds',
    paragraphs: [
      'If SHOPLY TOWN verifies that the request qualifies, the remedy is a replacement of the same product, subject to availability. SHOPLY TOWN does not issue cash refunds under this policy. If the same product is unavailable, contact SHOPLY TOWN to discuss the order. This policy does not limit consumer rights that cannot legally be excluded.',
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
    answer: 'After signing in, browse categories or search products. SHOPLY TOWN is your retailer and order contact; availability and product details may change, so ask SHOPLY TOWN to confirm important details before ordering.',
  },
  {
    question: 'How do I place an order?',
    answer: 'Add products to your cart or discuss an item with Amaka. Enter your name, delivery address, and contact number at checkout. SHOPLY TOWN saves an order code and opens WhatsApp so you can confirm the details with our team. Fulfillment partners may help prepare or deliver some orders.',
  },
  {
    question: 'Who is responsible for my order?',
    answer: 'SHOPLY TOWN is the retailer and your contact for payment, order support, returns, and delivery. Fulfillment partners may help prepare or dispatch products, but you place and manage your order through SHOPLY TOWN.',
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
    question: 'Can I pay through Paystack or inside the app?',
    answer: 'No. SHOPLY TOWN does not collect payments through Paystack or inside the app. Submit your order, confirm the details with staff in WhatsApp, and only follow payment instructions confirmed by SHOPLY TOWN. Your order stays unpaid until staff manually confirms receiving payment.',
  },
  {
    question: 'Can I get a refund or replacement?',
    answer: 'SHOPLY TOWN does not issue cash refunds under its policy. For a damaged, faulty, or incorrect item, contact SHOPLY TOWN within 48 hours after delivery. For an undelivered order, contact SHOPLY TOWN within 48 hours after the expected delivery date SHOPLY TOWN gave you. If the issue is verified, the remedy is a replacement of the same product, subject to availability. Include your order code and do not send an item back until you receive instructions. Consumer rights that cannot legally be excluded are not affected.',
  },
  {
    question: 'Can I return an item because I changed my mind?',
    answer: 'No. Returns or replacements are limited to verified damaged, faulty, incorrect, or undelivered orders reported within the policy window. Change of mind, size, or colour preference does not qualify when the correct item was delivered.',
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
    description: 'The ground rules for using SHOPLY TOWN Marketplace.',
    icon: FileText,
    sections: termsSections,
  },
  returns: {
    eyebrow: 'Our order issue policy',
    title: 'Returns & Replacements',
    description: 'Replacement rules for damaged, incorrect, or undelivered orders.',
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
  const isTerms = page === 'terms'

  return (
    <InfoLayout>
      <div className="mb-8 flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-800"><Icon size={26} /></div>
      <p className="text-xs font-extrabold uppercase tracking-[0.2em] text-emerald-700">{details.eyebrow}</p>
      <h1 className="mt-3 font-display text-4xl font-extrabold tracking-tight sm:text-5xl">{details.title}</h1>
      <p className="mt-4 max-w-2xl leading-7 text-slate-600">{details.description}</p>
      <p className="mt-3 text-xs text-slate-500">Last updated: October 5, 2026</p>

      <div className={`mt-8 flex gap-3 rounded-2xl border p-4 ${isTerms ? 'border-blue-200 bg-blue-50 text-blue-950' : 'border-emerald-200 bg-emerald-50 text-emerald-950'}`}>
        {isTerms ? <FileText className="mt-0.5 shrink-0" size={19} /> : <ShieldCheck className="mt-0.5 shrink-0" size={19} />}
        <p className="text-sm leading-6">
          <strong>{isTerms ? 'Terms information.' : 'SHOPLY TOWN policy: replacement only; no cash refunds.'}</strong>{' '}
          {isTerms
            ? 'This general template is not legal advice. Add your verified business identity, contact details, applicable local requirements, and have the final text reviewed.'
            : 'Report damaged, faulty, or incorrect items within 48 hours after delivery; report non-delivery within 48 hours after the expected delivery date. Read the rules below; consumer rights that cannot legally be excluded are not affected.'}
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
          <ArrowLeft size={16} /> Back to SHOPLY TOWN
        </Link>
        <article className="mt-6 rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:mt-8 sm:p-10 lg:p-12">
          {children}
        </article>
        <nav aria-label="Legal and help pages" className="flex flex-wrap gap-x-5 gap-y-2 px-2 py-6 text-sm font-semibold text-slate-600">
          <Link to="/faq" className="hover:text-emerald-800">FAQ</Link>
          <Link to="/returns" className="hover:text-emerald-800">Returns & Replacements</Link>
          <Link to="/terms" className="hover:text-emerald-800">Terms & Conditions</Link>
        </nav>
      </div>
    </main>
  )
}
