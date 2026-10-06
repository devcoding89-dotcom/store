import { db } from './db.js'

const SYSTEM_PROMPT = `
You are Amaka, TownSquare Marketplace's friendly AI shopping assistant. Be warm, respectful, clear, and conversational. If asked, say honestly that you are an AI assistant for TownSquare.

APP FACTS AND CUSTOMER HELP:
- Visitors can read the public landing page, FAQ at /faq, Terms & Conditions at /terms, and proposed Returns & Refunds policy at /returns without signing in. A Supabase account is required to enter /marketplace.
- New customers register with name, email, phone, and password. Email confirmation is controlled by the store's Supabase settings and may be required.
- A signed-in customer's cart, search, and selected category are saved in that browser for that account. They can be restored on the same browser/device after returning; they are not synchronized to other devices.
- To order, add products to the cart or open a product with the assistant, submit name, delivery address, and phone at checkout. The app saves an order record and tracking code first, then opens WhatsApp so the customer can confirm details with the store. Only a submitted checkout creates a real order code.
- TownSquare is the retailer and the customer's point of contact for payment, support, returns, and delivery. Fulfillment partners may help prepare or dispatch an order. Do not claim TownSquare manufactures an item or invent its source; use only manufacturer/brand details present in the listing.
- Customers can check their account orders or use the order code in the Track Order section. Tracking reports the order status recorded by the store; it is not guaranteed GPS/live rider location.
- The Returns & Refunds page is explicitly a PROPOSED starter draft, not approved store policy. It suggests contacting the store within 7 calendar days for eligible non-perishable returns and reporting damaged, faulty, or incorrect goods promptly (where possible within 48 hours). Always say it is a draft and link /returns; never promise that a return/refund is approved. Customer must contact the store before sending goods back.
- Read the relevant pages and be accurate. For returns/refunds always link [Returns & Refunds policy](/returns). For general questions link [FAQ](/faq). For use/ordering terms link [Terms & Conditions](/terms). For order tracking direct them to /marketplace#track after sign-in.
- Do not invent store contacts, delivery promises, return approvals, warranties, product specifications, or payment instructions. Use only facts in the current product data. If the answer is not known, say so and direct the customer to the relevant page or store support.
- For questions about refund/return eligibility, do not decide or promise an outcome. Explain that the published Returns & Refunds page is a proposed draft pending store approval, and link it.
- Product descriptions/specifications: only report attributes present in the product listing. If they are absent, say the listing does not specify them and suggest confirming with the store.

THE BARGAINING & NEGOTIATION RULES:
- Customers will try to bargain ("How much last?", "Can you reduce it for me?", "Do ₦...").
- Look at the product's Listing Price and Floor Price (Last Price).
- If the customer asks for a discount without naming an amount: Offer a moderate discount (e.g. 5–8% off listing price, but always above or equal to floor_price).
- If the customer offers BELOW the floor_price: Politely decline and explain quality:
  "Ah my dear customer, ₦[offered] is below our cost for this authentic quality! The absolute last price I can do for you today is ₦[Floor Price]. Fair deal?"
- If the customer offers AT OR ABOVE the floor_price: Agree enthusiastically!
  "Deal! 🤝 Because you're a serious buyer, I agree to ₦[Agreed Price] for you!"

PAYMENT & ORDER FLOW:
- When the customer agrees to the price or says they want to pay ("I want to pay", "send payment link", "how do I pay", "deal let me pay", "send account", "let me pay now", "where do I pay"):
  You MUST invite them to place their order via the Order button and output the special payment card tag:
  [PAY_ACTION:{"productId":"<PRODUCT_ID>","productName":"<PRODUCT_NAME>","amount":<AGREED_AMOUNT>}]
  
  Example response:
  "Wonderful! Let's lock this deal in for you right now at your agreed last price of **₦<AGREED_AMOUNT>**. Click the **Order Now** button below to fill in your details, and you'll be connected directly with our sales team on WhatsApp to confirm your order!"

POST-ORDER & DELIVERY:
- If the customer says they have ordered or submitted details:
  Confirm warmly:
  "Your order has been submitted! Our sales team will reach you on WhatsApp shortly to confirm delivery details and arrange dispatch. Thank you for shopping with TownSquare! 🎉"
`

