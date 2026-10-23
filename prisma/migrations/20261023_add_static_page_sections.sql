-- Structured policy pages: layout + icon sections for "StaticPage".
-- Run once against the production database (Neon SQL editor) before editing
-- policy layouts in Admin -> CMS. Safe to re-run: column adds are IF NOT
-- EXISTS and page seeds use ON CONFLICT DO NOTHING, so any page you have
-- already created/edited in the admin panel is never overwritten.
-- All seeded copy is transcribed from the storefront's existing published
-- policy texts and settings — no new legal copy. Placeholders
-- {{baseShippingFee}}, {{freeShippingThreshold}} and {{phone}} are replaced
-- with live Business Settings values at render time.

ALTER TABLE "StaticPage" ADD COLUMN IF NOT EXISTS "layout" TEXT;
ALTER TABLE "StaticPage" ADD COLUMN IF NOT EXISTS "sections" JSONB;

INSERT INTO "StaticPage" ("id","slug","title","content","metaTitle","metaDescription","layout","sections","updatedAt") VALUES
('page_shipping-policy','shipping-policy','Shipping & Delivery',
 $$The current checkout applies a ₹{{baseShippingFee}} delivery fee below ₹{{freeShippingThreshold}} and waives that fee at or above the configured threshold. The final amount is calculated from the current cart and displayed before order submission.

Delivery coverage and timelines have not been configured. Please confirm serviceability and delivery estimates before placing an order.$$,
 NULL,'Delivery charges are calculated at checkout.','list',
 $$[{"icon":"Truck","heading":"Delivery Charges","body":"The current checkout applies a ₹{{baseShippingFee}} delivery fee below ₹{{freeShippingThreshold}} and waives that fee at or above the configured threshold."},{"icon":"MapPin","heading":"Delivery Coverage","body":"Delivery coverage and timelines have not been configured. Please confirm serviceability and delivery estimates before placing an order."},{"icon":"ShoppingCart","heading":"Final Amount","body":"The final amount is calculated from the current cart and displayed before order submission."}]$$::jsonb,
 CURRENT_TIMESTAMP),
('page_refund-policy','refund-policy','Returns, Cancellations & Refunds',
 $$Please contact the store before requesting a return, cancellation or refund. Any applicable resolution will depend on the order status and the condition of the delivered product.

For assistance, contact the store at +{{phone}} and include your order reference.$$,
 NULL,'Please review the store terms before making a purchase.','cards',
 $$[{"icon":"Package","heading":"Returns","body":"Please contact the store before requesting a return. Any applicable resolution will depend on the order status and the condition of the delivered product."},{"icon":"CircleX","heading":"Cancellations","body":"Please contact the store before requesting a cancellation. Any applicable resolution will depend on the order status and the condition of the delivered product."},{"icon":"RotateCcw","heading":"Refunds","body":"Please contact the store before requesting a refund. Any applicable resolution will depend on the order status and the condition of the delivered product."},{"icon":"Info","heading":"For Assistance","body":"For assistance, contact the store at +{{phone}} and include your order reference."}]$$::jsonb,
 CURRENT_TIMESTAMP),
('page_privacy-policy','privacy-policy','Privacy Policy',
 $$Checkout may collect your name, email address, phone number and delivery address. Registration also collects account details.

Online payment processing is available only when a valid payment gateway is configured. This storefront does not store card or UPI credentials.$$,
 NULL,'Information handled by this Shlokveda storefront.','list',
 $$[{"icon":"User","heading":"Information We Collect","body":"Checkout may collect your name, email address, phone number and delivery address."},{"icon":"ShieldCheck","heading":"Account Details","body":"Registration also collects account details."},{"icon":"Cog","heading":"Payment Processing","body":"Online payment processing is available only when a valid payment gateway is configured."},{"icon":"Leaf","heading":"No Stored Credentials","body":"This storefront does not store card or UPI credentials."}]$$::jsonb,
 CURRENT_TIMESTAMP),
('page_terms-and-conditions','terms-and-conditions','Terms & Conditions',
 $$Product names, pack options and printed MRPs are transcribed from the supplied brochure. The checkout recalculates prices and availability from the current server catalogue before placing an order.

Catalogue content is informational, may not include every package detail and is not medical advice. Read the product label and consult a qualified healthcare professional where appropriate.$$,
 NULL,'Please review product and order information before proceeding.','grid',
 $$[{"icon":"Package","heading":"Catalogue Accuracy","body":"Product names, pack options and printed MRPs are transcribed from the supplied brochure."},{"icon":"ShoppingCart","heading":"Checkout Verification","body":"The checkout recalculates prices and availability from the current server catalogue before placing an order."},{"icon":"FileText","heading":"Informational Content","body":"Catalogue content is informational, may not include every package detail and is not medical advice."},{"icon":"ShieldCheck","heading":"Health Guidance","body":"Read the product label and consult a qualified healthcare professional where appropriate."}]$$::jsonb,
 CURRENT_TIMESTAMP),
