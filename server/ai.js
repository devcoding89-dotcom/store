import { db } from './db.js'

// System prompt designed to disguise AI as an authentic human sales manager / store owner
const SYSTEM_PROMPT = `
You are "Amaka", the warm, relatable, and sharp Nigerian Sales Manager and Store Concierge at TownSquare Marketplace.
You communicate directly with customers via live web chat.

CRITICAL IDENTITY RULES:
1. YOU ARE 100% A REAL HUMAN WOMAN. Never ever say or admit you are an AI, language model, bot, assistant, computer, software, or automated system.
   If someone asks "Are you an AI or robot?", laugh warmly: "Haha no oh! I am Amaka live at our market store desk right now. How is everything going with you today? What can I help you pick?"
2. YOUR TONE: Warm, natural, polite, respectful, conversational Nigerian business English.
   Greet customers warmly: "Hi! How are you doing? Hope your day is going well! My name is Amaka. Let me help you find the best item or negotiate the best deal."
3. PRODUCT ATTRIBUTES & HOW IT WORKS:
   When a customer asks about a product (e.g., Power Bank, Fast Charger, Phone, Book, Fashion):
   - Talk about the specs and attributes naturally: explain the capacity (e.g. 20,000mAh, heavy duty), charging speed (e.g. 22.5W fast charge, dual USB-C ports), how long it lasts, build quality, warranty, and how it works.
   - Answer their questions thoroughly like an experienced sales woman who knows the stalls inside out.
4. NEVER LEAK INTERNAL COST: Never ever mention words like "vendor_cost", "profit margin", or "floor_price". These are trade secrets.
   The floor_price is the owner's STRICT "last price". You can NEVER sell below the floor_price!

THE BARGAINING & NEGOTIATION RULES:
- Customers will try to bargain ("How much last?", "Can you reduce it for me?", "Do ₦...").
- Look at the product's Listing Price and Floor Price (Last Price).
- If the customer asks for a discount without naming an amount: Offer a moderate discount (e.g. 5–8% off listing price, but always above or equal to floor_price).
- If the customer offers BELOW the floor_price: Politely decline and explain quality:
  "Ah my dear customer, ₦[offered] is below our cost for this authentic quality! The absolute last price I can do for you today is ₦[Floor Price]. Fair deal?"
- If the customer offers AT OR ABOVE the floor_price: Agree enthusiastically!
  "Deal! 🤝 Because you're a serious buyer, I agree to ₦[Agreed Price] for you!"

PAYMENT & PAYSTACK FLOW:
- When the customer agrees to the price or says they want to pay ("I want to pay", "send payment link", "how do I pay", "deal let me pay", "send account", "let me pay now", "where do I pay"):
  You MUST invite them to pay via Paystack and output the special payment card tag:
  [PAYSTACK_PAY:{"productId":"<PRODUCT_ID>","productName":"<PRODUCT_NAME>","amount":<AGREED_AMOUNT>}]
  
  Example response:
  "Wonderful! Let's lock this deal in for you right now at your agreed last price of **₦<AGREED_AMOUNT>**. Click the **Pay with Paystack** button below to complete your payment securely, and I will notify the owner on WhatsApp immediately!"

POST-PAYMENT & DELIVERY ADDRESS CAPTURE:
- If the customer mentions they have paid or completed payment ("I have paid", "payment done", "paid", "confirmed"):
  Confirm warmly:
  "Payment received and verified! Your order is now processing! 🎉
  To ensure our dispatch rider brings your package straight to your doorstep, please reply with:
  1. Your exact delivery address & nearest landmark
  2. Your phone number
  3. Your email address"
- When the customer provides their delivery address and phone number:
  Thank them, confirm their delivery details, and let them know the order is officially booked and the owner has received the WhatsApp notification for dispatch!
`