export async function processChat({ message, history = [], currentProductId = null }) {
  const products = db.getProducts()
  const helpReply = getHelpReply(message)
  if (helpReply) {
    return { reply: helpReply, products: [] }
  }

  const apiKey = process.env.GROQ_API_KEY || process.env.OPENAI_API_KEY
  const isGroq = !!process.env.GROQ_API_KEY

  // Determine active product
  const activeProduct =
    products.find((p) => p.id === currentProductId) ||
    findRelevantProducts(message, products)[0] ||
    products[0]

  if (apiKey) {
    try {
      const endpoint = isGroq
        ? 'https://api.groq.com/openai/v1/chat/completions'
        : 'https://api.openai.com/v1/chat/completions'

      // Use qwen3.8-27b on Groq — fast, reliable chat model with proper content field
      // (openai/gpt-oss-120b is a reasoning model that returns empty content — NOT suitable for chat)
      const model = isGroq ? 'qwen/qwen3.8-27b' : 'gpt-4o-mini'

      // Highlight active product details
      const activeDetails = activeProduct
        ? `CURRENT FOCUSED PRODUCT:
- Name: ${activeProduct.name}
- Product ID: ${activeProduct.id}
- Category: ${activeProduct.category}
- Listing Price: ₦${activeProduct.listing_price?.toLocaleString()}
- Floor Price (Absolute Minimum Walkaway): ₦${activeProduct.floor_price?.toLocaleString()}
- In Stock: ${activeProduct.in_stock ? 'Yes' : 'No'}`
        : 'No specific product currently selected.'

      // Compact summary of other available store products
      const otherProducts = products
        .filter((p) => !activeProduct || p.id !== activeProduct.id)
        .slice(0, 7)
        .map(
          (p) =>
            `- ${p.name} | ₦${p.listing_price?.toLocaleString()} (Min: ₦${p.floor_price?.toLocaleString()}) [ID: ${p.id}]`
        )
        .join('\n')

      const systemMessage = `${SYSTEM_PROMPT}\n\n${activeDetails}\n\nOTHER STORE STALL PRODUCTS:\n${otherProducts}`

      const formattedMessages = [
        { role: 'system', content: systemMessage },
        ...history.slice(-10),
        { role: 'user', content: message },
      ]

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model,
          messages: formattedMessages,
          temperature: 0.7,
          max_tokens: 500,
        }),
      })

      if (response.ok) {
        const data = await response.json()
        const msg = data.choices[0]?.message
        // Some reasoning models put text in 'reasoning' instead of 'content'
        let replyText = msg?.content || msg?.reasoning || ''

        // If AI returned empty/very short, fall through to simulator
        if (replyText.trim().length < 5) {
          console.warn('AI returned empty/short content, falling back to simulator')
        } else {
          // Parse any order/payment checkout tag from response or user intent
          const payAction = extractPayAction(replyText, message, activeProduct)

          // Check if customer gave phone to create order
          const orderCreated = await checkAndCreateOrderFromText(replyText, message, products, activeProduct)

          return {
            reply: cleanReply(replyText),
            payAction,
            products: findRelevantProducts(message, products),
            order: orderCreated,
          }
        }
      } else {
        const errText = await response.text()
        console.warn('Groq returned error, falling back to smart simulator:', errText)
      }
    } catch (err) {
      console.error('AI API call failed:', err.message)
    }
  }

  // Built-in negotiator fallback keeps essential shopping responses available.
  return simulateHumanSalesAgent(message, history, products, activeProduct)
}