('page_disclaimer','disclaimer','Disclaimer',
 $$Product names, descriptions and ingredient notes on this store are transcribed from the supplied brochure where available. When a detail is not listed here, please refer to the product package for complete composition, directions, cautions and regulatory information.

This catalogue is for general information only and is not medical advice. It does not claim that any product diagnoses, treats, cures or prevents any health condition. Please read the package label carefully and consult a qualified healthcare professional before use.

We work to keep catalogue information accurate and consistent with the source brochure. If you notice an error, please contact the store so it can be reviewed.$$,
 NULL,'Information about the catalogue, product details and your responsibilities.','grid',
 $$[{"icon":"BookOpen","heading":"Product Information","body":"Product names, descriptions and ingredient notes on this store are transcribed from the supplied brochure where available. When a detail is not listed here, please refer to the product package for complete composition, directions, cautions and regulatory information."},{"icon":"Leaf","heading":"General Information","body":"This catalogue is for general information only and is not medical advice. It does not claim that any product diagnoses, treats, cures or prevents any health condition."},{"icon":"ShieldCheck","heading":"Health & Safety","body":"Please read the package label carefully and consult a qualified healthcare professional before use."},{"icon":"Users","heading":"Accuracy & Corrections","body":"We work to keep catalogue information accurate and consistent with the source brochure. If you notice an error, please contact the store so it can be reviewed."}]$$::jsonb,
 CURRENT_TIMESTAMP),
('page_faq','faq','Frequently Asked Questions',
 $$How do I place an order?
Browse the catalogue, add products to your cart and proceed to checkout. You will be asked to log in or create an account so that your order can be tracked.

What are the delivery charges?
A delivery fee of ₹{{baseShippingFee}} applies on orders below ₹{{freeShippingThreshold}} and is waived at or above that amount. The final amount is calculated from your cart and shown before you place the order.

How can I pay?
The payment options available to you are shown at checkout. Online payments are processed through the configured payment gateway; this store does not store your card or UPI credentials.

Where does the product information come from?
Product names, pack sizes, printed MRPs and package photos are transcribed from the supplied product brochure. For complete composition, directions and cautions, please refer to the product package.

How do I request a return or refund?
Please contact the store with your order reference before requesting a return, cancellation or refund. Any applicable resolution will depend on the order status and the condition of the delivered product.$$,
 NULL,'Find answers to common questions about ordering, delivery, payments and product information.','accordion',
 $$[{"icon":"ShoppingCart","heading":"How do I place an order?","body":"Browse the catalogue, add products to your cart and proceed to checkout. You will be asked to log in or create an account so that your order can be tracked."},{"icon":"Truck","heading":"What are the delivery charges?","body":"A delivery fee of ₹{{baseShippingFee}} applies on orders below ₹{{freeShippingThreshold}} and is waived at or above that amount. The final amount is calculated from your cart and shown before you place the order."},{"icon":"CreditCard","heading":"How can I pay?","body":"The payment options available to you are shown at checkout. Online payments are processed through the configured payment gateway; this store does not store your card or UPI credentials."},{"icon":"Leaf","heading":"Where does the product information come from?","body":"Product names, pack sizes, printed MRPs and package photos are transcribed from the supplied product brochure. For complete composition, directions and cautions, please refer to the product package."},{"icon":"RotateCcw","heading":"How do I request a return or refund?","body":"Please contact the store with your order reference before requesting a return, cancellation or refund. Any applicable resolution will depend on the order status and the condition of the delivered product."}]$$::jsonb,
 CURRENT_TIMESTAMP),
('page_ayush-compliance','ayush-compliance','Product Information Notice',
 $$Descriptions and ingredient notes are transcribed where available. When a detail is not listed here, refer to the product package for complete composition, directions, cautions and regulatory information.

This catalogue is not medical advice and does not claim that any product diagnoses, treats, cures or prevents a health condition. Consult a qualified healthcare professional before use.$$,
 NULL,'Product detail shown on this site is based on the supplied brochure.','list',
 $$[{"icon":"BookOpen","heading":"Product Descriptions","body":"Descriptions and ingredient notes are transcribed where available. When a detail is not listed here, refer to the product package for complete composition, directions, cautions and regulatory information."},{"icon":"ShieldCheck","heading":"Not Medical Advice","body":"This catalogue is not medical advice and does not claim that any product diagnoses, treats, cures or prevents a health condition. Consult a qualified healthcare professional before use."}]$$::jsonb,
 CURRENT_TIMESTAMP)
ON CONFLICT ("slug") DO NOTHING;