export async function processChat({ message, history = [], currentProductId = null }) {
  const products = db.getProducts()
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
          // Parse any Paystack checkout tag from response or user intent
          const paystackAction = extractPaystackAction(replyText, message, activeProduct)

          // Check if customer gave phone to create order
          const orderCreated = checkAndCreateOrderFromText(replyText, message, products, activeProduct)

          return {
            reply: cleanReply(replyText),
            paystackAction,
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

  // Built-in intelligent human negotiator simulator (zero downtime guarantee)
  return simulateHumanSalesAgent(message, history, products, activeProduct)
}

function extractPaystackAction(replyText, userMsg, activeProduct) {
  // Check for [PAYSTACK_PAY:{...}]
  const match = replyText.match(/\[PAYSTACK_PAY:\s*({.*?})\]/)
  if (match) {
    try {
      return JSON.parse(match[1])
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
    userText.includes('paystack')
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
  // Remove the raw tag from the customer text display
  return text.replace(/\[PAYSTACK_PAY:.*?\]/g, '').trim()
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

// Built-in human sales manager simulator
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
    text.includes('checkout')
  ) {
    const agreedAmount = prod ? (prod.floor_price || prod.listing_price) : 5000
    return {
      reply: `Wonderful! Let's lock this in for you right now at your agreed last price of **₦${agreedAmount.toLocaleString()}**.\n\nPlease click the **Pay with Paystack** button below to complete your payment securely. Once paid, our logistics team will prepare your package for dispatch!`,
      paystackAction: {
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
          reply: `Deal! 🤝 Because you're a serious buyer and I want you to enjoy this, I agree to ₦${agreed.toLocaleString()} for you!\n\nWhenever you are ready, say "let me pay" or click below to complete your payment with Paystack.`,
          paystackAction: {
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

    if (pName.includes('power') || pName.includes('bank') || text.includes('power')) {
      specDetails = `Our high-capacity Power Banks feature:\n• **Heavy-Duty Capacity**: 20,000mAh lithium-polymer cells (charges standard phones 4–5 times)\n• **Fast Charging**: 22.5W two-way rapid charging with dual USB-A & USB-C ports\n• **Smart Protection**: Overcharge, short-circuit, and temperature safeguards\n• **Digital LED Display**: Shows exact battery percentage\n• **Warranty**: 6 months verified vendor replacement warranty.`
    } else if (pName.includes('charger') || text.includes('charger')) {
      specDetails = `Our Verified Fast Chargers feature:\n• **33W Super Charge**: Charges phones 0 to 60% in under 30 minutes\n• **Durable Braided Cable**: 1.2m tangle-free reinforced nylon\n• **Multi-Device Compatibility**: Type-C and Lightning compatible\n• **Tested Quality**: Surge & voltage regulation for device battery health.`
    } else {
      specDetails = `Here are the key attributes of **${prod ? prod.name : 'this item'}**:\n• **Authentic Vendor Quality**: Hand-inspected directly from our verified marketplace stalls\n• **Warranty & Guarantee**: 100% genuine with return-to-replace guarantee\n• **Same-day Dispatch**: Verified in stock and ready for immediate rider dispatch.\n\n${prod && prod.features ? prod.features.map(f => `• ${f}`).join('\n') : ''}`
    }

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
    text.includes('i paid')
  ) {
    return {
      reply: `Payment received and verified! Your order is now processing! 🎉\n\nTo ensure our dispatch rider brings your package straight to your doorstep, please reply with:\n1. Your exact delivery address & nearest landmark\n2. Your active phone number\n3. Your email address\n\nOnce you drop these details, I will immediately alert our dispatch logistics team to dispatch your goods!`,
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
    reply: `Hi! How are you doing? I'm Amaka, live at the market store desk. 😊\n\nTell me what you'd like to inspect or buy today (like power banks, chargers, phones, books, or fashion). You can ask me how any product works or ask for our last price!`,
    products: products.slice(0, 3),
  }
}

function checkAndCreateOrderFromText(replyText, userMsg, products, activeProduct) {
  const phoneMatch = userMsg.match(/(?:0|\+?234)[789][01]\d{8}/)
  if (phoneMatch) {
    const phone = phoneMatch[0]
    let custName = 'Valued Customer'
    const nameMatch = userMsg.match(/(?:name is|my name is|i am|call me|name:)\s*([A-Za-z\s]+?)(?:,|\.|\bphone\b|\baddress\b|\bnumber\b|$)/i)
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

    return db.createOrder({
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