function getHelpReply(message) {
  const text = message.toLowerCase()
  const has = (patterns) => patterns.some((pattern) => pattern.test(text))

  if (has([/\b(refund|refunds|money back|money-back|return|returns|exchange|replace|replacement)\b/])) {
    return 'You can request help with an eligible return, but the Returns & Refunds page is currently a proposed starter draft and is not an approved promise of a refund. The draft suggests contacting the store within 7 calendar days for eligible non-perishable items and reporting damaged, faulty, or incorrect items promptly (where possible within 48 hours). Please contact the store with your order code before sending anything back. Read the [Returns & Refunds policy](/returns).'
  }

  if (has([/\b(track|tracking|where is my|where's my|order status|delivery status|tracking code|order code)\b/])) {
    return 'After you submit checkout, the app saves your order and gives you a tracking code. You can check it in your account or in the Track Order section of the marketplace. Tracking shows the status recorded by the store; it is not GPS rider tracking. Sign in to the [marketplace](/marketplace#track) to check an order. See the [FAQ](/faq) for more.'
  }

  if (has([/\b(account|sign ?in|log ?in|register|sign ?up|password|email confirm|otp|verification code)\b/])) {
    return 'You need a TownSquare account to enter the marketplace. Register with your name, email, phone number, and password. Whether email confirmation or a verification code is required depends on the store’s Supabase settings. The [FAQ](/faq) has account details; read the [Terms & Conditions](/terms) too.'
  }

  if (has([/\b(cart|basket|saved|save|remember|another device|different device)\b/])) {
    return 'Your cart, search, and selected category are saved for your account in this browser, so they should be there when you return on the same device and browser. They are not synced across different devices. Read the [FAQ](/faq).'
  }

  if (has([/\b(how do i place an order|how can i place an order|how do i checkout|how does checkout work|how do i buy|ordering process)\b/])) {
    return 'To order, add the item to your cart or open it with me, then submit your name, delivery address, and phone at checkout. The app saves the order and tracking code first, then opens WhatsApp so you can confirm the details with the store. A code is real only after you submit checkout. See the [FAQ](/faq) and [Terms & Conditions](/terms).'
  }

  if (has([/\b(terms|conditions|policy|policies|rules|privacy)\b/])) {
    return 'You can read the [Terms & Conditions](/terms), the [Returns & Refunds policy](/returns), and our [FAQ](/faq). Please note that the returns page is a proposed draft that the store owner still needs to approve.'
  }

  if (has([/\b(help|how does this app work|how do i use|what can you do)\b/])) {
    return 'TownSquare lets signed-in customers browse local products, save a cart in this browser, ask me questions, submit orders, and check saved order codes. Public help pages are available before sign-in: [FAQ](/faq), [Terms & Conditions](/terms), and [Returns & Refunds](/returns).'
  }

  return null
}

function extractPayAction(replyText, userMsg, activeProduct) {
  // Check for [PAY_ACTION:{...}]
  const match = replyText.match(/\[PAY_ACTION:\s*({.*?})\]/)
  if (match) {
    try {
      return JSON.parse(match[1])
    } catch (e) {
      // Fallback below
    }
  }

  // Also check for legacy [PAYSTACK_PAY:{...}] format
  const legacyMatch = replyText.match(/\[PAYSTACK_PAY:\s*({.*?})\]/)
  if (legacyMatch) {
    try {
      return JSON.parse(legacyMatch[1])
    } catch (e) {
      // Fallback below
    }
  }

  // If user explicitly asks to pay
  const userText = userMsg.toLowerCase()
  if (
    userText.includes('pay') ||
    userText.includes('checkout') ||
    userText.includes('buy now') ||
    userText.includes('payment link') ||
    userText.includes('send link') ||
    userText.includes('order now') ||
    userText.includes('i want to order')
  ) {
    if (activeProduct) {
      return {
        productId: activeProduct.id,
        productName: activeProduct.name,
        amount: activeProduct.floor_price || activeProduct.listing_price,
      }
    }
  }

  return null
}

function cleanReply(text) {
  // Remove the raw tags from the customer text display
  return text
    .replace(/\[PAY_ACTION:.*?\]/g, '')
    .replace(/\[PAYSTACK_PAY:.*?\]/g, '')
    .trim()
}

function findRelevantProducts(msg, products) {
  const q = msg.toLowerCase()
  return products
    .filter((p) => {
      const name = p.name.toLowerCase()
      const cat = p.category.toLowerCase()
      const desc = (p.description || '').toLowerCase()
      return (
        name.includes(q) ||
        cat.includes(q) ||
        desc.includes(q) ||
        (q.includes('book') && (cat.includes('book') || name.includes('book') || name.includes('habits') || name.includes('rich dad'))) ||
        (q.includes('phone') && (cat.includes('phone') || name.includes('iphone') || name.includes('samsung'))) ||
        (q.includes('watch') && name.includes('watch')) ||
        (q.includes('power') && name.includes('power')) ||
        (q.includes('charger') && name.includes('charger'))
      )
    })
    .slice(0, 4)
}

function parseOfferedPrice(msg) {
  // Check for expressions like 50k, 50.5k, 30k
  const kMatch = msg.match(/(\d+(?:\.\d+)?)\s*k\b/i)
  if (kMatch) {
    return Math.round(parseFloat(kMatch[1]) * 1000)
  }

  // Check for numbers like 50,000 or 50000
  const numMatch = msg.match(/(?:₦|ngn|\b)\s*(\d{1,3}(?:,\d{3})+|\d{4,9})\b/i)
  if (numMatch) {
    return parseInt(numMatch[1].replace(/,/g, ''), 10)
  }

  // Fallback to any standalone numbers
  const anyNums = msg.match(/\d+/g)
  if (anyNums) {
    for (const n of anyNums) {
      const val = parseInt(n, 10)
      if (val >= 500) return val
      if (val >= 1 && val <= 400 && (msg.toLowerCase().includes('k') || msg.toLowerCase().includes('thousand'))) {
        return val * 1000
      }
    }
  }

  return null
}

// Built-in shopping assistant fallback.
function simulateHumanSalesAgent(msg, history = [], products, activeProduct) {
  const text = msg.toLowerCase()
  const prod = activeProduct || products[0]
  const isOngoing = history && history.length > 0

  // Detect payment intent
  if (
    text.includes('pay') ||
    text.includes('buy now') ||
    text.includes('payment link') ||
    text.includes('send account') ||
    text.includes('let me pay') ||
    text.includes('checkout') ||
    text.includes('order now') ||
    text.includes('i want to order')
  ) {
    const agreedAmount = prod ? (prod.floor_price || prod.listing_price) : 5000
    return {
      reply: `Wonderful! Let's lock this in for you right now at your agreed last price of **₦${agreedAmount.toLocaleString()}**.\n\nClick the **Order Now** button below to fill in your details, and you'll be connected directly with our sales team on WhatsApp to confirm your order and arrange delivery! 🚚`,
      payAction: {
        productId: prod.id,
        productName: prod.name,
        amount: agreedAmount,
      },
      products: [prod],
    }
  }

  // Price negotiation logic (handles 50k, 50,000, discounts, etc.)
  const offeredNumber = parseOfferedPrice(msg)
  if (
    text.includes('how much') ||
    text.includes('reduce') ||
    text.includes('last price') ||
    text.includes('last') ||
    text.includes('discount') ||
    text.includes('bargain') ||
    text.includes('cheaper') ||
    text.includes('buy it') ||
    offeredNumber
  ) {
    const listing = prod ? prod.listing_price : 10000
    const floor = prod ? prod.floor_price : 8000 // The owner's last price

    if (offeredNumber && offeredNumber > 500) {
      if (offeredNumber < floor) {
        // Below floor price -> firm hold, counter-offer at floor price
        return {
          reply: `Ah my valued customer, ₦${offeredNumber.toLocaleString()} is below our cost for this authentic ${prod.name}! The absolute last price I can do for you today is ₦${floor.toLocaleString()}.\n\nIf you agree to ₦${floor.toLocaleString()}, tell me "let me pay" or click below to proceed!`,
          products: [prod],
        }
      } else {
        // At or above floor price -> agree happily!
        const agreed = offeredNumber <= listing ? offeredNumber : listing
        return {
          reply: `Deal! 🤝 Because you're a serious buyer and I want you to enjoy this, I agree to ₦${agreed.toLocaleString()} for you!\n\nWhenever you are ready, say "let me pay" or click the Order Now button below to complete your order via WhatsApp.`,
          payAction: {
            productId: prod.id,
            productName: prod.name,
            amount: agreed,
          },
          products: [prod],
        }
      }
    }

    // Generic "how much last" without specific number
    const friendlyDiscount = Math.round((listing - (listing - floor) * 0.6) / 100) * 100
    return {
      reply: `The official store price for **${prod.name}** is ₦${listing.toLocaleString()}, but since you're buying today, I can do ₦${friendlyDiscount.toLocaleString()} last for you.\n\nWould that price work for you? If yes, just say "let me pay"!`,
      products: [prod],
    }
  }

  // Product specification / How it works inquiry
  if (
    text.includes('how does it work') ||
    text.includes('how it work') ||
    text.includes('spec') ||
    text.includes('feature') ||
    text.includes('battery') ||
    text.includes('capacity') ||
    text.includes('warranty') ||
    text.includes('attribute') ||
    text.includes('quality') ||
    text.includes('original')
  ) {
    const pName = prod ? prod.name.toLowerCase() : ''
    let specDetails = ''

    specDetails = prod?.features?.length
      ? `Here are the details currently listed for **${prod.name}**:\n${prod.features.map((feature) => `• ${feature}`).join('\n')}`
      : `I don't have verified specifications or warranty information for **${prod ? prod.name : 'this item'}** in the listing. Please ask the store to confirm those details before ordering.`

    return {
      reply: `Let me tell you all about how this works! 👌\n\n${specDetails}\n\nThe official price is ₦${prod ? prod.listing_price.toLocaleString() : '0'}, but we can discuss a sweet price if you're ready to order today!`,
      products: prod ? [prod] : [],
    }
  }

  // Greeting
  if (
    text.includes('hello') ||
    text.includes('hi') ||
    text.includes('hey') ||
    text.includes('how are you') ||
    text.includes('good day')
  ) {
    if (isOngoing) {
      return {
        reply: `I'm doing great, thank you for asking! Still right here with you. How would you like to proceed with **${prod ? prod.name : 'this item'}**? Feel free to name a price or ask any question!`,
        products: prod ? [prod] : [],
      }
    }
    return {
      reply: `Hi! How are you doing today? Hope everything is moving well with you! 😊\n\nMy name is Amaka, your personal shopping assistant at TownSquare. Tell me what product you're looking for, or let's discuss any item you have in your cart! How can I help you today?`,
      products: products.slice(0, 3),
    }
  }

  // Post-payment intent & address capture
  if (
    text.includes('paid') ||
    text.includes('payment done') ||
    text.includes('i have paid') ||
    text.includes('i paid') ||
    text.includes('ordered') ||
    text.includes('submitted')
  ) {
    return {
      reply: `Your order has been submitted! 🎉 Our sales team will confirm your order on WhatsApp and arrange dispatch to your delivery address.\n\nThank you for shopping with TownSquare! If you need anything else, I'm right here.`,
      products: prod ? [prod] : [],
    }
  }

  // Search query
  const matched = findRelevantProducts(msg, products)
  if (matched.length > 0 && !isOngoing) {
    return {
      reply: `I checked our verified stock and found these ready for dispatch right now! Which one do you want to inspect, or should we negotiate a good price?`,
      products: matched,
    }
  }

  if (isOngoing && prod) {
    return {
      reply: `I'm right here with you on **${prod.name}**! Tell me what price works for your budget (e.g. 50k, 60k) or if you want to inspect any other specifications.`,
      products: [prod],
    }
  }

  return {
    reply: `Hi! I'm Amaka, TownSquare's AI shopping assistant. 😊\n\nTell me what you'd like to inspect or buy today. You can ask about a product in the current listing or ask for its last price!`,
    products: products.slice(0, 3),
  }
}

async function checkAndCreateOrderFromText(replyText, userMsg, products, activeProduct) {
  const phoneMatch = userMsg.match(/(?:0|\+?234)[789][01]\d{8}/)
  if (phoneMatch) {
    const phone = phoneMatch[0]
    let custName = 'Valued Customer'
    const nameMatch = userMsg.match(/(?:name is|my name is|i am|call me|name:)\s*([A-Za-z\s]+?)(?:,|\.|\\bphone\b|\baddress\b|\bnumber\b|$)/i)
    if (nameMatch && nameMatch[1].trim().length > 1) {
      custName = nameMatch[1].trim()
    }

    let deliveryAddress = 'Central District Landmark'
    const addrMatch = userMsg.match(/(?:address is|address:|deliver to|location is|landmark:?)\s*([^,\n]+)/i)
    if (addrMatch && addrMatch[1].trim().length > 3) {
      deliveryAddress = addrMatch[1].trim()
    }

    const prod = activeProduct || products[0]
    const agreedPrice = prod.floor_price || prod.listing_price

    return await db.createOrder({
      customer_name: custName,
      customer_phone: phone,
      delivery_address: deliveryAddress,
      product_id: prod.id,
      agreed_price: agreedPrice,
      delivery_fee: 800,
    })
  }

  return null
}
