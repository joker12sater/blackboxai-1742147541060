const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const User = require('../models/User');
const Festival = require('../models/Festival');

class PaymentService {
    // Process a general payment
    static async processPayment({ amount, currency, paymentMethod, userId }) {
        try {
            // Create payment intent with Stripe
            const paymentIntent = await stripe.paymentIntents.create({
                amount: amount * 100, // Convert to cents
                currency: currency || 'usd',
                payment_method: paymentMethod,
                confirmation_method: 'manual',
                confirm: true
            });

            // Record the transaction
            await this.recordTransaction({
                userId,
                amount,
                currency,
                paymentIntentId: paymentIntent.id,
                status: paymentIntent.status
            });

            return {
                success: true,
                paymentIntentId: paymentIntent.id,
                clientSecret: paymentIntent.client_secret
            };
        } catch (error) {
            console.error('Payment Processing Error:', error);
            throw new Error('Failed to process payment');
        }
    }

    // Create a subscription
    static async createSubscription(userId, paymentMethod, planType = 'vip') {
        try {
            const user = await User.findById(userId);
            if (!user) {
                throw new Error('User not found');
            }

            // Get subscription price based on plan type
            const priceId = this.getPriceIdForPlan(planType);

            // Create or get Stripe customer
            let customerId = user.stripeCustomerId;
            if (!customerId) {
                const customer = await stripe.customers.create({
                    email: user.email,
                    payment_method: paymentMethod,
                    invoice_settings: {
                        default_payment_method: paymentMethod
                    }
                });
                customerId = customer.id;
                user.stripeCustomerId = customerId;
                await user.save();
            }

            // Create subscription
            const subscription = await stripe.subscriptions.create({
                customer: customerId,
                items: [{ price: priceId }],
                payment_behavior: 'default_incomplete',
                expand: ['latest_invoice.payment_intent']
            });

            // Update user subscription status
            await User.findByIdAndUpdate(userId, {
                subscriptionStatus: 'active',
                subscriptionId: subscription.id,
                subscriptionType: planType
            });

            return {
                subscriptionId: subscription.id,
                clientSecret: subscription.latest_invoice.payment_intent.client_secret
            };
        } catch (error) {
            console.error('Subscription Creation Error:', error);
            throw new Error('Failed to create subscription');
        }
    }

    // Process merchandise purchase
    static async processMerchPurchase({ merchId, quantity, paymentMethod, userId }) {
        try {
            const festival = await Festival.findOne();
            const merchandise = festival.merchandise.id(merchId);

            if (!merchandise) {
                throw new Error('Merchandise not found');
            }

            if (merchandise.stock < quantity) {
                throw new Error('Insufficient stock');
            }

            const amount = merchandise.discountPrice || merchandise.price;
            const totalAmount = amount * quantity;

            // Process payment
            const payment = await this.processPayment({
                amount: totalAmount,
                currency: 'usd',
                paymentMethod,
                userId
            });

            // Update stock
            merchandise.stock -= quantity;
            await festival.save();

            // Track merchandise sale
            await Festival.trackAnalyticsEvent('merchSale', {
                itemId: merchId,
                quantity,
                revenue: totalAmount
            });

            return {
                success: true,
                payment,
                merchandise: {
                    name: merchandise.name,
                    quantity,
                    totalAmount
                }
            };
        } catch (error) {
            console.error('Merchandise Purchase Error:', error);
            throw new Error('Failed to process merchandise purchase');
        }
    }

    // Handle subscription cancellation
    static async cancelSubscription(userId) {
        try {
            const user = await User.findById(userId);
            if (!user || !user.subscriptionId) {
                throw new Error('No active subscription found');
            }

            const subscription = await stripe.subscriptions.del(user.subscriptionId);

            await User.findByIdAndUpdate(userId, {
                subscriptionStatus: 'cancelled',
                subscriptionId: null
            });

            return { success: true, subscription };
        } catch (error) {
            console.error('Subscription Cancellation Error:', error);
            throw new Error('Failed to cancel subscription');
        }
    }

    // Handle refunds
    static async processRefund(paymentIntentId, amount) {
        try {
            const refund = await stripe.refunds.create({
                payment_intent: paymentIntentId,
                amount: amount * 100 // Convert to cents
            });

            return { success: true, refund };
        } catch (error) {
            console.error('Refund Processing Error:', error);
            throw new Error('Failed to process refund');
        }
    }

    // Record transaction in database
    static async recordTransaction(transactionData) {
        try {
            // Implement transaction recording logic here
            // This could be a separate Transaction model
            console.log('Recording transaction:', transactionData);
        } catch (error) {
            console.error('Transaction Recording Error:', error);
            // Don't throw error here as it's a non-critical operation
        }
    }

    // Get price ID for subscription plan
    static getPriceIdForPlan(planType) {
        const priceIds = {
            vip: process.env.STRIPE_VIP_PRICE_ID,
            premium: process.env.STRIPE_PREMIUM_PRICE_ID,
            basic: process.env.STRIPE_BASIC_PRICE_ID
        };

        return priceIds[planType] || priceIds.basic;
    }

    // Validate payment method
    static async validatePaymentMethod(paymentMethodId) {
        try {
            const paymentMethod = await stripe.paymentMethods.retrieve(paymentMethodId);
            return paymentMethod.status === 'active';
        } catch (error) {
            console.error('Payment Method Validation Error:', error);
            return false;
        }
    }

    // Generate invoice
    static async generateInvoice(userId, items) {
        try {
            const user = await User.findById(userId);
            if (!user || !user.stripeCustomerId) {
                throw new Error('User not found or no Stripe customer ID');
            }

            const invoice = await stripe.invoices.create({
                customer: user.stripeCustomerId,
                auto_advance: true, // Auto-finalize and send invoice
                collection_method: 'charge_automatically'
            });

            // Add invoice items
            for (const item of items) {
                await stripe.invoiceItems.create({
                    customer: user.stripeCustomerId,
                    invoice: invoice.id,
                    amount: item.amount * 100,
                    currency: 'usd',
                    description: item.description
                });
            }

            return { success: true, invoice };
        } catch (error) {
            console.error('Invoice Generation Error:', error);
            throw new Error('Failed to generate invoice');
        }
    }
}

module.exports = PaymentService;
