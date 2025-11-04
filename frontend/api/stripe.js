const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const database = require('./database');

// Create a new checkout session for the user to upgrade their plan
const createCheckoutSession = async (userId, email) => {
    const session = await stripe.checkout.sessions.create({
        payment_method_types: ['card'],
        line_items: [
            {
                price: process.env.STRIPE_PRICE_ID,
                quantity: 1,
            },
        ],
        mode: 'subscription',
        success_url: `${process.env.CLIENT_URL || 'http://localhost:5173'}/dashboard?payment=success`,
        cancel_url: `${process.env.CLIENT_URL || 'http://localhost:5173'}/dashboard?payment=cancelled`,
        customer_email: email,
        metadata: {
            userId: userId,
        },
    });

    return session;
};

// Handle incoming webhook events from Stripe
const handleWebhookEvent = (req, res) => {
    const sig = req.headers['stripe-signature'];
    let event;

    try {
        event = stripe.webhooks.constructEvent(req.body, sig, process.env.STRIPE_WEBHOOK_SECRET);
    } catch (err) {
        console.error('Webhook signature verification failed.', err.message);
        return res.status(400).send(`Webhook Error: ${err.message}`);
    }

    // Handle the checkout.session.completed event
    if (event.type === 'checkout.session.completed') {
        const session = event.data.object;
        const userId = session.metadata.userId;

        // Update the user's subscription in the database
        database.db.run('UPDATE users SET subscription_tier = ?, monthly_limit = ? WHERE id = ?', ['paid', 5000, userId], (err) => {
            if (err) {
                console.error('Failed to update user subscription:', err);
                // We should handle this error, e.g., by logging it for manual intervention
            }
        });
    }

    res.json({ received: true });
};

module.exports = { createCheckoutSession, handleWebhookEvent };
