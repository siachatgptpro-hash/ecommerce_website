-- Shlokveda Neon PostgreSQL bootstrap
-- Generated from prisma/schema.prisma plus the brochure catalogue.
-- Run ONCE in an EMPTY Neon database/schema. This script does not DROP existing objects.
-- The catalogue seed uses the owner-approved opening stockQuantity=100 for every brochure pack variant (approved 2026-10-24; the PDF itself contains product/pack/MRP data, not inventory counts) and costPrice=0 pending verified supplier cost data; printed MRP is the sellingPrice. Matching opening-stock InventoryLedger rows are inserted below. No admin, customer, coupon, review, or payment records are created.
-- Prisma @default(uuid()) is client-generated; use Prisma Client or supply IDs for direct SQL inserts.

BEGIN;

-- Enums
CREATE TYPE "SystemRole" AS ENUM ('SUPER_ADMIN', 'ADMIN', 'PRODUCT_MANAGER', 'ORDER_MANAGER', 'CONTENT_MANAGER', 'CUSTOMER');
CREATE TYPE "PermissionKey" AS ENUM ('MANAGE_SETTINGS', 'MANAGE_PAYMENTS', 'MANAGE_USERS', 'MANAGE_PRODUCTS', 'MANAGE_INVENTORY', 'MANAGE_ORDERS', 'MANAGE_CUSTOMERS', 'MANAGE_CMS', 'MANAGE_BLOG', 'MANAGE_COUPONS', 'MANAGE_REVIEWS', 'VIEW_ANALYTICS', 'VIEW_AUDIT_LOGS');
CREATE TYPE "AyurvedicFormulation" AS ENUM ('AWALEHA', 'CHURNA', 'VATI', 'ASAVA_ARISHTA', 'TAILA', 'GHRITA', 'KWATH', 'KWATHA', 'BHASMA', 'LEPA', 'SYRUP', 'CAPSULE', 'TABLET', 'RAW_HERB', 'WELLNESS', 'OTHER');
CREATE TYPE "InventoryChangeReason" AS ENUM ('SALE', 'ORDER_CANCELLATION', 'MANUAL_RESTOCK', 'DAMAGE_WRITE_OFF', 'STOCK_AUDIT_ADJUSTMENT');
CREATE TYPE "OrderStatus" AS ENUM ('PENDING', 'CONFIRMED', 'PACKED', 'SHIPPED', 'DELIVERED', 'CANCELLED', 'RETURNED');
CREATE TYPE "PaymentStatus" AS ENUM ('PENDING', 'PAID', 'FAILED', 'REFUNDED', 'PARTIALLY_REFUNDED');
CREATE TYPE "PaymentGateway" AS ENUM ('RAZORPAY', 'CASH_ON_DELIVERY');
CREATE TYPE "ShipmentStatus" AS ENUM ('LABEL_CREATED', 'PICKED_UP', 'IN_TRANSIT', 'OUT_FOR_DELIVERY', 'DELIVERED', 'FAILED_DELIVERY', 'RETURNED');
CREATE TYPE "DiscountType" AS ENUM ('PERCENTAGE', 'FIXED_AMOUNT', 'FREE_SHIPPING');

-- Tables and primary keys
CREATE TABLE "User" (
  "id" TEXT NOT NULL,
  "email" TEXT NOT NULL,
  "phone" TEXT,
  "passwordHash" TEXT NOT NULL,
  "fullName" TEXT NOT NULL,
  "isActive" BOOLEAN NOT NULL DEFAULT TRUE,
  "isVerified" BOOLEAN NOT NULL DEFAULT FALSE,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);
CREATE TABLE "Role" (
  "id" TEXT NOT NULL,
  "name" "SystemRole" NOT NULL,
  "description" TEXT,
  CONSTRAINT "Role_pkey" PRIMARY KEY ("id")
);
CREATE TABLE "RolePermission" (
  "id" TEXT NOT NULL,
  "roleId" TEXT NOT NULL,
  "permission" "PermissionKey" NOT NULL,
  CONSTRAINT "RolePermission_pkey" PRIMARY KEY ("id")
);
CREATE TABLE "UserRole" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "roleId" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "UserRole_pkey" PRIMARY KEY ("id")
);
CREATE TABLE "Address" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "fullName" TEXT NOT NULL,
  "phone" TEXT NOT NULL,
  "addressLine1" TEXT NOT NULL,
  "addressLine2" TEXT,
  "landmark" TEXT,
  "city" TEXT NOT NULL,
  "state" TEXT NOT NULL,
  "pincode" TEXT NOT NULL,
  "isDefault" BOOLEAN NOT NULL DEFAULT FALSE,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "Address_pkey" PRIMARY KEY ("id")
);
CREATE TABLE "Category" (
  "id" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "slug" TEXT NOT NULL,
  "description" TEXT,
  "imageUrl" TEXT,
  "parentId" TEXT,
  "displayOrder" INTEGER NOT NULL DEFAULT 0,
  "isActive" BOOLEAN NOT NULL DEFAULT TRUE,
  "metaTitle" TEXT,
  "metaDescription" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "Category_pkey" PRIMARY KEY ("id")
);
CREATE TABLE "Product" (
  "id" TEXT NOT NULL,
  "categoryId" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "slug" TEXT NOT NULL,
  "skuPrefix" TEXT NOT NULL,
  "shortDescription" TEXT,
  "fullDescription" TEXT NOT NULL,
  "ingredients" TEXT NOT NULL,
  "benefits" TEXT NOT NULL,
  "usageInstructions" TEXT NOT NULL,
  "precautions" TEXT,
  "ayurvedicFormulation" "AyurvedicFormulation" NOT NULL DEFAULT 'WELLNESS',
  "ayushLicenseNo" TEXT,
  "fssaiLicenseNo" TEXT,
  "isFeatured" BOOLEAN NOT NULL DEFAULT FALSE,
  "isBestseller" BOOLEAN NOT NULL DEFAULT FALSE,
  "isNewArrival" BOOLEAN NOT NULL DEFAULT FALSE,
  "isActive" BOOLEAN NOT NULL DEFAULT TRUE,
  "metaTitle" TEXT,
  "metaDescription" TEXT,
  "metaKeywords" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "Product_pkey" PRIMARY KEY ("id")
);
CREATE TABLE "ProductVariant" (
  "id" TEXT NOT NULL,
  "productId" TEXT NOT NULL,
  "sku" TEXT NOT NULL,
  "sizeLabel" TEXT NOT NULL,
  "mrp" DOUBLE PRECISION NOT NULL,
  "sellingPrice" DOUBLE PRECISION NOT NULL,
  "costPrice" DOUBLE PRECISION NOT NULL,
  "stockQuantity" INTEGER NOT NULL DEFAULT 0,
  "reservedQuantity" INTEGER NOT NULL DEFAULT 0,
  "lowStockThreshold" INTEGER NOT NULL DEFAULT 5,
  "weightInGrams" INTEGER NOT NULL DEFAULT 0,
  "isDefault" BOOLEAN NOT NULL DEFAULT FALSE,
  "isActive" BOOLEAN NOT NULL DEFAULT TRUE,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "ProductVariant_pkey" PRIMARY KEY ("id")
);
CREATE TABLE "ProductImage" (
  "id" TEXT NOT NULL,
  "productId" TEXT NOT NULL,
  "imageUrl" TEXT NOT NULL,
  "altText" TEXT,
  "sortOrder" INTEGER NOT NULL DEFAULT 0,
  "isPrimary" BOOLEAN NOT NULL DEFAULT FALSE,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "ProductImage_pkey" PRIMARY KEY ("id")
);
CREATE TABLE "InventoryLedger" (
  "id" TEXT NOT NULL,
  "variantId" TEXT NOT NULL,
  "changeQty" INTEGER NOT NULL,
  "resultingQty" INTEGER NOT NULL,
  "reason" "InventoryChangeReason" NOT NULL,
  "referenceId" TEXT,
  "notes" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "InventoryLedger_pkey" PRIMARY KEY ("id")
);
CREATE TABLE "Cart" (
  "id" TEXT NOT NULL,
  "userId" TEXT,
  "sessionId" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "Cart_pkey" PRIMARY KEY ("id")
);
CREATE TABLE "CartItem" (
  "id" TEXT NOT NULL,
  "cartId" TEXT NOT NULL,
  "variantId" TEXT NOT NULL,
  "quantity" INTEGER NOT NULL DEFAULT 1,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "CartItem_pkey" PRIMARY KEY ("id")
);
CREATE TABLE "Wishlist" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "Wishlist_pkey" PRIMARY KEY ("id")
);
CREATE TABLE "WishlistItem" (
  "id" TEXT NOT NULL,
  "wishlistId" TEXT NOT NULL,
  "productId" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "WishlistItem_pkey" PRIMARY KEY ("id")
);
CREATE TABLE "Order" (
  "id" TEXT NOT NULL,
  "orderNumber" TEXT NOT NULL,
  "userId" TEXT,
  "customerName" TEXT NOT NULL,
  "customerEmail" TEXT NOT NULL,
  "customerPhone" TEXT NOT NULL,
  "shippingAddress" TEXT NOT NULL,
  "billingAddress" TEXT,
  "subtotalAmount" DOUBLE PRECISION NOT NULL,
  "discountAmount" DOUBLE PRECISION NOT NULL DEFAULT 0,
  "couponCode" TEXT,
  "couponDiscount" DOUBLE PRECISION NOT NULL DEFAULT 0,
  "shippingFee" DOUBLE PRECISION NOT NULL DEFAULT 0,
  "taxAmount" DOUBLE PRECISION NOT NULL DEFAULT 0,
  "totalPayableAmount" DOUBLE PRECISION NOT NULL,
  "orderStatus" "OrderStatus" NOT NULL DEFAULT 'PENDING',
  "paymentStatus" "PaymentStatus" NOT NULL DEFAULT 'PENDING',
  "paymentGateway" "PaymentGateway" NOT NULL DEFAULT 'RAZORPAY',
  "adminNotes" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "Order_pkey" PRIMARY KEY ("id")
);
CREATE TABLE "OrderItem" (
  "id" TEXT NOT NULL,
  "orderId" TEXT NOT NULL,
  "variantId" TEXT NOT NULL,
  "productNameSnapshot" TEXT NOT NULL,
  "variantSizeSnapshot" TEXT NOT NULL,
  "skuSnapshot" TEXT NOT NULL,
  "unitPrice" DOUBLE PRECISION NOT NULL,
  "quantity" INTEGER NOT NULL,
  "lineTotal" DOUBLE PRECISION NOT NULL,
  CONSTRAINT "OrderItem_pkey" PRIMARY KEY ("id")
);
CREATE TABLE "Payment" (
  "id" TEXT NOT NULL,
  "orderId" TEXT NOT NULL,
  "gateway" "PaymentGateway" NOT NULL,
  "razorpayOrderId" TEXT,
  "razorpayPaymentId" TEXT,
  "razorpaySignature" TEXT,
  "amount" DOUBLE PRECISION NOT NULL,
  "currency" TEXT NOT NULL DEFAULT 'INR',
  "status" "PaymentStatus" NOT NULL DEFAULT 'PENDING',
  "gatewayResponse" TEXT,
  "refundId" TEXT,
  "refundAmount" DOUBLE PRECISION,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "Payment_pkey" PRIMARY KEY ("id")
);
CREATE TABLE "Shipment" (
  "id" TEXT NOT NULL,
  "orderId" TEXT NOT NULL,
  "carrierName" TEXT NOT NULL,
  "trackingNumber" TEXT NOT NULL,
  "trackingUrl" TEXT,
  "status" "ShipmentStatus" NOT NULL DEFAULT 'LABEL_CREATED',
  "dispatchedAt" TIMESTAMP(3),
  "deliveredAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "Shipment_pkey" PRIMARY KEY ("id")
);
CREATE TABLE "Coupon" (
  "id" TEXT NOT NULL,
  "code" TEXT NOT NULL,
  "description" TEXT,
  "discountType" "DiscountType" NOT NULL,
  "discountValue" DOUBLE PRECISION NOT NULL,
  "minOrderValue" DOUBLE PRECISION NOT NULL DEFAULT 0,
  "maxDiscountCap" DOUBLE PRECISION,
  "usageLimit" INTEGER,
  "perUserLimit" INTEGER NOT NULL DEFAULT 1,
  "usedCount" INTEGER NOT NULL DEFAULT 0,
  "startDate" TIMESTAMP(3) NOT NULL,
  "endDate" TIMESTAMP(3) NOT NULL,
  "isActive" BOOLEAN NOT NULL DEFAULT TRUE,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "Coupon_pkey" PRIMARY KEY ("id")
);
CREATE TABLE "CouponUsage" (
  "id" TEXT NOT NULL,
  "couponId" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "orderId" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "CouponUsage_pkey" PRIMARY KEY ("id")
);
CREATE TABLE "Review" (
  "id" TEXT NOT NULL,
  "productId" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "rating" INTEGER NOT NULL,
  "title" TEXT,
  "comment" TEXT NOT NULL,
  "isVerified" BOOLEAN NOT NULL DEFAULT FALSE,
  "isApproved" BOOLEAN NOT NULL DEFAULT FALSE,
  "adminReply" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "Review_pkey" PRIMARY KEY ("id")
);
CREATE TABLE "Banner" (
  "id" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "subtitle" TEXT,
  "imageUrl" TEXT NOT NULL,
  "mobileImgUrl" TEXT,
  "linkUrl" TEXT,
  "buttonText" TEXT,
  "secondaryCtaText" TEXT,
  "secondaryCtaLink" TEXT,
  "sortOrder" INTEGER NOT NULL DEFAULT 0,
  "isActive" BOOLEAN NOT NULL DEFAULT TRUE,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "Banner_pkey" PRIMARY KEY ("id")
);
CREATE TABLE "HomepageSection" (
  "id" TEXT NOT NULL,
  "sectionKey" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "subtitle" TEXT,
  "sortOrder" INTEGER NOT NULL DEFAULT 0,
  "isActive" BOOLEAN NOT NULL DEFAULT TRUE,
  "metadata" TEXT,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "HomepageSection_pkey" PRIMARY KEY ("id")
);
CREATE TABLE "Testimonial" (
  "id" TEXT NOT NULL,
  "authorName" TEXT NOT NULL,
  "location" TEXT,
  "rating" INTEGER NOT NULL DEFAULT 5,
  "reviewQuote" TEXT NOT NULL,
  "avatarUrl" TEXT,
  "isActive" BOOLEAN NOT NULL DEFAULT TRUE,
  "sortOrder" INTEGER NOT NULL DEFAULT 0,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "Testimonial_pkey" PRIMARY KEY ("id")
);
CREATE TABLE "FaqItem" (
  "id" TEXT NOT NULL,
  "category" TEXT NOT NULL,
  "question" TEXT NOT NULL,
  "answer" TEXT NOT NULL,
  "sortOrder" INTEGER NOT NULL DEFAULT 0,
  "isActive" BOOLEAN NOT NULL DEFAULT TRUE,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "FaqItem_pkey" PRIMARY KEY ("id")
);
CREATE TABLE "BlogPost" (
  "id" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "slug" TEXT NOT NULL,
  "summary" TEXT,
  "content" TEXT NOT NULL,
  "featuredImg" TEXT,
  "authorName" TEXT NOT NULL DEFAULT 'Shlokveda Ayurvedic Expert',
  "readTimeMinutes" INTEGER NOT NULL DEFAULT 5,
  "isPublished" BOOLEAN NOT NULL DEFAULT FALSE,
  "publishedAt" TIMESTAMP(3),
  "metaTitle" TEXT,
  "metaDescription" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "BlogPost_pkey" PRIMARY KEY ("id")
);
CREATE TABLE "BlogCategory" (
  "id" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "slug" TEXT NOT NULL,
  CONSTRAINT "BlogCategory_pkey" PRIMARY KEY ("id")
);
CREATE TABLE "BlogToCategory" (
  "postId" TEXT NOT NULL,
  "categoryId" TEXT NOT NULL,
  CONSTRAINT "BlogToCategory_pkey" PRIMARY KEY ("postId", "categoryId")
);
CREATE TABLE "StaticPage" (
  "id" TEXT NOT NULL,
  "slug" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "content" TEXT NOT NULL,
  "metaTitle" TEXT,
  "metaDescription" TEXT,
  "layout" TEXT,
  "sections" JSONB,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "StaticPage_pkey" PRIMARY KEY ("id")
);
CREATE TABLE "BusinessSetting" (
  "id" TEXT NOT NULL,
  "key" TEXT NOT NULL,
  "value" TEXT NOT NULL,
  "description" TEXT,
  "isPublic" BOOLEAN NOT NULL DEFAULT FALSE,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "BusinessSetting_pkey" PRIMARY KEY ("id")
);
CREATE TABLE "AuditLog" (
  "id" TEXT NOT NULL,
  "userId" TEXT,
  "userEmail" TEXT,
  "action" TEXT NOT NULL,
  "entityType" TEXT NOT NULL,
  "entityId" TEXT,
  "oldValue" TEXT,
  "newValue" TEXT,
  "ipAddress" TEXT,
  "userAgent" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "AuditLog_pkey" PRIMARY KEY ("id")
);

-- Unique indexes
CREATE UNIQUE INDEX "User_email_key" ON "User" ("email");
CREATE UNIQUE INDEX "User_phone_key" ON "User" ("phone");
CREATE UNIQUE INDEX "Role_name_key" ON "Role" ("name");
CREATE UNIQUE INDEX "RolePermission_roleId_permission_key" ON "RolePermission" ("roleId", "permission");
CREATE UNIQUE INDEX "UserRole_userId_roleId_key" ON "UserRole" ("userId", "roleId");
CREATE UNIQUE INDEX "Category_slug_key" ON "Category" ("slug");
CREATE UNIQUE INDEX "Product_slug_key" ON "Product" ("slug");
CREATE UNIQUE INDEX "ProductVariant_sku_key" ON "ProductVariant" ("sku");
CREATE UNIQUE INDEX "Cart_userId_key" ON "Cart" ("userId");
CREATE UNIQUE INDEX "Cart_sessionId_key" ON "Cart" ("sessionId");
CREATE UNIQUE INDEX "CartItem_cartId_variantId_key" ON "CartItem" ("cartId", "variantId");
CREATE UNIQUE INDEX "Wishlist_userId_key" ON "Wishlist" ("userId");
CREATE UNIQUE INDEX "WishlistItem_wishlistId_productId_key" ON "WishlistItem" ("wishlistId", "productId");
CREATE UNIQUE INDEX "Order_orderNumber_key" ON "Order" ("orderNumber");
CREATE UNIQUE INDEX "Payment_orderId_key" ON "Payment" ("orderId");
CREATE UNIQUE INDEX "Payment_razorpayOrderId_key" ON "Payment" ("razorpayOrderId");
CREATE UNIQUE INDEX "Payment_razorpayPaymentId_key" ON "Payment" ("razorpayPaymentId");
CREATE UNIQUE INDEX "Shipment_orderId_key" ON "Shipment" ("orderId");
CREATE UNIQUE INDEX "Coupon_code_key" ON "Coupon" ("code");
CREATE UNIQUE INDEX "CouponUsage_couponId_userId_orderId_key" ON "CouponUsage" ("couponId", "userId", "orderId");
CREATE UNIQUE INDEX "HomepageSection_sectionKey_key" ON "HomepageSection" ("sectionKey");
CREATE UNIQUE INDEX "BlogPost_slug_key" ON "BlogPost" ("slug");
CREATE UNIQUE INDEX "BlogCategory_slug_key" ON "BlogCategory" ("slug");
CREATE UNIQUE INDEX "StaticPage_slug_key" ON "StaticPage" ("slug");
CREATE UNIQUE INDEX "BusinessSetting_key_key" ON "BusinessSetting" ("key");

-- Foreign keys
ALTER TABLE "RolePermission" ADD CONSTRAINT "RolePermission_roleId_fkey" FOREIGN KEY ("roleId") REFERENCES "Role" ("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "UserRole" ADD CONSTRAINT "UserRole_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "UserRole" ADD CONSTRAINT "UserRole_roleId_fkey" FOREIGN KEY ("roleId") REFERENCES "Role" ("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Address" ADD CONSTRAINT "Address_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Category" ADD CONSTRAINT "Category_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "Category" ("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "Product" ADD CONSTRAINT "Product_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "Category" ("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "ProductVariant" ADD CONSTRAINT "ProductVariant_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product" ("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ProductImage" ADD CONSTRAINT "ProductImage_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product" ("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "InventoryLedger" ADD CONSTRAINT "InventoryLedger_variantId_fkey" FOREIGN KEY ("variantId") REFERENCES "ProductVariant" ("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Cart" ADD CONSTRAINT "Cart_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "CartItem" ADD CONSTRAINT "CartItem_cartId_fkey" FOREIGN KEY ("cartId") REFERENCES "Cart" ("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "CartItem" ADD CONSTRAINT "CartItem_variantId_fkey" FOREIGN KEY ("variantId") REFERENCES "ProductVariant" ("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Wishlist" ADD CONSTRAINT "Wishlist_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "WishlistItem" ADD CONSTRAINT "WishlistItem_wishlistId_fkey" FOREIGN KEY ("wishlistId") REFERENCES "Wishlist" ("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "WishlistItem" ADD CONSTRAINT "WishlistItem_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product" ("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Order" ADD CONSTRAINT "Order_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "OrderItem" ADD CONSTRAINT "OrderItem_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order" ("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "OrderItem" ADD CONSTRAINT "OrderItem_variantId_fkey" FOREIGN KEY ("variantId") REFERENCES "ProductVariant" ("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Payment" ADD CONSTRAINT "Payment_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order" ("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Shipment" ADD CONSTRAINT "Shipment_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order" ("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "CouponUsage" ADD CONSTRAINT "CouponUsage_couponId_fkey" FOREIGN KEY ("couponId") REFERENCES "Coupon" ("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "CouponUsage" ADD CONSTRAINT "CouponUsage_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "CouponUsage" ADD CONSTRAINT "CouponUsage_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order" ("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Review" ADD CONSTRAINT "Review_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product" ("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Review" ADD CONSTRAINT "Review_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "BlogToCategory" ADD CONSTRAINT "BlogToCategory_postId_fkey" FOREIGN KEY ("postId") REFERENCES "BlogPost" ("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "BlogToCategory" ADD CONSTRAINT "BlogToCategory_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "BlogCategory" ("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "AuditLog" ADD CONSTRAINT "AuditLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Non-unique indexes
CREATE INDEX "User_email_idx" ON "User" ("email");
CREATE INDEX "User_phone_idx" ON "User" ("phone");
CREATE INDEX "RolePermission_roleId_idx" ON "RolePermission" ("roleId");
CREATE INDEX "UserRole_userId_idx" ON "UserRole" ("userId");
CREATE INDEX "UserRole_roleId_idx" ON "UserRole" ("roleId");
CREATE INDEX "Address_userId_idx" ON "Address" ("userId");
CREATE INDEX "Address_pincode_idx" ON "Address" ("pincode");
CREATE INDEX "Category_slug_idx" ON "Category" ("slug");
CREATE INDEX "Category_parentId_idx" ON "Category" ("parentId");
CREATE INDEX "Product_slug_idx" ON "Product" ("slug");
CREATE INDEX "Product_categoryId_idx" ON "Product" ("categoryId");
CREATE INDEX "Product_isActive_idx" ON "Product" ("isActive");
CREATE INDEX "Product_isFeatured_idx" ON "Product" ("isFeatured");
CREATE INDEX "Product_isBestseller_idx" ON "Product" ("isBestseller");
CREATE INDEX "ProductVariant_productId_idx" ON "ProductVariant" ("productId");
CREATE INDEX "ProductVariant_sku_idx" ON "ProductVariant" ("sku");
CREATE INDEX "ProductVariant_stockQuantity_idx" ON "ProductVariant" ("stockQuantity");
CREATE INDEX "ProductImage_productId_idx" ON "ProductImage" ("productId");
CREATE INDEX "InventoryLedger_variantId_idx" ON "InventoryLedger" ("variantId");
CREATE INDEX "InventoryLedger_createdAt_idx" ON "InventoryLedger" ("createdAt");
CREATE INDEX "Cart_sessionId_idx" ON "Cart" ("sessionId");
CREATE INDEX "CartItem_cartId_idx" ON "CartItem" ("cartId");
CREATE INDEX "CartItem_variantId_idx" ON "CartItem" ("variantId");
CREATE INDEX "WishlistItem_wishlistId_idx" ON "WishlistItem" ("wishlistId");
CREATE INDEX "Order_orderNumber_idx" ON "Order" ("orderNumber");
CREATE INDEX "Order_userId_idx" ON "Order" ("userId");
CREATE INDEX "Order_orderStatus_idx" ON "Order" ("orderStatus");
CREATE INDEX "Order_paymentStatus_idx" ON "Order" ("paymentStatus");
CREATE INDEX "Order_createdAt_idx" ON "Order" ("createdAt");
CREATE INDEX "OrderItem_orderId_idx" ON "OrderItem" ("orderId");
CREATE INDEX "OrderItem_variantId_idx" ON "OrderItem" ("variantId");
CREATE INDEX "Payment_razorpayOrderId_idx" ON "Payment" ("razorpayOrderId");
CREATE INDEX "Payment_razorpayPaymentId_idx" ON "Payment" ("razorpayPaymentId");
CREATE INDEX "Payment_status_idx" ON "Payment" ("status");
CREATE INDEX "Shipment_trackingNumber_idx" ON "Shipment" ("trackingNumber");
CREATE INDEX "Shipment_orderId_idx" ON "Shipment" ("orderId");
CREATE INDEX "Coupon_code_idx" ON "Coupon" ("code");
CREATE INDEX "Coupon_isActive_idx" ON "Coupon" ("isActive");
CREATE INDEX "CouponUsage_couponId_idx" ON "CouponUsage" ("couponId");
CREATE INDEX "CouponUsage_userId_idx" ON "CouponUsage" ("userId");
CREATE INDEX "Review_productId_idx" ON "Review" ("productId");
CREATE INDEX "Review_userId_idx" ON "Review" ("userId");
CREATE INDEX "Review_isApproved_idx" ON "Review" ("isApproved");
CREATE INDEX "BlogPost_slug_idx" ON "BlogPost" ("slug");
CREATE INDEX "BlogPost_isPublished_idx" ON "BlogPost" ("isPublished");
CREATE INDEX "BlogCategory_slug_idx" ON "BlogCategory" ("slug");
CREATE INDEX "AuditLog_entityType_entityId_idx" ON "AuditLog" ("entityType", "entityId");
CREATE INDEX "AuditLog_action_idx" ON "AuditLog" ("action");
CREATE INDEX "AuditLog_createdAt_idx" ON "AuditLog" ("createdAt");

-- Source catalogue: 8 categories, 84 products, 101 pack variants, 84 image references
INSERT INTO "Category" ("id", "name", "slug", "description", "imageUrl", "parentId", "displayOrder", "isActive", "metaTitle", "metaDescription", "createdAt", "updatedAt") VALUES
  ('cat_syrups_juices', 'Syrups & Juices', 'syrups-juices', 'Syrup and juice products listed in the supplied catalogue.', '/products/pdf-p4-i9.webp', NULL, 1, TRUE, 'Syrups & Juices | Shlokveda Product Catalogue', 'Syrup and juice products listed in the supplied catalogue.', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('cat_arks_drops', 'Arks & Drops', 'arks-drops', 'Ark and drop products listed in the supplied catalogue.', '/products/pdf-p3-i8.webp', NULL, 2, TRUE, 'Arks & Drops | Shlokveda Product Catalogue', 'Ark and drop products listed in the supplied catalogue.', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('cat_herbal_oils', 'Herbal Oils', 'herbal-oils', 'Herbal oils listed in the supplied catalogue.', '/products/castor-oil-pack.webp', NULL, 3, TRUE, 'Herbal Oils | Shlokveda Product Catalogue', 'Herbal oils listed in the supplied catalogue.', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('cat_capsules', 'Herbal Capsules', 'herbal-capsules', 'Herbal capsule products listed in the supplied catalogue.', '/products/arjun-capsule-pack.webp', NULL, 4, TRUE, 'Herbal Capsules | Shlokveda Product Catalogue', 'Herbal capsule products listed in the supplied catalogue.', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('cat_vati_gutika', 'Tablets', 'tablets', 'Tablet products listed in the supplied catalogue.', '/products/pdf-p6-i2.webp', NULL, 5, TRUE, 'Tablets | Shlokveda Product Catalogue', 'Tablet products listed in the supplied catalogue.', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('cat_daily_wellness', 'Daily Wellness', 'daily-wellness', 'Daily wellness products listed in the supplied catalogue.', '/products/pdf-p15-i1.webp', NULL, 6, TRUE, 'Daily Wellness | Shlokveda Product Catalogue', 'Daily wellness products listed in the supplied catalogue.', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('cat_immunity_rasayana', 'Immunity & Rasayana', 'immunity-rasayana', 'Immunity and rasayana products listed in the supplied catalogue.', '/products/pdf-p15-i3.webp', NULL, 7, TRUE, 'Immunity & Rasayana | Shlokveda Product Catalogue', 'Immunity and rasayana products listed in the supplied catalogue.', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('cat_personal_care', 'Personal Care', 'personal-care', 'Personal-care products listed in the supplied catalogue.', '/products/pdf-p15-i4.webp', NULL, 8, TRUE, 'Personal Care | Shlokveda Product Catalogue', 'Personal-care products listed in the supplied catalogue.', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

INSERT INTO "Product" ("id", "categoryId", "name", "slug", "skuPrefix", "shortDescription", "fullDescription", "ingredients", "benefits", "usageInstructions", "precautions", "ayurvedicFormulation", "ayushLicenseNo", "fssaiLicenseNo", "isFeatured", "isBestseller", "isNewArrival", "isActive", "metaTitle", "metaDescription", "metaKeywords", "createdAt", "updatedAt") VALUES
  ('pdf_aloe_vera_with_honey_amla_tulsi', 'cat_syrups_juices', 'Aloe Vera with Honey, Amla & Tulsi', 'aloe-vera-with-honey-amla-tulsi', 'SV-001', 'Pack size: 1 L. Listed in the supplied brochure on page 4.', 'Aloe Vera with Honey, Amla & Tulsi is listed in the supplied product brochure on page 4. Pack size and printed MRP are transcribed from that source. See the original product label for complete product information.', 'Aloe vera, honey, amla and tulsi.', 'No additional therapeutic claims are made on this page. Please read the product label and consult a qualified healthcare professional.', 'Follow the directions printed on the product label or the advice of a qualified healthcare professional.', 'This product information is not medical advice. Consult a qualified healthcare professional before use, especially if pregnant, nursing, taking medication or managing a health condition.', 'SYRUP', NULL, NULL, TRUE, FALSE, FALSE, TRUE, 'Aloe Vera with Honey, Amla & Tulsi | Shlokveda Product Catalogue', 'Pack size: 1 L. Listed in the supplied brochure on page 4.', NULL, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('pdf_aloe_vera_juice', 'cat_syrups_juices', 'Aloe Vera Juice', 'aloe-vera-juice', 'SV-002', 'Pack size: 1 L. Listed in the supplied brochure on page 4.', 'Aloe Vera Juice is listed in the supplied product brochure on page 4. Pack size and printed MRP are transcribed from that source. See the original product label for complete product information.', 'Refer to the product label.', 'No additional therapeutic claims are made on this page. Please read the product label and consult a qualified healthcare professional.', 'Follow the directions printed on the product label or the advice of a qualified healthcare professional.', 'This product information is not medical advice. Consult a qualified healthcare professional before use, especially if pregnant, nursing, taking medication or managing a health condition.', 'SYRUP', NULL, NULL, TRUE, FALSE, FALSE, TRUE, 'Aloe Vera Juice | Shlokveda Product Catalogue', 'Pack size: 1 L. Listed in the supplied brochure on page 4.', NULL, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('pdf_amrit_ras', 'cat_syrups_juices', 'Amrit Ras', 'amrit-ras', 'SV-003', 'Pack size: 200 ml / 1 L. Listed in the supplied brochure on page 6.', 'Amrit Ras is listed in the supplied product brochure on page 6. Pack size and printed MRP are transcribed from that source. See the original product label for complete product information.', 'Giloy ras, papita, tulsi, adusa, darunapushpi, nagarmotha, bhramhi and harad.', 'No additional therapeutic claims are made on this page. Please read the product label and consult a qualified healthcare professional.', 'Follow the directions printed on the product label or the advice of a qualified healthcare professional.', 'This product information is not medical advice. Consult a qualified healthcare professional before use, especially if pregnant, nursing, taking medication or managing a health condition.', 'SYRUP', NULL, NULL, TRUE, FALSE, FALSE, TRUE, 'Amrit Ras | Shlokveda Product Catalogue', 'Pack size: 200 ml / 1 L. Listed in the supplied brochure on page 6.', NULL, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('pdf_anti_diabetes', 'cat_syrups_juices', 'Anti Diabetes', 'anti-diabetes', 'SV-004', 'Pack size: 1 L. Listed in the supplied brochure on page 7.', 'Anti Diabetes is listed in the supplied product brochure on page 7. Pack size and printed MRP are transcribed from that source. See the original product label for complete product information.', 'Gudmar, bhumi amla, punarnava, makoy, kasni, jamun, dalchini, vijaysar, chirata, kutki and ashwagandha.', 'No additional therapeutic claims are made on this page. Please read the product label and consult a qualified healthcare professional.', 'Follow the directions printed on the product label or the advice of a qualified healthcare professional.', 'This product information is not medical advice. Consult a qualified healthcare professional before use, especially if pregnant, nursing, taking medication or managing a health condition.', 'SYRUP', NULL, NULL, TRUE, FALSE, FALSE, TRUE, 'Anti Diabetes | Shlokveda Product Catalogue', 'Pack size: 1 L. Listed in the supplied brochure on page 7.', NULL, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('pdf_arjun_capsule', 'cat_capsules', 'Arjun Capsule', 'arjun-capsule', 'SV-005', 'Pack size: 60 capsules. Listed in the supplied brochure on page 13.', 'Arjun Capsule is listed in the supplied product brochure on page 13. Pack size and printed MRP are transcribed from that source. See the original product label for complete product information.', 'Composition is not transcribed here. Please refer to the product packaging.', 'No additional therapeutic claims are made on this page. Please read the product label and consult a qualified healthcare professional.', 'Follow the directions printed on the product label or the advice of a qualified healthcare professional.', 'This product information is not medical advice. Consult a qualified healthcare professional before use, especially if pregnant, nursing, taking medication or managing a health condition.', 'CAPSULE', NULL, NULL, TRUE, FALSE, FALSE, TRUE, 'Arjun Capsule | Shlokveda Product Catalogue', 'Pack size: 60 capsules. Listed in the supplied brochure on page 13.', NULL, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('pdf_a2_desi_ghee', 'cat_daily_wellness', 'A2 Desi Ghee', 'a2-desi-ghee', 'SV-006', 'Pack size: 1 L. Listed in the supplied brochure on page 15.', 'A2 Desi Ghee is listed in the supplied product brochure on page 15. Pack size and printed MRP are transcribed from that source. See the original product label for complete product information.', 'Composition is not transcribed here. Please refer to the product packaging.', 'No additional therapeutic claims are made on this page. Please read the product label and consult a qualified healthcare professional.', 'Follow the directions printed on the product label or the advice of a qualified healthcare professional.', 'This product information is not medical advice. Consult a qualified healthcare professional before use, especially if pregnant, nursing, taking medication or managing a health condition.', 'OTHER', NULL, NULL, TRUE, FALSE, FALSE, TRUE, 'A2 Desi Ghee | Shlokveda Product Catalogue', 'Pack size: 1 L. Listed in the supplied brochure on page 15.', NULL, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('pdf_allicin_capsule', 'cat_capsules', 'Allicin Capsule', 'allicin-capsule', 'SV-007', 'Pack size: 60 capsules. Listed in the supplied brochure on page 14.', 'Allicin Capsule is listed in the supplied product brochure on page 14. Pack size and printed MRP are transcribed from that source. See the original product label for complete product information.', 'Composition is not transcribed here. Please refer to the product packaging.', 'No additional therapeutic claims are made on this page. Please read the product label and consult a qualified healthcare professional.', 'Follow the directions printed on the product label or the advice of a qualified healthcare professional.', 'This product information is not medical advice. Consult a qualified healthcare professional before use, especially if pregnant, nursing, taking medication or managing a health condition.', 'CAPSULE', NULL, NULL, TRUE, FALSE, FALSE, TRUE, 'Allicin Capsule | Shlokveda Product Catalogue', 'Pack size: 60 capsules. Listed in the supplied brochure on page 14.', NULL, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('pdf_amla_ras', 'cat_syrups_juices', 'Amla Ras', 'amla-ras', 'SV-008', 'Pack size: 1 L. Listed in the supplied brochure on page 5.', 'Amla Ras is listed in the supplied product brochure on page 5. Pack size and printed MRP are transcribed from that source. See the original product label for complete product information.', 'Composition is not transcribed here. Please refer to the product packaging.', 'No additional therapeutic claims are made on this page. Please read the product label and consult a qualified healthcare professional.', 'Follow the directions printed on the product label or the advice of a qualified healthcare professional.', 'This product information is not medical advice. Consult a qualified healthcare professional before use, especially if pregnant, nursing, taking medication or managing a health condition.', 'SYRUP', NULL, NULL, TRUE, FALSE, FALSE, TRUE, 'Amla Ras | Shlokveda Product Catalogue', 'Pack size: 1 L. Listed in the supplied brochure on page 5.', NULL, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('pdf_ashwagandha_capsule', 'cat_capsules', 'Ashwagandha Capsule', 'ashwagandha-capsule', 'SV-009', 'Pack size: 60 capsules. Listed in the supplied brochure on page 12.', 'Ashwagandha Capsule is listed in the supplied product brochure on page 12. Pack size and printed MRP are transcribed from that source. See the original product label for complete product information.', 'Composition is not transcribed here. Please refer to the product packaging.', 'No additional therapeutic claims are made on this page. Please read the product label and consult a qualified healthcare professional.', 'Follow the directions printed on the product label or the advice of a qualified healthcare professional.', 'This product information is not medical advice. Consult a qualified healthcare professional before use, especially if pregnant, nursing, taking medication or managing a health condition.', 'CAPSULE', NULL, NULL, FALSE, FALSE, FALSE, TRUE, 'Ashwagandha Capsule | Shlokveda Product Catalogue', 'Pack size: 60 capsules. Listed in the supplied brochure on page 12.', NULL, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('pdf_ajwain_ark', 'cat_arks_drops', 'Ajwain Ark', 'ajwain-ark', 'SV-010', 'Pack size: 30 ml. Listed in the supplied brochure on page 3.', 'Ajwain Ark is listed in the supplied product brochure on page 3. Pack size and printed MRP are transcribed from that source. See the original product label for complete product information.', 'Ajwain ark; refer to the product label for the complete composition and directions.', 'No additional therapeutic claims are made on this page. Please read the product label and consult a qualified healthcare professional.', 'Follow the directions printed on the product label or the advice of a qualified healthcare professional.', 'This product information is not medical advice. Consult a qualified healthcare professional before use, especially if pregnant, nursing, taking medication or managing a health condition.', 'KWATH', NULL, NULL, FALSE, FALSE, FALSE, TRUE, 'Ajwain Ark | Shlokveda Product Catalogue', 'Pack size: 30 ml. Listed in the supplied brochure on page 3.', NULL, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('pdf_bhumi_punarnava', 'cat_syrups_juices', 'Bhumi Punarnava', 'bhumi-punarnava', 'SV-011', 'Pack size: 1 L / 200 ml. Listed in the supplied brochure on page 5.', 'Bhumi Punarnava is listed in the supplied product brochure on page 5. Pack size and printed MRP are transcribed from that source. See the original product label for complete product information.', 'Bhumi amla, punarnava, makoy, kasni and anantmool.', 'No additional therapeutic claims are made on this page. Please read the product label and consult a qualified healthcare professional.', 'Follow the directions printed on the product label or the advice of a qualified healthcare professional.', 'This product information is not medical advice. Consult a qualified healthcare professional before use, especially if pregnant, nursing, taking medication or managing a health condition.', 'SYRUP', NULL, NULL, FALSE, FALSE, FALSE, TRUE, 'Bhumi Punarnava | Shlokveda Product Catalogue', 'Pack size: 1 L / 200 ml. Listed in the supplied brochure on page 5.', NULL, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('pdf_bhumi_amla_capsule', 'cat_capsules', 'Bhumi Amla Capsule', 'bhumi-amla-capsule', 'SV-012', 'Pack size: 60 capsules. Listed in the supplied brochure on page 12.', 'Bhumi Amla Capsule is listed in the supplied product brochure on page 12. Pack size and printed MRP are transcribed from that source. See the original product label for complete product information.', 'Composition is not transcribed here. Please refer to the product packaging.', 'No additional therapeutic claims are made on this page. Please read the product label and consult a qualified healthcare professional.', 'Follow the directions printed on the product label or the advice of a qualified healthcare professional.', 'This product information is not medical advice. Consult a qualified healthcare professional before use, especially if pregnant, nursing, taking medication or managing a health condition.', 'CAPSULE', NULL, NULL, FALSE, FALSE, FALSE, TRUE, 'Bhumi Amla Capsule | Shlokveda Product Catalogue', 'Pack size: 60 capsules. Listed in the supplied brochure on page 12.', NULL, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('pdf_cough_care', 'cat_syrups_juices', 'Cough Care', 'cough-care', 'SV-013', 'Pack size: 100 ml. Listed in the supplied brochure on page 6.', 'Cough Care is listed in the supplied product brochure on page 6. Pack size and printed MRP are transcribed from that source. See the original product label for complete product information.', 'Yashtimadhu, sunthi, tulsi, somlata, slesmarak, bharangi, banfsa, jufah, vibhitak, vasaka, pudina and vach; honey base.', 'No additional therapeutic claims are made on this page. Please read the product label and consult a qualified healthcare professional.', 'Follow the directions printed on the product label or the advice of a qualified healthcare professional.', 'This product information is not medical advice. Consult a qualified healthcare professional before use, especially if pregnant, nursing, taking medication or managing a health condition.', 'SYRUP', NULL, NULL, FALSE, FALSE, FALSE, TRUE, 'Cough Care | Shlokveda Product Catalogue', 'Pack size: 100 ml. Listed in the supplied brochure on page 6.', NULL, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('pdf_castor_oil', 'cat_herbal_oils', 'Castor Oil', 'castor-oil', 'SV-014', 'Pack size: 100 ml. Listed in the supplied brochure on page 10.', 'Castor Oil is listed in the supplied product brochure on page 10. Pack size and printed MRP are transcribed from that source. See the original product label for complete product information.', 'Composition is not transcribed here. Please refer to the product packaging.', 'No additional therapeutic claims are made on this page. Please read the product label and consult a qualified healthcare professional.', 'Follow the directions printed on the product label or the advice of a qualified healthcare professional.', 'This product information is not medical advice. Consult a qualified healthcare professional before use, especially if pregnant, nursing, taking medication or managing a health condition.', 'TAILA', NULL, NULL, FALSE, FALSE, FALSE, TRUE, 'Castor Oil | Shlokveda Product Catalogue', 'Pack size: 100 ml. Listed in the supplied brochure on page 10.', NULL, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('pdf_chyawanprash_kesar_yukta', 'cat_immunity_rasayana', 'Chyawanprash Kesar Yukta', 'chyawanprash-kesar-yukta', 'SV-015', 'Pack size: 1 kg. Listed in the supplied brochure on page 15.', 'Chyawanprash Kesar Yukta is listed in the supplied product brochure on page 15. Pack size and printed MRP are transcribed from that source. See the original product label for complete product information.', 'Composition is not transcribed here. Please refer to the product packaging.', 'No additional therapeutic claims are made on this page. Please read the product label and consult a qualified healthcare professional.', 'Follow the directions printed on the product label or the advice of a qualified healthcare professional.', 'This product information is not medical advice. Consult a qualified healthcare professional before use, especially if pregnant, nursing, taking medication or managing a health condition.', 'AWALEHA', NULL, NULL, FALSE, FALSE, FALSE, TRUE, 'Chyawanprash Kesar Yukta | Shlokveda Product Catalogue', 'Pack size: 1 kg. Listed in the supplied brochure on page 15.', NULL, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('pdf_curcumin_capsule', 'cat_capsules', 'Curcumin Capsule', 'curcumin-capsule', 'SV-016', 'Pack size: 60 capsules. Listed in the supplied brochure on page 13.', 'Curcumin Capsule is listed in the supplied product brochure on page 13. Pack size and printed MRP are transcribed from that source. See the original product label for complete product information.', 'Composition is not transcribed here. Please refer to the product packaging.', 'No additional therapeutic claims are made on this page. Please read the product label and consult a qualified healthcare professional.', 'Follow the directions printed on the product label or the advice of a qualified healthcare professional.', 'This product information is not medical advice. Consult a qualified healthcare professional before use, especially if pregnant, nursing, taking medication or managing a health condition.', 'CAPSULE', NULL, NULL, FALSE, FALSE, FALSE, TRUE, 'Curcumin Capsule | Shlokveda Product Catalogue', 'Pack size: 60 capsules. Listed in the supplied brochure on page 13.', NULL, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('pdf_cumin_ark', 'cat_arks_drops', 'Cumin Ark', 'cumin-ark', 'SV-017', 'Pack size: 30 ml. Listed in the supplied brochure on page 3.', 'Cumin Ark is listed in the supplied product brochure on page 3. Pack size and printed MRP are transcribed from that source. See the original product label for complete product information.', 'Composition is not transcribed here. Please refer to the product packaging.', 'No additional therapeutic claims are made on this page. Please read the product label and consult a qualified healthcare professional.', 'Follow the directions printed on the product label or the advice of a qualified healthcare professional.', 'This product information is not medical advice. Consult a qualified healthcare professional before use, especially if pregnant, nursing, taking medication or managing a health condition.', 'KWATH', NULL, NULL, FALSE, FALSE, FALSE, TRUE, 'Cumin Ark | Shlokveda Product Catalogue', 'Pack size: 30 ml. Listed in the supplied brochure on page 3.', NULL, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('pdf_dento_strong', 'cat_personal_care', 'Dento Strong', 'dento-strong', 'SV-018', 'Pack size: 100 g. Listed in the supplied brochure on page 14.', 'Dento Strong is listed in the supplied product brochure on page 14. Pack size and printed MRP are transcribed from that source. See the original product label for complete product information.', 'Composition is not transcribed here. Please refer to the product packaging.', 'No additional therapeutic claims are made on this page. Please read the product label and consult a qualified healthcare professional.', 'Follow the directions printed on the product label or the advice of a qualified healthcare professional.', 'This product information is not medical advice. Consult a qualified healthcare professional before use, especially if pregnant, nursing, taking medication or managing a health condition.', 'OTHER', NULL, NULL, FALSE, FALSE, FALSE, TRUE, 'Dento Strong | Shlokveda Product Catalogue', 'Pack size: 100 g. Listed in the supplied brochure on page 14.', NULL, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('pdf_detox_capsule', 'cat_capsules', 'Detox Capsule', 'detox-capsule', 'SV-019', 'Pack size: 60 capsules. Listed in the supplied brochure on page 9.', 'Detox Capsule is listed in the supplied product brochure on page 9. Pack size and printed MRP are transcribed from that source. See the original product label for complete product information.', 'Composition is not transcribed here. Please refer to the product packaging.', 'No additional therapeutic claims are made on this page. Please read the product label and consult a qualified healthcare professional.', 'Follow the directions printed on the product label or the advice of a qualified healthcare professional.', 'This product information is not medical advice. Consult a qualified healthcare professional before use, especially if pregnant, nursing, taking medication or managing a health condition.', 'CAPSULE', NULL, NULL, FALSE, FALSE, FALSE, TRUE, 'Detox Capsule | Shlokveda Product Catalogue', 'Pack size: 60 capsules. Listed in the supplied brochure on page 9.', NULL, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('pdf_detox_syrup', 'cat_syrups_juices', 'Detox Syrup', 'detox-syrup', 'SV-020', 'Pack size: 500 ml. Listed in the supplied brochure on page 13.', 'Detox Syrup is listed in the supplied product brochure on page 13. Pack size and printed MRP are transcribed from that source. See the original product label for complete product information.', 'Composition is not transcribed here. Please refer to the product packaging.', 'No additional therapeutic claims are made on this page. Please read the product label and consult a qualified healthcare professional.', 'Follow the directions printed on the product label or the advice of a qualified healthcare professional.', 'This product information is not medical advice. Consult a qualified healthcare professional before use, especially if pregnant, nursing, taking medication or managing a health condition.', 'SYRUP', NULL, NULL, FALSE, FALSE, FALSE, TRUE, 'Detox Syrup | Shlokveda Product Catalogue', 'Pack size: 500 ml. Listed in the supplied brochure on page 13.', NULL, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('pdf_dhamasa_capsule', 'cat_capsules', 'Dhamasa Capsule', 'dhamasa-capsule', 'SV-021', 'Pack size: 60 capsules. Listed in the supplied brochure on page 10.', 'Dhamasa Capsule is listed in the supplied product brochure on page 10. Pack size and printed MRP are transcribed from that source. See the original product label for complete product information.', 'Composition is not transcribed here. Please refer to the product packaging.', 'No additional therapeutic claims are made on this page. Please read the product label and consult a qualified healthcare professional.', 'Follow the directions printed on the product label or the advice of a qualified healthcare professional.', 'This product information is not medical advice. Consult a qualified healthcare professional before use, especially if pregnant, nursing, taking medication or managing a health condition.', 'CAPSULE', NULL, NULL, FALSE, FALSE, FALSE, TRUE, 'Dhamasa Capsule | Shlokveda Product Catalogue', 'Pack size: 60 capsules. Listed in the supplied brochure on page 10.', NULL, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('pdf_eye_care', 'cat_daily_wellness', 'Eye Care', 'eye-care', 'SV-022', 'Pack size: 200 ml / 500 ml / 1 L. Listed in the supplied brochure on page 15.', 'Eye Care is listed in the supplied product brochure on page 15. Pack size and printed MRP are transcribed from that source. See the original product label for complete product information.', 'Composition is not transcribed here. Please refer to the product packaging.', 'No additional therapeutic claims are made on this page. Please read the product label and consult a qualified healthcare professional.', 'Follow the directions printed on the product label or the advice of a qualified healthcare professional.', 'This product information is not medical advice. Consult a qualified healthcare professional before use, especially if pregnant, nursing, taking medication or managing a health condition.', 'SYRUP', NULL, NULL, FALSE, FALSE, FALSE, TRUE, 'Eye Care | Shlokveda Product Catalogue', 'Pack size: 200 ml / 500 ml / 1 L. Listed in the supplied brochure on page 15.', NULL, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('pdf_flax_seeds', 'cat_daily_wellness', 'Flax Seeds', 'flax-seeds', 'SV-023', 'Pack size: 400 g. Listed in the supplied brochure on page 11.', 'Flax Seeds is listed in the supplied product brochure on page 11. Pack size and printed MRP are transcribed from that source. See the original product label for complete product information.', 'Composition is not transcribed here. Please refer to the product packaging.', 'No additional therapeutic claims are made on this page. Please read the product label and consult a qualified healthcare professional.', 'Follow the directions printed on the product label or the advice of a qualified healthcare professional.', 'This product information is not medical advice. Consult a qualified healthcare professional before use, especially if pregnant, nursing, taking medication or managing a health condition.', 'RAW_HERB', NULL, NULL, FALSE, FALSE, FALSE, TRUE, 'Flax Seeds | Shlokveda Product Catalogue', 'Pack size: 400 g. Listed in the supplied brochure on page 11.', NULL, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('pdf_flax_oil', 'cat_herbal_oils', 'Flax Oil', 'flax-oil', 'SV-024', 'Pack size: 100 ml. Listed in the supplied brochure on page 9.', 'Flax Oil is listed in the supplied product brochure on page 9. Pack size and printed MRP are transcribed from that source. See the original product label for complete product information.', 'Composition is not transcribed here. Please refer to the product packaging.', 'No additional therapeutic claims are made on this page. Please read the product label and consult a qualified healthcare professional.', 'Follow the directions printed on the product label or the advice of a qualified healthcare professional.', 'This product information is not medical advice. Consult a qualified healthcare professional before use, especially if pregnant, nursing, taking medication or managing a health condition.', 'TAILA', NULL, NULL, FALSE, FALSE, FALSE, TRUE, 'Flax Oil | Shlokveda Product Catalogue', 'Pack size: 100 ml. Listed in the supplied brochure on page 9.', NULL, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('pdf_fat_melter', 'cat_syrups_juices', 'Fat Melter', 'fat-melter', 'SV-025', 'Pack size: 1 L. Listed in the supplied brochure on page 9.', 'Fat Melter is listed in the supplied product brochure on page 9. Pack size and printed MRP are transcribed from that source. See the original product label for complete product information.', 'Composition is not transcribed here. Please refer to the product packaging.', 'No additional therapeutic claims are made on this page. Please read the product label and consult a qualified healthcare professional.', 'Follow the directions printed on the product label or the advice of a qualified healthcare professional.', 'This product information is not medical advice. Consult a qualified healthcare professional before use, especially if pregnant, nursing, taking medication or managing a health condition.', 'SYRUP', NULL, NULL, FALSE, FALSE, FALSE, TRUE, 'Fat Melter | Shlokveda Product Catalogue', 'Pack size: 1 L. Listed in the supplied brochure on page 9.', NULL, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('pdf_gastro_sanjivani', 'cat_syrups_juices', 'Gastro Sanjivani', 'gastro-sanjivani', 'SV-026', 'Pack size: 500 ml / 200 ml. Listed in the supplied brochure on page 5.', 'Gastro Sanjivani is listed in the supplied product brochure on page 5. Pack size and printed MRP are transcribed from that source. See the original product label for complete product information.', 'Amaltas, nagarmotha, methi, saunf, gulab patti, mulethi, triphala, giloy, aloe vera, nishoth, sanai and indrayan.', 'No additional therapeutic claims are made on this page. Please read the product label and consult a qualified healthcare professional.', 'Follow the directions printed on the product label or the advice of a qualified healthcare professional.', 'This product information is not medical advice. Consult a qualified healthcare professional before use, especially if pregnant, nursing, taking medication or managing a health condition.', 'SYRUP', NULL, NULL, FALSE, FALSE, FALSE, TRUE, 'Gastro Sanjivani | Shlokveda Product Catalogue', 'Pack size: 500 ml / 200 ml. Listed in the supplied brochure on page 5.', NULL, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('pdf_grape_seed_extract', 'cat_capsules', 'Grape Seed Extract', 'grape-seed-extract', 'SV-027', 'Pack size: 60 capsules. Listed in the supplied brochure on page 15.', 'Grape Seed Extract is listed in the supplied product brochure on page 15. Pack size and printed MRP are transcribed from that source. See the original product label for complete product information.', 'Composition is not transcribed here. Please refer to the product packaging.', 'No additional therapeutic claims are made on this page. Please read the product label and consult a qualified healthcare professional.', 'Follow the directions printed on the product label or the advice of a qualified healthcare professional.', 'This product information is not medical advice. Consult a qualified healthcare professional before use, especially if pregnant, nursing, taking medication or managing a health condition.', 'CAPSULE', NULL, NULL, FALSE, FALSE, FALSE, TRUE, 'Grape Seed Extract | Shlokveda Product Catalogue', 'Pack size: 60 capsules. Listed in the supplied brochure on page 15.', NULL, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('pdf_green_tea_tablet', 'cat_capsules', 'Green Tea Tablet', 'green-tea-tablet', 'SV-028', 'Pack size: 60 tablets. Listed in the supplied brochure on page 12.', 'Green Tea Tablet is listed in the supplied product brochure on page 12. Pack size and printed MRP are transcribed from that source. See the original product label for complete product information.', 'Composition is not transcribed here. Please refer to the product packaging.', 'No additional therapeutic claims are made on this page. Please read the product label and consult a qualified healthcare professional.', 'Follow the directions printed on the product label or the advice of a qualified healthcare professional.', 'This product information is not medical advice. Consult a qualified healthcare professional before use, especially if pregnant, nursing, taking medication or managing a health condition.', 'TABLET', NULL, NULL, FALSE, FALSE, FALSE, TRUE, 'Green Tea Tablet | Shlokveda Product Catalogue', 'Pack size: 60 tablets. Listed in the supplied brochure on page 12.', NULL, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('pdf_gokhru_capsule', 'cat_capsules', 'Gokhru Capsule', 'gokhru-capsule', 'SV-029', 'Pack size: 60 capsules. Listed in the supplied brochure on page 13.', 'Gokhru Capsule is listed in the supplied product brochure on page 13. Pack size and printed MRP are transcribed from that source. See the original product label for complete product information.', 'Composition is not transcribed here. Please refer to the product packaging.', 'No additional therapeutic claims are made on this page. Please read the product label and consult a qualified healthcare professional.', 'Follow the directions printed on the product label or the advice of a qualified healthcare professional.', 'This product information is not medical advice. Consult a qualified healthcare professional before use, especially if pregnant, nursing, taking medication or managing a health condition.', 'CAPSULE', NULL, NULL, FALSE, FALSE, FALSE, TRUE, 'Gokhru Capsule | Shlokveda Product Catalogue', 'Pack size: 60 capsules. Listed in the supplied brochure on page 13.', NULL, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('pdf_gymnema_capsule', 'cat_capsules', 'Gymnema Capsule', 'gymnema-capsule', 'SV-030', 'Pack size: 60 capsules. Listed in the supplied brochure on page 13.', 'Gymnema Capsule is listed in the supplied product brochure on page 13. Pack size and printed MRP are transcribed from that source. See the original product label for complete product information.', 'Composition is not transcribed here. Please refer to the product packaging.', 'No additional therapeutic claims are made on this page. Please read the product label and consult a qualified healthcare professional.', 'Follow the directions printed on the product label or the advice of a qualified healthcare professional.', 'This product information is not medical advice. Consult a qualified healthcare professional before use, especially if pregnant, nursing, taking medication or managing a health condition.', 'CAPSULE', NULL, NULL, FALSE, FALSE, FALSE, TRUE, 'Gymnema Capsule | Shlokveda Product Catalogue', 'Pack size: 60 capsules. Listed in the supplied brochure on page 13.', NULL, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('pdf_gau_amrit', 'cat_syrups_juices', 'Gau Amrit', 'gau-amrit', 'SV-031', 'Pack size: 200 ml / 500 ml. Listed in the supplied brochure on page 8.', 'Gau Amrit is listed in the supplied product brochure on page 8. Pack size and printed MRP are transcribed from that source. See the original product label for complete product information.', 'Composition is not transcribed here. Please refer to the product packaging.', 'No additional therapeutic claims are made on this page. Please read the product label and consult a qualified healthcare professional.', 'Follow the directions printed on the product label or the advice of a qualified healthcare professional.', 'This product information is not medical advice. Consult a qualified healthcare professional before use, especially if pregnant, nursing, taking medication or managing a health condition.', 'SYRUP', NULL, NULL, FALSE, FALSE, FALSE, TRUE, 'Gau Amrit | Shlokveda Product Catalogue', 'Pack size: 200 ml / 500 ml. Listed in the supplied brochure on page 8.', NULL, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('pdf_h_b_booster', 'cat_syrups_juices', 'H.B. Booster', 'h-b-booster', 'SV-032', 'Pack size: 1 L / 200 ml. Listed in the supplied brochure on page 8.', 'H.B. Booster is listed in the supplied product brochure on page 8. Pack size and printed MRP are transcribed from that source. See the original product label for complete product information.', 'Composition is not transcribed here. Please refer to the product packaging.', 'No additional therapeutic claims are made on this page. Please read the product label and consult a qualified healthcare professional.', 'Follow the directions printed on the product label or the advice of a qualified healthcare professional.', 'This product information is not medical advice. Consult a qualified healthcare professional before use, especially if pregnant, nursing, taking medication or managing a health condition.', 'SYRUP', NULL, NULL, FALSE, FALSE, FALSE, TRUE, 'H.B. Booster | Shlokveda Product Catalogue', 'Pack size: 1 L / 200 ml. Listed in the supplied brochure on page 8.', NULL, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('pdf_heart_re_booster', 'cat_syrups_juices', 'Heart Re Booster', 'heart-re-booster', 'SV-033', 'Pack size: 500 ml. Listed in the supplied brochure on page 6.', 'Heart Re Booster is listed in the supplied product brochure on page 6. Pack size and printed MRP are transcribed from that source. See the original product label for complete product information.', 'Composition is not transcribed here. Please refer to the product packaging.', 'No additional therapeutic claims are made on this page. Please read the product label and consult a qualified healthcare professional.', 'Follow the directions printed on the product label or the advice of a qualified healthcare professional.', 'This product information is not medical advice. Consult a qualified healthcare professional before use, especially if pregnant, nursing, taking medication or managing a health condition.', 'SYRUP', NULL, NULL, FALSE, FALSE, FALSE, TRUE, 'Heart Re Booster | Shlokveda Product Catalogue', 'Pack size: 500 ml. Listed in the supplied brochure on page 6.', NULL, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('pdf_heart_re_booster_premium', 'cat_syrups_juices', 'Heart Re Booster Premium', 'heart-re-booster-premium', 'SV-034', 'Pack size: 200 ml. Listed in the supplied brochure on page 11.', 'Heart Re Booster Premium is listed in the supplied product brochure on page 11. Pack size and printed MRP are transcribed from that source. See the original product label for complete product information.', 'Composition is not transcribed here. Please refer to the product packaging.', 'No additional therapeutic claims are made on this page. Please read the product label and consult a qualified healthcare professional.', 'Follow the directions printed on the product label or the advice of a qualified healthcare professional.', 'This product information is not medical advice. Consult a qualified healthcare professional before use, especially if pregnant, nursing, taking medication or managing a health condition.', 'SYRUP', NULL, NULL, FALSE, FALSE, FALSE, TRUE, 'Heart Re Booster Premium | Shlokveda Product Catalogue', 'Pack size: 200 ml. Listed in the supplied brochure on page 11.', NULL, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('pdf_heart_fit', 'cat_capsules', 'Heart Fit', 'heart-fit', 'SV-035', 'Pack size: 60 capsules. Listed in the supplied brochure on page 4.', 'Heart Fit is listed in the supplied product brochure on page 4. Pack size and printed MRP are transcribed from that source. See the original product label for complete product information.', 'Composition is not transcribed here. Please refer to the product packaging.', 'No additional therapeutic claims are made on this page. Please read the product label and consult a qualified healthcare professional.', 'Follow the directions printed on the product label or the advice of a qualified healthcare professional.', 'This product information is not medical advice. Consult a qualified healthcare professional before use, especially if pregnant, nursing, taking medication or managing a health condition.', 'CAPSULE', NULL, NULL, FALSE, FALSE, FALSE, TRUE, 'Heart Fit | Shlokveda Product Catalogue', 'Pack size: 60 capsules. Listed in the supplied brochure on page 4.', NULL, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('pdf_ib_9_drop_immunity_drops', 'cat_arks_drops', 'IB-9 Drop (Immunity Drops)', 'ib-9-drop-immunity-drops', 'SV-036', 'Pack size: 25 ml. Listed in the supplied brochure on page 6.', 'IB-9 Drop (Immunity Drops) is listed in the supplied product brochure on page 6. Pack size and printed MRP are transcribed from that source. See the original product label for complete product information.', 'Mulethi, ashwagandha, giloy, curcumin, honey bee propolis, tulsi, ginger, cinnamon, neem, vitamin C and black pepper.', 'No additional therapeutic claims are made on this page. Please read the product label and consult a qualified healthcare professional.', 'Follow the directions printed on the product label or the advice of a qualified healthcare professional.', 'This product information is not medical advice. Consult a qualified healthcare professional before use, especially if pregnant, nursing, taking medication or managing a health condition.', 'OTHER', NULL, NULL, FALSE, FALSE, FALSE, TRUE, 'IB-9 Drop (Immunity Drops) | Shlokveda Product Catalogue', 'Pack size: 25 ml. Listed in the supplied brochure on page 6.', NULL, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('pdf_joint_re_builder_syrup', 'cat_syrups_juices', 'Joint Re-Builder Syrup', 'joint-re-builder-syrup', 'SV-037', 'Pack size: 500 ml. Listed in the supplied brochure on page 6.', 'Joint Re-Builder Syrup is listed in the supplied product brochure on page 6. Pack size and printed MRP are transcribed from that source. See the original product label for complete product information.', 'Composition is not transcribed here. Please refer to the product packaging.', 'No additional therapeutic claims are made on this page. Please read the product label and consult a qualified healthcare professional.', 'Follow the directions printed on the product label or the advice of a qualified healthcare professional.', 'This product information is not medical advice. Consult a qualified healthcare professional before use, especially if pregnant, nursing, taking medication or managing a health condition.', 'SYRUP', NULL, NULL, FALSE, FALSE, FALSE, TRUE, 'Joint Re-Builder Syrup | Shlokveda Product Catalogue', 'Pack size: 500 ml. Listed in the supplied brochure on page 6.', NULL, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('pdf_joint_re_builder_tablet', 'cat_vati_gutika', 'Joint Re-Builder Tablet', 'joint-re-builder-tablet', 'SV-038', 'Pack size: 30 tablets / 60 tablets. Listed in the supplied brochure on page 6.', 'Joint Re-Builder Tablet is listed in the supplied product brochure on page 6. Pack size and printed MRP are transcribed from that source. See the original product label for complete product information.', 'Composition is not transcribed here. Please refer to the product packaging.', 'No additional therapeutic claims are made on this page. Please read the product label and consult a qualified healthcare professional.', 'Follow the directions printed on the product label or the advice of a qualified healthcare professional.', 'This product information is not medical advice. Consult a qualified healthcare professional before use, especially if pregnant, nursing, taking medication or managing a health condition.', 'TABLET', NULL, NULL, FALSE, FALSE, FALSE, TRUE, 'Joint Re-Builder Tablet | Shlokveda Product Catalogue', 'Pack size: 30 tablets / 60 tablets. Listed in the supplied brochure on page 6.', NULL, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('pdf_joint_re_builder_syrup_premium', 'cat_syrups_juices', 'Joint Re-Builder Syrup Premium', 'joint-re-builder-syrup-premium', 'SV-039', 'Pack size: 500 ml. Listed in the supplied brochure on page 6.', 'Joint Re-Builder Syrup Premium is listed in the supplied product brochure on page 6. Pack size and printed MRP are transcribed from that source. See the original product label for complete product information.', 'Composition is not transcribed here. Please refer to the product packaging.', 'No additional therapeutic claims are made on this page. Please read the product label and consult a qualified healthcare professional.', 'Follow the directions printed on the product label or the advice of a qualified healthcare professional.', 'This product information is not medical advice. Consult a qualified healthcare professional before use, especially if pregnant, nursing, taking medication or managing a health condition.', 'SYRUP', NULL, NULL, FALSE, FALSE, FALSE, TRUE, 'Joint Re-Builder Syrup Premium | Shlokveda Product Catalogue', 'Pack size: 500 ml. Listed in the supplied brochure on page 6.', NULL, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('pdf_joint_tablet_premium', 'cat_vati_gutika', 'Joint Tablet Premium', 'joint-tablet-premium', 'SV-040', 'Pack size: 60 tablets. Listed in the supplied brochure on page 6.', 'Joint Tablet Premium is listed in the supplied product brochure on page 6. Pack size and printed MRP are transcribed from that source. See the original product label for complete product information.', 'Composition is not transcribed here. Please refer to the product packaging.', 'No additional therapeutic claims are made on this page. Please read the product label and consult a qualified healthcare professional.', 'Follow the directions printed on the product label or the advice of a qualified healthcare professional.', 'This product information is not medical advice. Consult a qualified healthcare professional before use, especially if pregnant, nursing, taking medication or managing a health condition.', 'TABLET', NULL, NULL, FALSE, FALSE, FALSE, TRUE, 'Joint Tablet Premium | Shlokveda Product Catalogue', 'Pack size: 60 tablets. Listed in the supplied brochure on page 6.', NULL, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('pdf_joint_pain_oil', 'cat_herbal_oils', 'Joint Pain Oil', 'joint-pain-oil', 'SV-041', 'Pack size: 100 ml. Listed in the supplied brochure on page 6.', 'Joint Pain Oil is listed in the supplied product brochure on page 6. Pack size and printed MRP are transcribed from that source. See the original product label for complete product information.', 'Composition is not transcribed here. Please refer to the product packaging.', 'No additional therapeutic claims are made on this page. Please read the product label and consult a qualified healthcare professional.', 'Follow the directions printed on the product label or the advice of a qualified healthcare professional.', 'This product information is not medical advice. Consult a qualified healthcare professional before use, especially if pregnant, nursing, taking medication or managing a health condition.', 'TAILA', NULL, NULL, FALSE, FALSE, FALSE, TRUE, 'Joint Pain Oil | Shlokveda Product Catalogue', 'Pack size: 100 ml. Listed in the supplied brochure on page 6.', NULL, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('pdf_joint_pain_liniment_oil', 'cat_herbal_oils', 'Joint Pain Liniment (Oil)', 'joint-pain-liniment-oil', 'SV-042', 'Pack size: 75 ml. Listed in the supplied brochure on page 6.', 'Joint Pain Liniment (Oil) is listed in the supplied product brochure on page 6. Pack size and printed MRP are transcribed from that source. See the original product label for complete product information.', 'Sesame oil, flax oil, wintergreen oil, eucalyptus oil, ajwain oil, camphor oil, turpentine oil, peppermint oil, boswellia oil and turmeric oil.', 'No additional therapeutic claims are made on this page. Please read the product label and consult a qualified healthcare professional.', 'Follow the directions printed on the product label or the advice of a qualified healthcare professional.', 'This product information is not medical advice. Consult a qualified healthcare professional before use, especially if pregnant, nursing, taking medication or managing a health condition.', 'TAILA', NULL, NULL, FALSE, FALSE, FALSE, TRUE, 'Joint Pain Liniment (Oil) | Shlokveda Product Catalogue', 'Pack size: 75 ml. Listed in the supplied brochure on page 6.', NULL, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('pdf_kalonji_oil', 'cat_herbal_oils', 'Kalonji Oil', 'kalonji-oil', 'SV-043', 'Pack size: 100 ml. Listed in the supplied brochure on page 10.', 'Kalonji Oil is listed in the supplied product brochure on page 10. Pack size and printed MRP are transcribed from that source. See the original product label for complete product information.', 'Composition is not transcribed here. Please refer to the product packaging.', 'No additional therapeutic claims are made on this page. Please read the product label and consult a qualified healthcare professional.', 'Follow the directions printed on the product label or the advice of a qualified healthcare professional.', 'This product information is not medical advice. Consult a qualified healthcare professional before use, especially if pregnant, nursing, taking medication or managing a health condition.', 'TAILA', NULL, NULL, FALSE, FALSE, FALSE, TRUE, 'Kalonji Oil | Shlokveda Product Catalogue', 'Pack size: 100 ml. Listed in the supplied brochure on page 10.', NULL, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('pdf_kidney_reactivator', 'cat_syrups_juices', 'Kidney Reactivator', 'kidney-reactivator', 'SV-044', 'Pack size: 500 ml. Listed in the supplied brochure on page 8.', 'Kidney Reactivator is listed in the supplied product brochure on page 8. Pack size and printed MRP are transcribed from that source. See the original product label for complete product information.', 'Composition is not transcribed here. Please refer to the product packaging.', 'No additional therapeutic claims are made on this page. Please read the product label and consult a qualified healthcare professional.', 'Follow the directions printed on the product label or the advice of a qualified healthcare professional.', 'This product information is not medical advice. Consult a qualified healthcare professional before use, especially if pregnant, nursing, taking medication or managing a health condition.', 'SYRUP', NULL, NULL, FALSE, FALSE, FALSE, TRUE, 'Kidney Reactivator | Shlokveda Product Catalogue', 'Pack size: 500 ml. Listed in the supplied brochure on page 8.', NULL, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('pdf_kwach_capsule', 'cat_capsules', 'Kwach Capsule', 'kwach-capsule', 'SV-045', 'Pack size: 30 capsules. Listed in the supplied brochure on page 11.', 'Kwach Capsule is listed in the supplied product brochure on page 11. Pack size and printed MRP are transcribed from that source. See the original product label for complete product information.', 'Composition is not transcribed here. Please refer to the product packaging.', 'No additional therapeutic claims are made on this page. Please read the product label and consult a qualified healthcare professional.', 'Follow the directions printed on the product label or the advice of a qualified healthcare professional.', 'This product information is not medical advice. Consult a qualified healthcare professional before use, especially if pregnant, nursing, taking medication or managing a health condition.', 'CAPSULE', NULL, NULL, FALSE, FALSE, FALSE, TRUE, 'Kwach Capsule | Shlokveda Product Catalogue', 'Pack size: 30 capsules. Listed in the supplied brochure on page 11.', NULL, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('pdf_lipid_care', 'cat_syrups_juices', 'Lipid Care', 'lipid-care', 'SV-046', 'Pack size: 200 ml. Listed in the supplied brochure on page 4.', 'Lipid Care is listed in the supplied product brochure on page 4. Pack size and printed MRP are transcribed from that source. See the original product label for complete product information.', 'Bhringraj, kasni, sarpunkha, bhumi amla, aloe vera, haritaki, punarnava, kalmegh, giloy, kutki, papaya, saunth, ajwain, marich, syonak, amla, arjuna, brahmi, adrak, ashwagandha, sarpgandha, guggul, shankhpushpi, allicin and pushkarmool.', 'No additional therapeutic claims are made on this page. Please read the product label and consult a qualified healthcare professional.', 'Follow the directions printed on the product label or the advice of a qualified healthcare professional.', 'This product information is not medical advice. Consult a qualified healthcare professional before use, especially if pregnant, nursing, taking medication or managing a health condition.', 'SYRUP', NULL, NULL, FALSE, FALSE, FALSE, TRUE, 'Lipid Care | Shlokveda Product Catalogue', 'Pack size: 200 ml. Listed in the supplied brochure on page 4.', NULL, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('pdf_lungs_cleaner', 'cat_syrups_juices', 'Lungs Cleaner', 'lungs-cleaner', 'SV-047', 'Pack size: 500 ml / 200 ml. Listed in the supplied brochure on page 9.', 'Lungs Cleaner is listed in the supplied product brochure on page 9. Pack size and printed MRP are transcribed from that source. See the original product label for complete product information.', 'Composition is not transcribed here. Please refer to the product packaging.', 'No additional therapeutic claims are made on this page. Please read the product label and consult a qualified healthcare professional.', 'Follow the directions printed on the product label or the advice of a qualified healthcare professional.', 'This product information is not medical advice. Consult a qualified healthcare professional before use, especially if pregnant, nursing, taking medication or managing a health condition.', 'SYRUP', NULL, NULL, FALSE, FALSE, FALSE, TRUE, 'Lungs Cleaner | Shlokveda Product Catalogue', 'Pack size: 500 ml / 200 ml. Listed in the supplied brochure on page 9.', NULL, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('pdf_liv_ca_capsule', 'cat_capsules', 'Liv CA Capsule', 'liv-ca-capsule', 'SV-048', 'Pack size: 60 capsules. Listed in the supplied brochure on page 14.', 'Liv CA Capsule is listed in the supplied product brochure on page 14. Pack size and printed MRP are transcribed from that source. See the original product label for complete product information.', 'Composition is not transcribed here. Please refer to the product packaging.', 'No additional therapeutic claims are made on this page. Please read the product label and consult a qualified healthcare professional.', 'Follow the directions printed on the product label or the advice of a qualified healthcare professional.', 'This product information is not medical advice. Consult a qualified healthcare professional before use, especially if pregnant, nursing, taking medication or managing a health condition.', 'CAPSULE', NULL, NULL, FALSE, FALSE, FALSE, TRUE, 'Liv CA Capsule | Shlokveda Product Catalogue', 'Pack size: 60 capsules. Listed in the supplied brochure on page 14.', NULL, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('pdf_liver_reactivator', 'cat_syrups_juices', 'Liver Reactivator', 'liver-reactivator', 'SV-049', 'Pack size: 500 ml / 200 ml. Listed in the supplied brochure on page 5.', 'Liver Reactivator is listed in the supplied product brochure on page 5. Pack size and printed MRP are transcribed from that source. See the original product label for complete product information.', 'Bhringraj, kasni, sarpunkha, bhumi amla, aloe vera, haritaki, punarnava, kalmegh, giloy, kutki, papaya, saunth, ajwain, marich and syonak.', 'No additional therapeutic claims are made on this page. Please read the product label and consult a qualified healthcare professional.', 'Follow the directions printed on the product label or the advice of a qualified healthcare professional.', 'This product information is not medical advice. Consult a qualified healthcare professional before use, especially if pregnant, nursing, taking medication or managing a health condition.', 'SYRUP', NULL, NULL, FALSE, FALSE, FALSE, TRUE, 'Liver Reactivator | Shlokveda Product Catalogue', 'Pack size: 500 ml / 200 ml. Listed in the supplied brochure on page 5.', NULL, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('pdf_memory_booster', 'cat_syrups_juices', 'Memory Booster', 'memory-booster', 'SV-050', 'Pack size: 1 L / 200 ml. Listed in the supplied brochure on page 7.', 'Memory Booster is listed in the supplied product brochure on page 7. Pack size and printed MRP are transcribed from that source. See the original product label for complete product information.', 'Brahmi, semal, niacin, shankhpushpi, yashtimadhu, ashwagandha, jatamasi, vach, tagar, malkangni and sarpgandha.', 'No additional therapeutic claims are made on this page. Please read the product label and consult a qualified healthcare professional.', 'Follow the directions printed on the product label or the advice of a qualified healthcare professional.', 'This product information is not medical advice. Consult a qualified healthcare professional before use, especially if pregnant, nursing, taking medication or managing a health condition.', 'SYRUP', NULL, NULL, FALSE, FALSE, FALSE, TRUE, 'Memory Booster | Shlokveda Product Catalogue', 'Pack size: 1 L / 200 ml. Listed in the supplied brochure on page 7.', NULL, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('pdf_miracle_roots', 'cat_syrups_juices', 'Miracle Roots', 'miracle-roots', 'SV-051', 'Pack size: 500 ml. Listed in the supplied brochure on page 7.', 'Miracle Roots is listed in the supplied product brochure on page 7. Pack size and printed MRP are transcribed from that source. See the original product label for complete product information.', 'Composition is not transcribed here. Please refer to the product packaging.', 'No additional therapeutic claims are made on this page. Please read the product label and consult a qualified healthcare professional.', 'Follow the directions printed on the product label or the advice of a qualified healthcare professional.', 'This product information is not medical advice. Consult a qualified healthcare professional before use, especially if pregnant, nursing, taking medication or managing a health condition.', 'SYRUP', NULL, NULL, FALSE, FALSE, FALSE, TRUE, 'Miracle Roots | Shlokveda Product Catalogue', 'Pack size: 500 ml. Listed in the supplied brochure on page 7.', NULL, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('pdf_musheal_capsule', 'cat_capsules', 'Musheal Capsule', 'musheal-capsule', 'SV-052', 'Pack size: 60 capsules. Listed in the supplied brochure on page 14.', 'Musheal Capsule is listed in the supplied product brochure on page 14. Pack size and printed MRP are transcribed from that source. See the original product label for complete product information.', 'Composition is not transcribed here. Please refer to the product packaging.', 'No additional therapeutic claims are made on this page. Please read the product label and consult a qualified healthcare professional.', 'Follow the directions printed on the product label or the advice of a qualified healthcare professional.', 'This product information is not medical advice. Consult a qualified healthcare professional before use, especially if pregnant, nursing, taking medication or managing a health condition.', 'CAPSULE', NULL, NULL, FALSE, FALSE, FALSE, TRUE, 'Musheal Capsule | Shlokveda Product Catalogue', 'Pack size: 60 capsules. Listed in the supplied brochure on page 14.', NULL, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('pdf_migraine_care', 'cat_syrups_juices', 'Migraine Care', 'migraine-care', 'SV-053', 'Pack size: 200 ml / 500 ml / 1 L. Listed in the supplied brochure on page 10.', 'Migraine Care is listed in the supplied product brochure on page 10. Pack size and printed MRP are transcribed from that source. See the original product label for complete product information.', 'Composition is not transcribed here. Please refer to the product packaging.', 'No additional therapeutic claims are made on this page. Please read the product label and consult a qualified healthcare professional.', 'Follow the directions printed on the product label or the advice of a qualified healthcare professional.', 'This product information is not medical advice. Consult a qualified healthcare professional before use, especially if pregnant, nursing, taking medication or managing a health condition.', 'SYRUP', NULL, NULL, FALSE, FALSE, FALSE, TRUE, 'Migraine Care | Shlokveda Product Catalogue', 'Pack size: 200 ml / 500 ml / 1 L. Listed in the supplied brochure on page 10.', NULL, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('pdf_neem_oil', 'cat_herbal_oils', 'Neem Oil', 'neem-oil', 'SV-054', 'Pack size: 100 ml. Listed in the supplied brochure on page 11.', 'Neem Oil is listed in the supplied product brochure on page 11. Pack size and printed MRP are transcribed from that source. See the original product label for complete product information.', 'Composition is not transcribed here. Please refer to the product packaging.', 'No additional therapeutic claims are made on this page. Please read the product label and consult a qualified healthcare professional.', 'Follow the directions printed on the product label or the advice of a qualified healthcare professional.', 'This product information is not medical advice. Consult a qualified healthcare professional before use, especially if pregnant, nursing, taking medication or managing a health condition.', 'TAILA', NULL, NULL, FALSE, FALSE, FALSE, TRUE, 'Neem Oil | Shlokveda Product Catalogue', 'Pack size: 100 ml. Listed in the supplied brochure on page 11.', NULL, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('pdf_neuro_care', 'cat_syrups_juices', 'Neuro Care', 'neuro-care', 'SV-055', 'Pack size: 500 ml. Listed in the supplied brochure on page 8.', 'Neuro Care is listed in the supplied product brochure on page 8. Pack size and printed MRP are transcribed from that source. See the original product label for complete product information.', 'Composition is not transcribed here. Please refer to the product packaging.', 'No additional therapeutic claims are made on this page. Please read the product label and consult a qualified healthcare professional.', 'Follow the directions printed on the product label or the advice of a qualified healthcare professional.', 'This product information is not medical advice. Consult a qualified healthcare professional before use, especially if pregnant, nursing, taking medication or managing a health condition.', 'SYRUP', NULL, NULL, FALSE, FALSE, FALSE, TRUE, 'Neuro Care | Shlokveda Product Catalogue', 'Pack size: 500 ml. Listed in the supplied brochure on page 8.', NULL, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('pdf_noni', 'cat_syrups_juices', 'Noni', 'noni', 'SV-056', 'Pack size: 500 ml / 1 L. Listed in the supplied brochure on page 8.', 'Noni is listed in the supplied product brochure on page 8. Pack size and printed MRP are transcribed from that source. See the original product label for complete product information.', 'Composition is not transcribed here. Please refer to the product packaging.', 'No additional therapeutic claims are made on this page. Please read the product label and consult a qualified healthcare professional.', 'Follow the directions printed on the product label or the advice of a qualified healthcare professional.', 'This product information is not medical advice. Consult a qualified healthcare professional before use, especially if pregnant, nursing, taking medication or managing a health condition.', 'SYRUP', NULL, NULL, FALSE, FALSE, FALSE, TRUE, 'Noni | Shlokveda Product Catalogue', 'Pack size: 500 ml / 1 L. Listed in the supplied brochure on page 8.', NULL, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('pdf_neem_capsule', 'cat_capsules', 'Neem Capsule', 'neem-capsule', 'SV-057', 'Pack size: 60 capsules. Listed in the supplied brochure on page 12.', 'Neem Capsule is listed in the supplied product brochure on page 12. Pack size and printed MRP are transcribed from that source. See the original product label for complete product information.', 'Composition is not transcribed here. Please refer to the product packaging.', 'No additional therapeutic claims are made on this page. Please read the product label and consult a qualified healthcare professional.', 'Follow the directions printed on the product label or the advice of a qualified healthcare professional.', 'This product information is not medical advice. Consult a qualified healthcare professional before use, especially if pregnant, nursing, taking medication or managing a health condition.', 'CAPSULE', NULL, NULL, FALSE, FALSE, FALSE, TRUE, 'Neem Capsule | Shlokveda Product Catalogue', 'Pack size: 60 capsules. Listed in the supplied brochure on page 12.', NULL, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('pdf_pc_9_piles_care', 'cat_syrups_juices', 'PC-9 (Piles Care)', 'pc-9-piles-care', 'SV-058', 'Pack size: 1 L / 200 ml. Listed in the supplied brochure on page 9.', 'PC-9 (Piles Care) is listed in the supplied product brochure on page 9. Pack size and printed MRP are transcribed from that source. See the original product label for complete product information.', 'Composition is not transcribed here. Please refer to the product packaging.', 'No additional therapeutic claims are made on this page. Please read the product label and consult a qualified healthcare professional.', 'Follow the directions printed on the product label or the advice of a qualified healthcare professional.', 'This product information is not medical advice. Consult a qualified healthcare professional before use, especially if pregnant, nursing, taking medication or managing a health condition.', 'SYRUP', NULL, NULL, FALSE, FALSE, FALSE, TRUE, 'PC-9 (Piles Care) | Shlokveda Product Catalogue', 'Pack size: 1 L / 200 ml. Listed in the supplied brochure on page 9.', NULL, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('pdf_punarnava_capsule', 'cat_capsules', 'Punarnava Capsule', 'punarnava-capsule', 'SV-059', 'Pack size: 60 capsules. Listed in the supplied brochure on page 12.', 'Punarnava Capsule is listed in the supplied product brochure on page 12. Pack size and printed MRP are transcribed from that source. See the original product label for complete product information.', 'Composition is not transcribed here. Please refer to the product packaging.', 'No additional therapeutic claims are made on this page. Please read the product label and consult a qualified healthcare professional.', 'Follow the directions printed on the product label or the advice of a qualified healthcare professional.', 'This product information is not medical advice. Consult a qualified healthcare professional before use, especially if pregnant, nursing, taking medication or managing a health condition.', 'CAPSULE', NULL, NULL, FALSE, FALSE, FALSE, TRUE, 'Punarnava Capsule | Shlokveda Product Catalogue', 'Pack size: 60 capsules. Listed in the supplied brochure on page 12.', NULL, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('pdf_purush_rasayan', 'cat_syrups_juices', 'Purush Rasayan', 'purush-rasayan', 'SV-060', 'Pack size: 1 L. Listed in the supplied brochure on page 9.', 'Purush Rasayan is listed in the supplied product brochure on page 9. Pack size and printed MRP are transcribed from that source. See the original product label for complete product information.', 'Composition is not transcribed here. Please refer to the product packaging.', 'No additional therapeutic claims are made on this page. Please read the product label and consult a qualified healthcare professional.', 'Follow the directions printed on the product label or the advice of a qualified healthcare professional.', 'This product information is not medical advice. Consult a qualified healthcare professional before use, especially if pregnant, nursing, taking medication or managing a health condition.', 'SYRUP', NULL, NULL, FALSE, FALSE, FALSE, TRUE, 'Purush Rasayan | Shlokveda Product Catalogue', 'Pack size: 1 L. Listed in the supplied brochure on page 9.', NULL, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('pdf_panch_tulsi', 'cat_arks_drops', 'Panch Tulsi', 'panch-tulsi', 'SV-061', 'Pack size: 30 ml. Listed in the supplied brochure on page 3.', 'Panch Tulsi is listed in the supplied product brochure on page 3. Pack size and printed MRP are transcribed from that source. See the original product label for complete product information.', 'Composition is not transcribed here. Please refer to the product packaging.', 'No additional therapeutic claims are made on this page. Please read the product label and consult a qualified healthcare professional.', 'Follow the directions printed on the product label or the advice of a qualified healthcare professional.', 'This product information is not medical advice. Consult a qualified healthcare professional before use, especially if pregnant, nursing, taking medication or managing a health condition.', 'OTHER', NULL, NULL, FALSE, FALSE, FALSE, TRUE, 'Panch Tulsi | Shlokveda Product Catalogue', 'Pack size: 30 ml. Listed in the supplied brochure on page 3.', NULL, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('pdf_power_tulsi', 'cat_arks_drops', 'Power Tulsi', 'power-tulsi', 'SV-062', 'Pack size: 25 ml. Listed in the supplied brochure on page 3.', 'Power Tulsi is listed in the supplied product brochure on page 3. Pack size and printed MRP are transcribed from that source. See the original product label for complete product information.', 'Composition is not transcribed here. Please refer to the product packaging.', 'No additional therapeutic claims are made on this page. Please read the product label and consult a qualified healthcare professional.', 'Follow the directions printed on the product label or the advice of a qualified healthcare professional.', 'This product information is not medical advice. Consult a qualified healthcare professional before use, especially if pregnant, nursing, taking medication or managing a health condition.', 'OTHER', NULL, NULL, FALSE, FALSE, FALSE, TRUE, 'Power Tulsi | Shlokveda Product Catalogue', 'Pack size: 25 ml. Listed in the supplied brochure on page 3.', NULL, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('pdf_pr_drops', 'cat_arks_drops', 'PR Drops', 'pr-drops', 'SV-063', 'Pack size: 25 ml. Listed in the supplied brochure on page 3.', 'PR Drops is listed in the supplied product brochure on page 3. Pack size and printed MRP are transcribed from that source. See the original product label for complete product information.', 'Ashwagandha, ginseng, safed musli, maca root, horny goat weed, tongkat ali, akarkara, cordyceps and honey.', 'No additional therapeutic claims are made on this page. Please read the product label and consult a qualified healthcare professional.', 'Follow the directions printed on the product label or the advice of a qualified healthcare professional.', 'This product information is not medical advice. Consult a qualified healthcare professional before use, especially if pregnant, nursing, taking medication or managing a health condition.', 'OTHER', NULL, NULL, FALSE, FALSE, FALSE, TRUE, 'PR Drops | Shlokveda Product Catalogue', 'Pack size: 25 ml. Listed in the supplied brochure on page 3.', NULL, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('pdf_renal_fit_capsule', 'cat_capsules', 'Renal Fit Capsule', 'renal-fit-capsule', 'SV-064', 'Pack size: 60 capsules. Listed in the supplied brochure on page 11.', 'Renal Fit Capsule is listed in the supplied product brochure on page 11. Pack size and printed MRP are transcribed from that source. See the original product label for complete product information.', 'Composition is not transcribed here. Please refer to the product packaging.', 'No additional therapeutic claims are made on this page. Please read the product label and consult a qualified healthcare professional.', 'Follow the directions printed on the product label or the advice of a qualified healthcare professional.', 'This product information is not medical advice. Consult a qualified healthcare professional before use, especially if pregnant, nursing, taking medication or managing a health condition.', 'CAPSULE', NULL, NULL, FALSE, FALSE, FALSE, TRUE, 'Renal Fit Capsule | Shlokveda Product Catalogue', 'Pack size: 60 capsules. Listed in the supplied brochure on page 11.', NULL, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('pdf_resurrection_capsule', 'cat_capsules', 'Resurrection Capsule', 'resurrection-capsule', 'SV-065', 'Pack size: 60 capsules. Listed in the supplied brochure on page 14.', 'Resurrection Capsule is listed in the supplied product brochure on page 14. Pack size and printed MRP are transcribed from that source. See the original product label for complete product information.', 'Composition is not transcribed here. Please refer to the product packaging.', 'No additional therapeutic claims are made on this page. Please read the product label and consult a qualified healthcare professional.', 'Follow the directions printed on the product label or the advice of a qualified healthcare professional.', 'This product information is not medical advice. Consult a qualified healthcare professional before use, especially if pregnant, nursing, taking medication or managing a health condition.', 'CAPSULE', NULL, NULL, FALSE, FALSE, FALSE, TRUE, 'Resurrection Capsule | Shlokveda Product Catalogue', 'Pack size: 60 capsules. Listed in the supplied brochure on page 14.', NULL, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('pdf_saunf_ark', 'cat_arks_drops', 'Saunf Ark', 'saunf-ark', 'SV-066', 'Pack size: 30 ml. Listed in the supplied brochure on page 3.', 'Saunf Ark is listed in the supplied product brochure on page 3. Pack size and printed MRP are transcribed from that source. See the original product label for complete product information.', 'Composition is not transcribed here. Please refer to the product packaging.', 'No additional therapeutic claims are made on this page. Please read the product label and consult a qualified healthcare professional.', 'Follow the directions printed on the product label or the advice of a qualified healthcare professional.', 'This product information is not medical advice. Consult a qualified healthcare professional before use, especially if pregnant, nursing, taking medication or managing a health condition.', 'KWATH', NULL, NULL, FALSE, FALSE, FALSE, TRUE, 'Saunf Ark | Shlokveda Product Catalogue', 'Pack size: 30 ml. Listed in the supplied brochure on page 3.', NULL, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('pdf_skin_ark', 'cat_syrups_juices', 'Skin Ark', 'skin-ark', 'SV-067', 'Pack size: 500 ml. Listed in the supplied brochure on page 4.', 'Skin Ark is listed in the supplied product brochure on page 4. Pack size and printed MRP are transcribed from that source. See the original product label for complete product information.', 'Composition is not transcribed here. Please refer to the product packaging.', 'No additional therapeutic claims are made on this page. Please read the product label and consult a qualified healthcare professional.', 'Follow the directions printed on the product label or the advice of a qualified healthcare professional.', 'This product information is not medical advice. Consult a qualified healthcare professional before use, especially if pregnant, nursing, taking medication or managing a health condition.', 'SYRUP', NULL, NULL, FALSE, FALSE, FALSE, TRUE, 'Skin Ark | Shlokveda Product Catalogue', 'Pack size: 500 ml. Listed in the supplied brochure on page 4.', NULL, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('pdf_skin_oil', 'cat_herbal_oils', 'Skin Oil', 'skin-oil', 'SV-068', 'Pack size: 100 ml. Listed in the supplied brochure on page 4.', 'Skin Oil is listed in the supplied product brochure on page 4. Pack size and printed MRP are transcribed from that source. See the original product label for complete product information.', 'Composition is not transcribed here. Please refer to the product packaging.', 'No additional therapeutic claims are made on this page. Please read the product label and consult a qualified healthcare professional.', 'Follow the directions printed on the product label or the advice of a qualified healthcare professional.', 'This product information is not medical advice. Consult a qualified healthcare professional before use, especially if pregnant, nursing, taking medication or managing a health condition.', 'TAILA', NULL, NULL, FALSE, FALSE, FALSE, TRUE, 'Skin Oil | Shlokveda Product Catalogue', 'Pack size: 100 ml. Listed in the supplied brochure on page 4.', NULL, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('pdf_stone_away', 'cat_syrups_juices', 'Stone Away', 'stone-away', 'SV-069', 'Pack size: 200 ml. Listed in the supplied brochure on page 6.', 'Stone Away is listed in the supplied product brochure on page 6. Pack size and printed MRP are transcribed from that source. See the original product label for complete product information.', 'Composition is not transcribed here. Please refer to the product packaging.', 'No additional therapeutic claims are made on this page. Please read the product label and consult a qualified healthcare professional.', 'Follow the directions printed on the product label or the advice of a qualified healthcare professional.', 'This product information is not medical advice. Consult a qualified healthcare professional before use, especially if pregnant, nursing, taking medication or managing a health condition.', 'SYRUP', NULL, NULL, FALSE, FALSE, FALSE, TRUE, 'Stone Away | Shlokveda Product Catalogue', 'Pack size: 200 ml. Listed in the supplied brochure on page 6.', NULL, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('pdf_stri_sanjivani', 'cat_syrups_juices', 'Stri Sanjivani', 'stri-sanjivani', 'SV-070', 'Pack size: 1 L / 200 ml. Listed in the supplied brochure on page 7.', 'Stri Sanjivani is listed in the supplied product brochure on page 7. Pack size and printed MRP are transcribed from that source. See the original product label for complete product information.', 'Composition is not transcribed here. Please refer to the product packaging.', 'No additional therapeutic claims are made on this page. Please read the product label and consult a qualified healthcare professional.', 'Follow the directions printed on the product label or the advice of a qualified healthcare professional.', 'This product information is not medical advice. Consult a qualified healthcare professional before use, especially if pregnant, nursing, taking medication or managing a health condition.', 'SYRUP', NULL, NULL, FALSE, FALSE, FALSE, TRUE, 'Stri Sanjivani | Shlokveda Product Catalogue', 'Pack size: 1 L / 200 ml. Listed in the supplied brochure on page 7.', NULL, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('pdf_sarva_dhatu_pushti', 'cat_immunity_rasayana', 'Sarva Dhatu Pushti', 'sarva-dhatu-pushti', 'SV-071', 'Pack size: 400 g. Listed in the supplied brochure on page 15.', 'Sarva Dhatu Pushti is listed in the supplied product brochure on page 15. Pack size and printed MRP are transcribed from that source. See the original product label for complete product information.', 'Composition is not transcribed here. Please refer to the product packaging.', 'No additional therapeutic claims are made on this page. Please read the product label and consult a qualified healthcare professional.', 'Follow the directions printed on the product label or the advice of a qualified healthcare professional.', 'This product information is not medical advice. Consult a qualified healthcare professional before use, especially if pregnant, nursing, taking medication or managing a health condition.', 'OTHER', NULL, NULL, FALSE, FALSE, FALSE, TRUE, 'Sarva Dhatu Pushti | Shlokveda Product Catalogue', 'Pack size: 400 g. Listed in the supplied brochure on page 15.', NULL, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('pdf_sea_buckthorn_capsule', 'cat_capsules', 'Sea Buckthorn Capsule', 'sea-buckthorn-capsule', 'SV-072', 'Pack size: 60 capsules. Listed in the supplied brochure on page 13.', 'Sea Buckthorn Capsule is listed in the supplied product brochure on page 13. Pack size and printed MRP are transcribed from that source. See the original product label for complete product information.', 'Composition is not transcribed here. Please refer to the product packaging.', 'No additional therapeutic claims are made on this page. Please read the product label and consult a qualified healthcare professional.', 'Follow the directions printed on the product label or the advice of a qualified healthcare professional.', 'This product information is not medical advice. Consult a qualified healthcare professional before use, especially if pregnant, nursing, taking medication or managing a health condition.', 'CAPSULE', NULL, NULL, FALSE, FALSE, FALSE, TRUE, 'Sea Buckthorn Capsule | Shlokveda Product Catalogue', 'Pack size: 60 capsules. Listed in the supplied brochure on page 13.', NULL, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('pdf_shatawari_capsule', 'cat_capsules', 'Shatawari Capsule', 'shatawari-capsule', 'SV-073', 'Pack size: 60 capsules. Listed in the supplied brochure on page 12.', 'Shatawari Capsule is listed in the supplied product brochure on page 12. Pack size and printed MRP are transcribed from that source. See the original product label for complete product information.', 'Composition is not transcribed here. Please refer to the product packaging.', 'No additional therapeutic claims are made on this page. Please read the product label and consult a qualified healthcare professional.', 'Follow the directions printed on the product label or the advice of a qualified healthcare professional.', 'This product information is not medical advice. Consult a qualified healthcare professional before use, especially if pregnant, nursing, taking medication or managing a health condition.', 'CAPSULE', NULL, NULL, FALSE, FALSE, FALSE, TRUE, 'Shatawari Capsule | Shlokveda Product Catalogue', 'Pack size: 60 capsules. Listed in the supplied brochure on page 12.', NULL, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('pdf_silymarine_milk_thistle_capsule', 'cat_capsules', 'Silymarine Milk Thistle Capsule', 'silymarine-milk-thistle-capsule', 'SV-074', 'Pack size: 60 capsules. Listed in the supplied brochure on page 14.', 'Silymarine Milk Thistle Capsule is listed in the supplied product brochure on page 14. Pack size and printed MRP are transcribed from that source. See the original product label for complete product information.', 'Composition is not transcribed here. Please refer to the product packaging.', 'No additional therapeutic claims are made on this page. Please read the product label and consult a qualified healthcare professional.', 'Follow the directions printed on the product label or the advice of a qualified healthcare professional.', 'This product information is not medical advice. Consult a qualified healthcare professional before use, especially if pregnant, nursing, taking medication or managing a health condition.', 'CAPSULE', NULL, NULL, FALSE, FALSE, FALSE, TRUE, 'Silymarine Milk Thistle Capsule | Shlokveda Product Catalogue', 'Pack size: 60 capsules. Listed in the supplied brochure on page 14.', NULL, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('pdf_spirulina_capsule', 'cat_capsules', 'Spirulina Capsule', 'spirulina-capsule', 'SV-075', 'Pack size: 60 capsules. Listed in the supplied brochure on page 13.', 'Spirulina Capsule is listed in the supplied product brochure on page 13. Pack size and printed MRP are transcribed from that source. See the original product label for complete product information.', 'Composition is not transcribed here. Please refer to the product packaging.', 'No additional therapeutic claims are made on this page. Please read the product label and consult a qualified healthcare professional.', 'Follow the directions printed on the product label or the advice of a qualified healthcare professional.', 'This product information is not medical advice. Consult a qualified healthcare professional before use, especially if pregnant, nursing, taking medication or managing a health condition.', 'CAPSULE', NULL, NULL, FALSE, FALSE, FALSE, TRUE, 'Spirulina Capsule | Shlokveda Product Catalogue', 'Pack size: 60 capsules. Listed in the supplied brochure on page 13.', NULL, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('pdf_stevia_drop', 'cat_arks_drops', 'Stevia Drop', 'stevia-drop', 'SV-076', 'Pack size: 25 ml. Listed in the supplied brochure on page 15.', 'Stevia Drop is listed in the supplied product brochure on page 15. Pack size and printed MRP are transcribed from that source. See the original product label for complete product information.', 'Composition is not transcribed here. Please refer to the product packaging.', 'No additional therapeutic claims are made on this page. Please read the product label and consult a qualified healthcare professional.', 'Follow the directions printed on the product label or the advice of a qualified healthcare professional.', 'This product information is not medical advice. Consult a qualified healthcare professional before use, especially if pregnant, nursing, taking medication or managing a health condition.', 'OTHER', NULL, NULL, FALSE, FALSE, FALSE, TRUE, 'Stevia Drop | Shlokveda Product Catalogue', 'Pack size: 25 ml. Listed in the supplied brochure on page 15.', NULL, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('pdf_sugar_normal', 'cat_syrups_juices', 'Sugar Normal', 'sugar-normal', 'SV-077', 'Pack size: 500 ml. Listed in the supplied brochure on page 7.', 'Sugar Normal is listed in the supplied product brochure on page 7. Pack size and printed MRP are transcribed from that source. See the original product label for complete product information.', 'Shyam tulsi, papaya leaf, periwinkle leaf, wheat leaf, noni fruit, Indian rhubarb, turmeric, ginger, punarnava root, lemon chaff, ashwagandha, mulethi, kalonji seed, kachnar, dalchini and green tea.', 'No additional therapeutic claims are made on this page. Please read the product label and consult a qualified healthcare professional.', 'Follow the directions printed on the product label or the advice of a qualified healthcare professional.', 'This product information is not medical advice. Consult a qualified healthcare professional before use, especially if pregnant, nursing, taking medication or managing a health condition.', 'SYRUP', NULL, NULL, FALSE, FALSE, FALSE, TRUE, 'Sugar Normal | Shlokveda Product Catalogue', 'Pack size: 500 ml. Listed in the supplied brochure on page 7.', NULL, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('pdf_thyro_booster', 'cat_syrups_juices', 'Thyro Booster', 'thyro-booster', 'SV-078', 'Pack size: 500 ml. Listed in the supplied brochure on page 7.', 'Thyro Booster is listed in the supplied product brochure on page 7. Pack size and printed MRP are transcribed from that source. See the original product label for complete product information.', 'Composition is not transcribed here. Please refer to the product packaging.', 'No additional therapeutic claims are made on this page. Please read the product label and consult a qualified healthcare professional.', 'Follow the directions printed on the product label or the advice of a qualified healthcare professional.', 'This product information is not medical advice. Consult a qualified healthcare professional before use, especially if pregnant, nursing, taking medication or managing a health condition.', 'SYRUP', NULL, NULL, FALSE, FALSE, FALSE, TRUE, 'Thyro Booster | Shlokveda Product Catalogue', 'Pack size: 500 ml. Listed in the supplied brochure on page 7.', NULL, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('pdf_triphala_ras', 'cat_syrups_juices', 'Triphala Ras', 'triphala-ras', 'SV-079', 'Pack size: 500 ml. Listed in the supplied brochure on page 5.', 'Triphala Ras is listed in the supplied product brochure on page 5. Pack size and printed MRP are transcribed from that source. See the original product label for complete product information.', 'Amla, behra and harad.', 'No additional therapeutic claims are made on this page. Please read the product label and consult a qualified healthcare professional.', 'Follow the directions printed on the product label or the advice of a qualified healthcare professional.', 'This product information is not medical advice. Consult a qualified healthcare professional before use, especially if pregnant, nursing, taking medication or managing a health condition.', 'SYRUP', NULL, NULL, FALSE, FALSE, FALSE, TRUE, 'Triphala Ras | Shlokveda Product Catalogue', 'Pack size: 500 ml. Listed in the supplied brochure on page 5.', NULL, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('pdf_19_berries', 'cat_syrups_juices', '19 Berries', '19-berries', 'SV-080', 'Pack size: 500 ml. Listed in the supplied brochure on page 8.', '19 Berries is listed in the supplied product brochure on page 8. Pack size and printed MRP are transcribed from that source. See the original product label for complete product information.', 'Grape seed, acai berry, blueberry, cranberry, blackberry, gooseberry, raspberry, strawberry, mulberry, dewberry, bayberry, bilberry, bearberry, crowberry, goji berry, elderberry, sea buckthorn, green tea, ginseng, ganoderma and mangosteen.', 'No additional therapeutic claims are made on this page. Please read the product label and consult a qualified healthcare professional.', 'Follow the directions printed on the product label or the advice of a qualified healthcare professional.', 'This product information is not medical advice. Consult a qualified healthcare professional before use, especially if pregnant, nursing, taking medication or managing a health condition.', 'SYRUP', NULL, NULL, FALSE, FALSE, FALSE, TRUE, '19 Berries | Shlokveda Product Catalogue', 'Pack size: 500 ml. Listed in the supplied brochure on page 8.', NULL, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('pdf_triphala_ashtamrit', 'cat_syrups_juices', 'Triphala Ashtamrit', 'triphala-ashtamrit', 'SV-081', 'Pack size: 500 ml. Listed in the supplied brochure on page 5.', 'Triphala Ashtamrit is listed in the supplied product brochure on page 5. Pack size and printed MRP are transcribed from that source. See the original product label for complete product information.', 'Composition is not transcribed here. Please refer to the product packaging.', 'No additional therapeutic claims are made on this page. Please read the product label and consult a qualified healthcare professional.', 'Follow the directions printed on the product label or the advice of a qualified healthcare professional.', 'This product information is not medical advice. Consult a qualified healthcare professional before use, especially if pregnant, nursing, taking medication or managing a health condition.', 'SYRUP', NULL, NULL, FALSE, FALSE, FALSE, TRUE, 'Triphala Ashtamrit | Shlokveda Product Catalogue', 'Pack size: 500 ml. Listed in the supplied brochure on page 5.', NULL, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('pdf_wheat_grass_with_moringa', 'cat_syrups_juices', 'Wheat Grass with Moringa', 'wheat-grass-with-moringa', 'SV-082', 'Pack size: 1 L. Listed in the supplied brochure on page 10.', 'Wheat Grass with Moringa is listed in the supplied product brochure on page 10. Pack size and printed MRP are transcribed from that source. See the original product label for complete product information.', 'Wheat grass, aloe vera and moringa.', 'No additional therapeutic claims are made on this page. Please read the product label and consult a qualified healthcare professional.', 'Follow the directions printed on the product label or the advice of a qualified healthcare professional.', 'This product information is not medical advice. Consult a qualified healthcare professional before use, especially if pregnant, nursing, taking medication or managing a health condition.', 'SYRUP', NULL, NULL, FALSE, FALSE, FALSE, TRUE, 'Wheat Grass with Moringa | Shlokveda Product Catalogue', 'Pack size: 1 L. Listed in the supplied brochure on page 10.', NULL, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('pdf_wheat_grass', 'cat_syrups_juices', 'Wheat Grass', 'wheat-grass', 'SV-083', 'Pack size: 500 ml / 1 L. Listed in the supplied brochure on page 10.', 'Wheat Grass is listed in the supplied product brochure on page 10. Pack size and printed MRP are transcribed from that source. See the original product label for complete product information.', 'Composition is not transcribed here. Please refer to the product packaging.', 'No additional therapeutic claims are made on this page. Please read the product label and consult a qualified healthcare professional.', 'Follow the directions printed on the product label or the advice of a qualified healthcare professional.', 'This product information is not medical advice. Consult a qualified healthcare professional before use, especially if pregnant, nursing, taking medication or managing a health condition.', 'SYRUP', NULL, NULL, FALSE, FALSE, FALSE, TRUE, 'Wheat Grass | Shlokveda Product Catalogue', 'Pack size: 500 ml / 1 L. Listed in the supplied brochure on page 10.', NULL, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('pdf_wonder_berries', 'cat_syrups_juices', 'Wonder Berries', 'wonder-berries', 'SV-084', 'Pack size: 500 ml. Listed in the supplied brochure on page 9.', 'Wonder Berries is listed in the supplied product brochure on page 9. Pack size and printed MRP are transcribed from that source. See the original product label for complete product information.', 'Composition is not transcribed here. Please refer to the product packaging.', 'No additional therapeutic claims are made on this page. Please read the product label and consult a qualified healthcare professional.', 'Follow the directions printed on the product label or the advice of a qualified healthcare professional.', 'This product information is not medical advice. Consult a qualified healthcare professional before use, especially if pregnant, nursing, taking medication or managing a health condition.', 'SYRUP', NULL, NULL, FALSE, FALSE, FALSE, TRUE, 'Wonder Berries | Shlokveda Product Catalogue', 'Pack size: 500 ml. Listed in the supplied brochure on page 9.', NULL, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

INSERT INTO "ProductVariant" ("id", "productId", "sku", "sizeLabel", "mrp", "sellingPrice", "costPrice", "stockQuantity", "reservedQuantity", "lowStockThreshold", "weightInGrams", "isDefault", "isActive", "createdAt", "updatedAt") VALUES
  ('pdfv_aloe_vera_with_honey_amla_tulsi_1l', 'pdf_aloe_vera_with_honey_amla_tulsi', 'SV-001-01', '1 L', 585, 585, 0, 100, 0, 5, 0, TRUE, TRUE, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('pdfv_aloe_vera_juice_1l', 'pdf_aloe_vera_juice', 'SV-002-01', '1 L', 380, 380, 0, 100, 0, 5, 0, TRUE, TRUE, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('pdfv_amrit_ras_200ml', 'pdf_amrit_ras', 'SV-003-01', '200 ml', 160, 160, 0, 100, 0, 5, 0, TRUE, TRUE, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('pdfv_amrit_ras_1l', 'pdf_amrit_ras', 'SV-003-02', '1 L', 480, 480, 0, 100, 0, 5, 0, FALSE, TRUE, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('pdfv_anti_diabetes_1l', 'pdf_anti_diabetes', 'SV-004-01', '1 L', 540, 540, 0, 100, 0, 5, 0, TRUE, TRUE, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('pdfv_arjun_capsule_60capsules', 'pdf_arjun_capsule', 'SV-005-01', '60 capsules', 715, 715, 0, 100, 0, 5, 0, TRUE, TRUE, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('pdfv_a2_desi_ghee_1l', 'pdf_a2_desi_ghee', 'SV-006-01', '1 L', 1440, 1440, 0, 100, 0, 5, 0, TRUE, TRUE, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('pdfv_allicin_capsule_60capsules', 'pdf_allicin_capsule', 'SV-007-01', '60 capsules', 980, 980, 0, 100, 0, 5, 0, TRUE, TRUE, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('pdfv_amla_ras_1l', 'pdf_amla_ras', 'SV-008-01', '1 L', 380, 380, 0, 100, 0, 5, 0, TRUE, TRUE, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('pdfv_ashwagandha_capsule_60capsules', 'pdf_ashwagandha_capsule', 'SV-009-01', '60 capsules', 540, 540, 0, 100, 0, 5, 0, TRUE, TRUE, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('pdfv_ajwain_ark_30ml', 'pdf_ajwain_ark', 'SV-010-01', '30 ml', 160, 160, 0, 100, 0, 5, 0, TRUE, TRUE, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('pdfv_bhumi_punarnava_1l', 'pdf_bhumi_punarnava', 'SV-011-01', '1 L', 580, 580, 0, 100, 0, 5, 0, TRUE, TRUE, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('pdfv_bhumi_punarnava_200ml', 'pdf_bhumi_punarnava', 'SV-011-02', '200 ml', 160, 160, 0, 100, 0, 5, 0, FALSE, TRUE, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('pdfv_bhumi_amla_capsule_60capsules', 'pdf_bhumi_amla_capsule', 'SV-012-01', '60 capsules', 585, 585, 0, 100, 0, 5, 0, TRUE, TRUE, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('pdfv_cough_care_100ml', 'pdf_cough_care', 'SV-013-01', '100 ml', 70, 70, 0, 100, 0, 5, 0, TRUE, TRUE, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('pdfv_castor_oil_100ml', 'pdf_castor_oil', 'SV-014-01', '100 ml', 100, 100, 0, 100, 0, 5, 0, TRUE, TRUE, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('pdfv_chyawanprash_kesar_yukta_1kg', 'pdf_chyawanprash_kesar_yukta', 'SV-015-01', '1 kg', 880, 880, 0, 100, 0, 5, 0, TRUE, TRUE, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('pdfv_curcumin_capsule_60capsules', 'pdf_curcumin_capsule', 'SV-016-01', '60 capsules', 980, 980, 0, 100, 0, 5, 0, TRUE, TRUE, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('pdfv_cumin_ark_30ml', 'pdf_cumin_ark', 'SV-017-01', '30 ml', 160, 160, 0, 100, 0, 5, 0, TRUE, TRUE, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('pdfv_dento_strong_100g', 'pdf_dento_strong', 'SV-018-01', '100 g', 160, 160, 0, 100, 0, 5, 0, TRUE, TRUE, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('pdfv_detox_capsule_60capsules', 'pdf_detox_capsule', 'SV-019-01', '60 capsules', 450, 450, 0, 100, 0, 5, 0, TRUE, TRUE, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('pdfv_detox_syrup_500ml', 'pdf_detox_syrup', 'SV-020-01', '500 ml', 450, 450, 0, 100, 0, 5, 0, TRUE, TRUE, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('pdfv_dhamasa_capsule_60capsules', 'pdf_dhamasa_capsule', 'SV-021-01', '60 capsules', 540, 540, 0, 100, 0, 5, 0, TRUE, TRUE, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('pdfv_eye_care_200ml', 'pdf_eye_care', 'SV-022-01', '200 ml', 180, 180, 0, 100, 0, 5, 0, TRUE, TRUE, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('pdfv_eye_care_500ml', 'pdf_eye_care', 'SV-022-02', '500 ml', 430, 430, 0, 100, 0, 5, 0, FALSE, TRUE, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('pdfv_eye_care_1l', 'pdf_eye_care', 'SV-022-03', '1 L', 850, 850, 0, 100, 0, 5, 0, FALSE, TRUE, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('pdfv_flax_seeds_400g', 'pdf_flax_seeds', 'SV-023-01', '400 g', 180, 180, 0, 100, 0, 5, 0, TRUE, TRUE, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('pdfv_flax_oil_100ml', 'pdf_flax_oil', 'SV-024-01', '100 ml', 180, 180, 0, 100, 0, 5, 0, TRUE, TRUE, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('pdfv_fat_melter_1l', 'pdf_fat_melter', 'SV-025-01', '1 L', 1050, 1050, 0, 100, 0, 5, 0, TRUE, TRUE, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('pdfv_gastro_sanjivani_500ml', 'pdf_gastro_sanjivani', 'SV-026-01', '500 ml', 380, 380, 0, 100, 0, 5, 0, TRUE, TRUE, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('pdfv_gastro_sanjivani_200ml', 'pdf_gastro_sanjivani', 'SV-026-02', '200 ml', 160, 160, 0, 100, 0, 5, 0, FALSE, TRUE, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('pdfv_grape_seed_extract_60capsules', 'pdf_grape_seed_extract', 'SV-027-01', '60 capsules', 715, 715, 0, 100, 0, 5, 0, TRUE, TRUE, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('pdfv_green_tea_tablet_60tablets', 'pdf_green_tea_tablet', 'SV-028-01', '60 tablets', 480, 480, 0, 100, 0, 5, 0, TRUE, TRUE, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('pdfv_gokhru_capsule_60capsules', 'pdf_gokhru_capsule', 'SV-029-01', '60 capsules', 540, 540, 0, 100, 0, 5, 0, TRUE, TRUE, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('pdfv_gymnema_capsule_60capsules', 'pdf_gymnema_capsule', 'SV-030-01', '60 capsules', 540, 540, 0, 100, 0, 5, 0, TRUE, TRUE, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('pdfv_gau_amrit_200ml', 'pdf_gau_amrit', 'SV-031-01', '200 ml', 160, 160, 0, 100, 0, 5, 0, TRUE, TRUE, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('pdfv_gau_amrit_500ml', 'pdf_gau_amrit', 'SV-031-02', '500 ml', 380, 380, 0, 100, 0, 5, 0, FALSE, TRUE, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('pdfv_h_b_booster_1l', 'pdf_h_b_booster', 'SV-032-01', '1 L', 580, 580, 0, 100, 0, 5, 0, TRUE, TRUE, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('pdfv_h_b_booster_200ml', 'pdf_h_b_booster', 'SV-032-02', '200 ml', 160, 160, 0, 100, 0, 5, 0, FALSE, TRUE, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('pdfv_heart_re_booster_500ml', 'pdf_heart_re_booster', 'SV-033-01', '500 ml', 460, 460, 0, 100, 0, 5, 0, TRUE, TRUE, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('pdfv_heart_re_booster_premium_200ml', 'pdf_heart_re_booster_premium', 'SV-034-01', '200 ml', 270, 270, 0, 100, 0, 5, 0, TRUE, TRUE, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('pdfv_heart_fit_60capsules', 'pdf_heart_fit', 'SV-035-01', '60 capsules', 450, 450, 0, 100, 0, 5, 0, TRUE, TRUE, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('pdfv_ib_9_drop_immunity_drops_25ml', 'pdf_ib_9_drop_immunity_drops', 'SV-036-01', '25 ml', 180, 180, 0, 100, 0, 5, 0, TRUE, TRUE, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('pdfv_joint_re_builder_syrup_500ml', 'pdf_joint_re_builder_syrup', 'SV-037-01', '500 ml', 480, 480, 0, 100, 0, 5, 0, TRUE, TRUE, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('pdfv_joint_re_builder_tablet_30tablets', 'pdf_joint_re_builder_tablet', 'SV-038-01', '30 tablets', 190, 190, 0, 100, 0, 5, 0, TRUE, TRUE, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('pdfv_joint_re_builder_tablet_60tablets', 'pdf_joint_re_builder_tablet', 'SV-038-02', '60 tablets', 380, 380, 0, 100, 0, 5, 0, FALSE, TRUE, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('pdfv_joint_re_builder_syrup_premium_500ml', 'pdf_joint_re_builder_syrup_premium', 'SV-039-01', '500 ml', 580, 580, 0, 100, 0, 5, 0, TRUE, TRUE, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('pdfv_joint_tablet_premium_60tablets', 'pdf_joint_tablet_premium', 'SV-040-01', '60 tablets', 440, 440, 0, 100, 0, 5, 0, TRUE, TRUE, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('pdfv_joint_pain_oil_100ml', 'pdf_joint_pain_oil', 'SV-041-01', '100 ml', 180, 180, 0, 100, 0, 5, 0, TRUE, TRUE, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('pdfv_joint_pain_liniment_oil_75ml', 'pdf_joint_pain_liniment_oil', 'SV-042-01', '75 ml', 210, 210, 0, 100, 0, 5, 0, TRUE, TRUE, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('pdfv_kalonji_oil_100ml', 'pdf_kalonji_oil', 'SV-043-01', '100 ml', 160, 160, 0, 100, 0, 5, 0, TRUE, TRUE, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('pdfv_kidney_reactivator_500ml', 'pdf_kidney_reactivator', 'SV-044-01', '500 ml', 570, 570, 0, 100, 0, 5, 0, TRUE, TRUE, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('pdfv_kwach_capsule_30capsules', 'pdf_kwach_capsule', 'SV-045-01', '30 capsules', 460, 460, 0, 100, 0, 5, 0, TRUE, TRUE, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('pdfv_lipid_care_200ml', 'pdf_lipid_care', 'SV-046-01', '200 ml', 220, 220, 0, 100, 0, 5, 0, TRUE, TRUE, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('pdfv_lungs_cleaner_500ml', 'pdf_lungs_cleaner', 'SV-047-01', '500 ml', 715, 715, 0, 100, 0, 5, 0, TRUE, TRUE, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('pdfv_lungs_cleaner_200ml', 'pdf_lungs_cleaner', 'SV-047-02', '200 ml', 315, 315, 0, 100, 0, 5, 0, FALSE, TRUE, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('pdfv_liv_ca_capsule_60capsules', 'pdf_liv_ca_capsule', 'SV-048-01', '60 capsules', 360, 360, 0, 100, 0, 5, 0, TRUE, TRUE, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('pdfv_liver_reactivator_500ml', 'pdf_liver_reactivator', 'SV-049-01', '500 ml', 380, 380, 0, 100, 0, 5, 0, TRUE, TRUE, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('pdfv_liver_reactivator_200ml', 'pdf_liver_reactivator', 'SV-049-02', '200 ml', 160, 160, 0, 100, 0, 5, 0, FALSE, TRUE, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('pdfv_memory_booster_1l', 'pdf_memory_booster', 'SV-050-01', '1 L', 580, 580, 0, 100, 0, 5, 0, TRUE, TRUE, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('pdfv_memory_booster_200ml', 'pdf_memory_booster', 'SV-050-02', '200 ml', 160, 160, 0, 100, 0, 5, 0, FALSE, TRUE, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('pdfv_miracle_roots_500ml', 'pdf_miracle_roots', 'SV-051-01', '500 ml', 580, 580, 0, 100, 0, 5, 0, TRUE, TRUE, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('pdfv_musheal_capsule_60capsules', 'pdf_musheal_capsule', 'SV-052-01', '60 capsules', 630, 630, 0, 100, 0, 5, 0, TRUE, TRUE, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('pdfv_migraine_care_200ml', 'pdf_migraine_care', 'SV-053-01', '200 ml', 190, 190, 0, 100, 0, 5, 0, TRUE, TRUE, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('pdfv_migraine_care_500ml', 'pdf_migraine_care', 'SV-053-02', '500 ml', 460, 460, 0, 100, 0, 5, 0, FALSE, TRUE, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('pdfv_migraine_care_1l', 'pdf_migraine_care', 'SV-053-03', '1 L', 920, 920, 0, 100, 0, 5, 0, FALSE, TRUE, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('pdfv_neem_oil_100ml', 'pdf_neem_oil', 'SV-054-01', '100 ml', 180, 180, 0, 100, 0, 5, 0, TRUE, TRUE, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('pdfv_neuro_care_500ml', 'pdf_neuro_care', 'SV-055-01', '500 ml', 450, 450, 0, 100, 0, 5, 0, TRUE, TRUE, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('pdfv_noni_500ml', 'pdf_noni', 'SV-056-01', '500 ml', 390, 390, 0, 100, 0, 5, 0, TRUE, TRUE, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('pdfv_noni_1l', 'pdf_noni', 'SV-056-02', '1 L', 690, 690, 0, 100, 0, 5, 0, FALSE, TRUE, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('pdfv_neem_capsule_60capsules', 'pdf_neem_capsule', 'SV-057-01', '60 capsules', 450, 450, 0, 100, 0, 5, 0, TRUE, TRUE, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('pdfv_pc_9_piles_care_1l', 'pdf_pc_9_piles_care', 'SV-058-01', '1 L', 960, 960, 0, 100, 0, 5, 0, TRUE, TRUE, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('pdfv_pc_9_piles_care_200ml', 'pdf_pc_9_piles_care', 'SV-058-02', '200 ml', 190, 190, 0, 100, 0, 5, 0, FALSE, TRUE, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('pdfv_punarnava_capsule_60capsules', 'pdf_punarnava_capsule', 'SV-059-01', '60 capsules', 980, 980, 0, 100, 0, 5, 0, TRUE, TRUE, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('pdfv_purush_rasayan_1l', 'pdf_purush_rasayan', 'SV-060-01', '1 L', 1350, 1350, 0, 100, 0, 5, 0, TRUE, TRUE, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('pdfv_panch_tulsi_30ml', 'pdf_panch_tulsi', 'SV-061-01', '30 ml', 120, 120, 0, 100, 0, 5, 0, TRUE, TRUE, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('pdfv_power_tulsi_25ml', 'pdf_power_tulsi', 'SV-062-01', '25 ml', 180, 180, 0, 100, 0, 5, 0, TRUE, TRUE, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('pdfv_pr_drops_25ml', 'pdf_pr_drops', 'SV-063-01', '25 ml', 190, 190, 0, 100, 0, 5, 0, TRUE, TRUE, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('pdfv_renal_fit_capsule_60capsules', 'pdf_renal_fit_capsule', 'SV-064-01', '60 capsules', 540, 540, 0, 100, 0, 5, 0, TRUE, TRUE, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('pdfv_resurrection_capsule_60capsules', 'pdf_resurrection_capsule', 'SV-065-01', '60 capsules', 1890, 1890, 0, 100, 0, 5, 0, TRUE, TRUE, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('pdfv_saunf_ark_30ml', 'pdf_saunf_ark', 'SV-066-01', '30 ml', 160, 160, 0, 100, 0, 5, 0, TRUE, TRUE, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('pdfv_skin_ark_500ml', 'pdf_skin_ark', 'SV-067-01', '500 ml', 580, 580, 0, 100, 0, 5, 0, TRUE, TRUE, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('pdfv_skin_oil_100ml', 'pdf_skin_oil', 'SV-068-01', '100 ml', 480, 480, 0, 100, 0, 5, 0, TRUE, TRUE, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('pdfv_stone_away_200ml', 'pdf_stone_away', 'SV-069-01', '200 ml', 160, 160, 0, 100, 0, 5, 0, TRUE, TRUE, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('pdfv_stri_sanjivani_1l', 'pdf_stri_sanjivani', 'SV-070-01', '1 L', 480, 480, 0, 100, 0, 5, 0, TRUE, TRUE, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('pdfv_stri_sanjivani_200ml', 'pdf_stri_sanjivani', 'SV-070-02', '200 ml', 160, 160, 0, 100, 0, 5, 0, FALSE, TRUE, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('pdfv_sarva_dhatu_pushti_400g', 'pdf_sarva_dhatu_pushti', 'SV-071-01', '400 g', 1170, 1170, 0, 100, 0, 5, 0, TRUE, TRUE, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('pdfv_sea_buckthorn_capsule_60capsules', 'pdf_sea_buckthorn_capsule', 'SV-072-01', '60 capsules', 760, 760, 0, 100, 0, 5, 0, TRUE, TRUE, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('pdfv_shatawari_capsule_60capsules', 'pdf_shatawari_capsule', 'SV-073-01', '60 capsules', 715, 715, 0, 100, 0, 5, 0, TRUE, TRUE, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('pdfv_silymarine_milk_thistle_capsule_60capsules', 'pdf_silymarine_milk_thistle_capsule', 'SV-074-01', '60 capsules', 720, 720, 0, 100, 0, 5, 0, TRUE, TRUE, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('pdfv_spirulina_capsule_60capsules', 'pdf_spirulina_capsule', 'SV-075-01', '60 capsules', 715, 715, 0, 100, 0, 5, 0, TRUE, TRUE, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('pdfv_stevia_drop_25ml', 'pdf_stevia_drop', 'SV-076-01', '25 ml', 180, 180, 0, 100, 0, 5, 0, TRUE, TRUE, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('pdfv_sugar_normal_500ml', 'pdf_sugar_normal', 'SV-077-01', '500 ml', 585, 585, 0, 100, 0, 5, 0, TRUE, TRUE, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('pdfv_thyro_booster_500ml', 'pdf_thyro_booster', 'SV-078-01', '500 ml', 480, 480, 0, 100, 0, 5, 0, TRUE, TRUE, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('pdfv_triphala_ras_500ml', 'pdf_triphala_ras', 'SV-079-01', '500 ml', 270, 270, 0, 100, 0, 5, 0, TRUE, TRUE, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('pdfv_19_berries_500ml', 'pdf_19_berries', 'SV-080-01', '500 ml', 1170, 1170, 0, 100, 0, 5, 0, TRUE, TRUE, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('pdfv_triphala_ashtamrit_500ml', 'pdf_triphala_ashtamrit', 'SV-081-01', '500 ml', 380, 380, 0, 100, 0, 5, 0, TRUE, TRUE, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('pdfv_wheat_grass_with_moringa_1l', 'pdf_wheat_grass_with_moringa', 'SV-082-01', '1 L', 585, 585, 0, 100, 0, 5, 0, TRUE, TRUE, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('pdfv_wheat_grass_500ml', 'pdf_wheat_grass', 'SV-083-01', '500 ml', 280, 280, 0, 100, 0, 5, 0, TRUE, TRUE, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('pdfv_wheat_grass_1l', 'pdf_wheat_grass', 'SV-083-02', '1 L', 580, 580, 0, 100, 0, 5, 0, FALSE, TRUE, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('pdfv_wonder_berries_500ml', 'pdf_wonder_berries', 'SV-084-01', '500 ml', 970, 970, 0, 100, 0, 5, 0, TRUE, TRUE, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);


-- Opening-stock ledger for the 100-unit brochure balance above. The shared
-- reference also prevents the existing-database opening-stock migration from
-- applying a second time to a database created from this fresh setup.
INSERT INTO "InventoryLedger" ("id", "variantId", "changeQty", "resultingQty", "reason", "referenceId", "notes", "createdAt")
SELECT
  'inv_' || "id" || '_opening_100',
  "id",
  100,
  100,
  'STOCK_AUDIT_ADJUSTMENT'::"InventoryChangeReason",
  'OPENING_STOCK_100_20261024',
  'Owner-approved opening stock: 100 units per brochure pack variant (2026-10-24). Quantity supplied by owner; PDF contains pack and MRP data only.',
  CURRENT_TIMESTAMP
FROM "ProductVariant"
WHERE "id" LIKE 'pdfv_%';

INSERT INTO "ProductImage" ("id", "productId", "imageUrl", "altText", "sortOrder", "isPrimary", "createdAt") VALUES
  ('pdfimg_aloe_vera_with_honey_amla_tulsi', 'pdf_aloe_vera_with_honey_amla_tulsi', '/products/pdf-p4-i9.webp', 'Aloe Vera with Honey, Amla & Tulsi - Shlokveda', 0, TRUE, CURRENT_TIMESTAMP),
  ('pdfimg_aloe_vera_juice', 'pdf_aloe_vera_juice', '/products/pdf-p4-i5.webp', 'Aloe Vera Juice - Shlokveda', 0, TRUE, CURRENT_TIMESTAMP),
  ('pdfimg_amrit_ras', 'pdf_amrit_ras', '/products/pdf-p6-i5.webp', 'Amrit Ras - Shlokveda', 0, TRUE, CURRENT_TIMESTAMP),
  ('pdfimg_anti_diabetes', 'pdf_anti_diabetes', '/products/pdf-p7-i4.webp', 'Anti Diabetes - Shlokveda', 0, TRUE, CURRENT_TIMESTAMP),
  ('pdfimg_arjun_capsule', 'pdf_arjun_capsule', '/products/arjun-capsule-pack.webp', 'Arjun Capsule - Shlokveda', 0, TRUE, CURRENT_TIMESTAMP),
  ('pdfimg_a2_desi_ghee', 'pdf_a2_desi_ghee', '/products/pdf-p15-i1.webp', 'A2 Desi Ghee - Shlokveda', 0, TRUE, CURRENT_TIMESTAMP),
  ('pdfimg_allicin_capsule', 'pdf_allicin_capsule', '/products/allicin-capsule-pack.webp', 'Allicin Capsule - Shlokveda', 0, TRUE, CURRENT_TIMESTAMP),
  ('pdfimg_amla_ras', 'pdf_amla_ras', '/products/pdf-p5-i2.webp', 'Amla Ras - Shlokveda', 0, TRUE, CURRENT_TIMESTAMP),
  ('pdfimg_ashwagandha_capsule', 'pdf_ashwagandha_capsule', '/products/ashwagandha-capsule-pack.webp', 'Ashwagandha Capsule - Shlokveda', 0, TRUE, CURRENT_TIMESTAMP),
  ('pdfimg_ajwain_ark', 'pdf_ajwain_ark', '/products/pdf-p3-i8.webp', 'Ajwain Ark - Shlokveda', 0, TRUE, CURRENT_TIMESTAMP),
  ('pdfimg_bhumi_punarnava', 'pdf_bhumi_punarnava', '/products/pdf-p5-i4.webp', 'Bhumi Punarnava - Shlokveda', 0, TRUE, CURRENT_TIMESTAMP),
  ('pdfimg_bhumi_amla_capsule', 'pdf_bhumi_amla_capsule', '/products/bhumi-amla-capsule-pack.webp', 'Bhumi Amla Capsule - Shlokveda', 0, TRUE, CURRENT_TIMESTAMP),
  ('pdfimg_cough_care', 'pdf_cough_care', '/products/pdf-p6-i10.webp', 'Cough Care - Shlokveda', 0, TRUE, CURRENT_TIMESTAMP),
  ('pdfimg_castor_oil', 'pdf_castor_oil', '/products/castor-oil-pack.webp', 'Castor Oil - Shlokveda', 0, TRUE, CURRENT_TIMESTAMP),
  ('pdfimg_chyawanprash_kesar_yukta', 'pdf_chyawanprash_kesar_yukta', '/products/pdf-p15-i3.webp', 'Chyawanprash Kesar Yukta - Shlokveda', 0, TRUE, CURRENT_TIMESTAMP),
  ('pdfimg_curcumin_capsule', 'pdf_curcumin_capsule', '/products/curcumin-capsule-pack.webp', 'Curcumin Capsule - Shlokveda', 0, TRUE, CURRENT_TIMESTAMP),
  ('pdfimg_cumin_ark', 'pdf_cumin_ark', '/products/pdf-p3-i1.webp', 'Cumin Ark - Shlokveda', 0, TRUE, CURRENT_TIMESTAMP),
  ('pdfimg_dento_strong', 'pdf_dento_strong', '/products/pdf-p15-i4.webp', 'Dento Strong - Shlokveda', 0, TRUE, CURRENT_TIMESTAMP),
  ('pdfimg_detox_capsule', 'pdf_detox_capsule', '/products/detox-capsule-pack.webp', 'Detox Capsule - Shlokveda', 0, TRUE, CURRENT_TIMESTAMP),
  ('pdfimg_detox_syrup', 'pdf_detox_syrup', '/products/detox-syrup-pack.webp', 'Detox Syrup - Shlokveda', 0, TRUE, CURRENT_TIMESTAMP),
  ('pdfimg_dhamasa_capsule', 'pdf_dhamasa_capsule', '/products/dhamasa-capsule-pack.webp', 'Dhamasa Capsule - Shlokveda', 0, TRUE, CURRENT_TIMESTAMP),
  ('pdfimg_eye_care', 'pdf_eye_care', '/products/eye-care-pack.webp', 'Eye Care - Shlokveda', 0, TRUE, CURRENT_TIMESTAMP),
  ('pdfimg_flax_seeds', 'pdf_flax_seeds', '/products/pdf-p15-i6.webp', 'Flax Seeds - Shlokveda', 0, TRUE, CURRENT_TIMESTAMP),
  ('pdfimg_flax_oil', 'pdf_flax_oil', '/products/flax-oil-pack.webp', 'Flax Oil - Shlokveda', 0, TRUE, CURRENT_TIMESTAMP),
  ('pdfimg_fat_melter', 'pdf_fat_melter', '/products/fat-melter-pack.webp', 'Fat Melter - Shlokveda', 0, TRUE, CURRENT_TIMESTAMP),
  ('pdfimg_gastro_sanjivani', 'pdf_gastro_sanjivani', '/products/pdf-p5-i6.webp', 'Gastro Sanjivani - Shlokveda', 0, TRUE, CURRENT_TIMESTAMP),
  ('pdfimg_grape_seed_extract', 'pdf_grape_seed_extract', '/products/grape-seed-extract-pack.webp', 'Grape Seed Extract - Shlokveda', 0, TRUE, CURRENT_TIMESTAMP),
  ('pdfimg_green_tea_tablet', 'pdf_green_tea_tablet', '/products/pdf-p15-i4.webp', 'Green Tea Tablet - Shlokveda', 0, TRUE, CURRENT_TIMESTAMP),
  ('pdfimg_gokhru_capsule', 'pdf_gokhru_capsule', '/products/gokhru-capsule-pack.webp', 'Gokhru Capsule - Shlokveda', 0, TRUE, CURRENT_TIMESTAMP),
  ('pdfimg_gymnema_capsule', 'pdf_gymnema_capsule', '/products/gymnema-capsule-pack.webp', 'Gymnema Capsule - Shlokveda', 0, TRUE, CURRENT_TIMESTAMP),
  ('pdfimg_gau_amrit', 'pdf_gau_amrit', '/products/gau-amrit-pack.webp', 'Gau Amrit - Shlokveda', 0, TRUE, CURRENT_TIMESTAMP),
  ('pdfimg_h_b_booster', 'pdf_h_b_booster', '/products/h-b-booster-pack.webp', 'H.B. Booster - Shlokveda', 0, TRUE, CURRENT_TIMESTAMP),
  ('pdfimg_heart_re_booster', 'pdf_heart_re_booster', '/products/pdf-p6-i6.webp', 'Heart Re Booster - Shlokveda', 0, TRUE, CURRENT_TIMESTAMP),
  ('pdfimg_heart_re_booster_premium', 'pdf_heart_re_booster_premium', '/products/pdf-p6-i6.webp', 'Heart Re Booster Premium - Shlokveda', 0, TRUE, CURRENT_TIMESTAMP),
  ('pdfimg_heart_fit', 'pdf_heart_fit', '/products/heart-fit-pack.webp', 'Heart Fit - Shlokveda', 0, TRUE, CURRENT_TIMESTAMP),
  ('pdfimg_ib_9_drop_immunity_drops', 'pdf_ib_9_drop_immunity_drops', '/products/pdf-p4-i7.webp', 'IB-9 Drop (Immunity Drops) - Shlokveda', 0, TRUE, CURRENT_TIMESTAMP),
  ('pdfimg_joint_re_builder_syrup', 'pdf_joint_re_builder_syrup', '/products/pdf-p6-i3.webp', 'Joint Re-Builder Syrup - Shlokveda', 0, TRUE, CURRENT_TIMESTAMP),
  ('pdfimg_joint_re_builder_tablet', 'pdf_joint_re_builder_tablet', '/products/pdf-p6-i2.webp', 'Joint Re-Builder Tablet - Shlokveda', 0, TRUE, CURRENT_TIMESTAMP),
  ('pdfimg_joint_re_builder_syrup_premium', 'pdf_joint_re_builder_syrup_premium', '/products/pdf-p6-i3.webp', 'Joint Re-Builder Syrup Premium - Shlokveda', 0, TRUE, CURRENT_TIMESTAMP),
  ('pdfimg_joint_tablet_premium', 'pdf_joint_tablet_premium', '/products/pdf-p6-i2.webp', 'Joint Tablet Premium - Shlokveda', 0, TRUE, CURRENT_TIMESTAMP),
  ('pdfimg_joint_pain_oil', 'pdf_joint_pain_oil', '/products/pdf-p6-i7.webp', 'Joint Pain Oil - Shlokveda', 0, TRUE, CURRENT_TIMESTAMP),
  ('pdfimg_joint_pain_liniment_oil', 'pdf_joint_pain_liniment_oil', '/products/pdf-p6-i7.webp', 'Joint Pain Liniment (Oil) - Shlokveda', 0, TRUE, CURRENT_TIMESTAMP),
  ('pdfimg_kalonji_oil', 'pdf_kalonji_oil', '/products/kalonji-oil-pack.webp', 'Kalonji Oil - Shlokveda', 0, TRUE, CURRENT_TIMESTAMP),
  ('pdfimg_kidney_reactivator', 'pdf_kidney_reactivator', '/products/kidney-reactivator-pack.webp', 'Kidney Reactivator - Shlokveda', 0, TRUE, CURRENT_TIMESTAMP),
  ('pdfimg_kwach_capsule', 'pdf_kwach_capsule', '/products/kwach-capsule-pack.webp', 'Kwach Capsule - Shlokveda', 0, TRUE, CURRENT_TIMESTAMP),
  ('pdfimg_lipid_care', 'pdf_lipid_care', '/products/pdf-p4-i10.webp', 'Lipid Care - Shlokveda', 0, TRUE, CURRENT_TIMESTAMP),
  ('pdfimg_lungs_cleaner', 'pdf_lungs_cleaner', '/products/lungs-cleaner-pack.webp', 'Lungs Cleaner - Shlokveda', 0, TRUE, CURRENT_TIMESTAMP),
  ('pdfimg_liv_ca_capsule', 'pdf_liv_ca_capsule', '/products/liv-ca-capsule-pack.webp', 'Liv CA Capsule - Shlokveda', 0, TRUE, CURRENT_TIMESTAMP),
  ('pdfimg_liver_reactivator', 'pdf_liver_reactivator', '/products/pdf-p5-i1.webp', 'Liver Reactivator - Shlokveda', 0, TRUE, CURRENT_TIMESTAMP),
  ('pdfimg_memory_booster', 'pdf_memory_booster', '/products/pdf-p7-i3.webp', 'Memory Booster - Shlokveda', 0, TRUE, CURRENT_TIMESTAMP),
  ('pdfimg_miracle_roots', 'pdf_miracle_roots', '/products/pdf-p7-i1.webp', 'Miracle Roots - Shlokveda', 0, TRUE, CURRENT_TIMESTAMP),
  ('pdfimg_musheal_capsule', 'pdf_musheal_capsule', '/products/pdf-p14-i6.webp', 'Musheal Capsule - Shlokveda', 0, TRUE, CURRENT_TIMESTAMP),
  ('pdfimg_migraine_care', 'pdf_migraine_care', '/products/migraine-care-pack.webp', 'Migraine Care - Shlokveda', 0, TRUE, CURRENT_TIMESTAMP),
  ('pdfimg_neem_oil', 'pdf_neem_oil', '/products/neem-oil-pack.webp', 'Neem Oil - Shlokveda', 0, TRUE, CURRENT_TIMESTAMP),
  ('pdfimg_neuro_care', 'pdf_neuro_care', '/products/neuro-care-pack.webp', 'Neuro Care - Shlokveda', 0, TRUE, CURRENT_TIMESTAMP),
  ('pdfimg_noni', 'pdf_noni', '/products/noni-pack.webp', 'Noni - Shlokveda', 0, TRUE, CURRENT_TIMESTAMP),
  ('pdfimg_neem_capsule', 'pdf_neem_capsule', '/products/neem-capsule-pack.webp', 'Neem Capsule - Shlokveda', 0, TRUE, CURRENT_TIMESTAMP),
  ('pdfimg_pc_9_piles_care', 'pdf_pc_9_piles_care', '/products/pc-9-piles-care-pack.webp', 'PC-9 (Piles Care) - Shlokveda', 0, TRUE, CURRENT_TIMESTAMP),
  ('pdfimg_punarnava_capsule', 'pdf_punarnava_capsule', '/products/punarnava-capsule-pack.webp', 'Punarnava Capsule - Shlokveda', 0, TRUE, CURRENT_TIMESTAMP),
  ('pdfimg_purush_rasayan', 'pdf_purush_rasayan', '/products/purush-rasayan-pack.webp', 'Purush Rasayan - Shlokveda', 0, TRUE, CURRENT_TIMESTAMP),
  ('pdfimg_panch_tulsi', 'pdf_panch_tulsi', '/products/pdf-p3-i3.webp', 'Panch Tulsi - Shlokveda', 0, TRUE, CURRENT_TIMESTAMP),
  ('pdfimg_power_tulsi', 'pdf_power_tulsi', '/products/pdf-p3-i7.webp', 'Power Tulsi - Shlokveda', 0, TRUE, CURRENT_TIMESTAMP),
  ('pdfimg_pr_drops', 'pdf_pr_drops', '/products/pdf-p3-i4.webp', 'PR Drops - Shlokveda', 0, TRUE, CURRENT_TIMESTAMP),
  ('pdfimg_renal_fit_capsule', 'pdf_renal_fit_capsule', '/products/pdf-p11-i6.webp', 'Renal Fit Capsule - Shlokveda', 0, TRUE, CURRENT_TIMESTAMP),
  ('pdfimg_resurrection_capsule', 'pdf_resurrection_capsule', '/products/resurrection-capsule-pack.webp', 'Resurrection Capsule - Shlokveda', 0, TRUE, CURRENT_TIMESTAMP),
  ('pdfimg_saunf_ark', 'pdf_saunf_ark', '/products/pdf-p3-i2.webp', 'Saunf Ark - Shlokveda', 0, TRUE, CURRENT_TIMESTAMP),
  ('pdfimg_skin_ark', 'pdf_skin_ark', '/products/pdf-p4-i6.webp', 'Skin Ark - Shlokveda', 0, TRUE, CURRENT_TIMESTAMP),
  ('pdfimg_skin_oil', 'pdf_skin_oil', '/products/pdf-p4-i6.webp', 'Skin Oil - Shlokveda', 0, TRUE, CURRENT_TIMESTAMP),
  ('pdfimg_stone_away', 'pdf_stone_away', '/products/pdf-p6-i4.webp', 'Stone Away - Shlokveda', 0, TRUE, CURRENT_TIMESTAMP),
  ('pdfimg_stri_sanjivani', 'pdf_stri_sanjivani', '/products/pdf-p7-i5.webp', 'Stri Sanjivani - Shlokveda', 0, TRUE, CURRENT_TIMESTAMP),
  ('pdfimg_sarva_dhatu_pushti', 'pdf_sarva_dhatu_pushti', '/products/pdf-p15-i1.webp', 'Sarva Dhatu Pushti - Shlokveda', 0, TRUE, CURRENT_TIMESTAMP),
  ('pdfimg_sea_buckthorn_capsule', 'pdf_sea_buckthorn_capsule', '/products/sea-buckthorn-capsule-pack.webp', 'Sea Buckthorn Capsule - Shlokveda', 0, TRUE, CURRENT_TIMESTAMP),
  ('pdfimg_shatawari_capsule', 'pdf_shatawari_capsule', '/products/shatawari-capsule-pack.webp', 'Shatawari Capsule - Shlokveda', 0, TRUE, CURRENT_TIMESTAMP),
  ('pdfimg_silymarine_milk_thistle_capsule', 'pdf_silymarine_milk_thistle_capsule', '/products/silymarine-milk-thistle-capsule-pack.webp', 'Silymarine Milk Thistle Capsule - Shlokveda', 0, TRUE, CURRENT_TIMESTAMP),
  ('pdfimg_spirulina_capsule', 'pdf_spirulina_capsule', '/products/spirulina-capsule-pack.webp', 'Spirulina Capsule - Shlokveda', 0, TRUE, CURRENT_TIMESTAMP),
  ('pdfimg_stevia_drop', 'pdf_stevia_drop', '/products/pdf-p3-i5.webp', 'Stevia Drop - Shlokveda', 0, TRUE, CURRENT_TIMESTAMP),
  ('pdfimg_sugar_normal', 'pdf_sugar_normal', '/products/pdf-p7-i2.webp', 'Sugar Normal - Shlokveda', 0, TRUE, CURRENT_TIMESTAMP),
  ('pdfimg_thyro_booster', 'pdf_thyro_booster', '/products/pdf-p7-i6.webp', 'Thyro Booster - Shlokveda', 0, TRUE, CURRENT_TIMESTAMP),
  ('pdfimg_triphala_ras', 'pdf_triphala_ras', '/products/pdf-p5-i3.webp', 'Triphala Ras - Shlokveda', 0, TRUE, CURRENT_TIMESTAMP),
  ('pdfimg_19_berries', 'pdf_19_berries', '/products/19-berries-pack.webp', '19 Berries - Shlokveda', 0, TRUE, CURRENT_TIMESTAMP),
  ('pdfimg_triphala_ashtamrit', 'pdf_triphala_ashtamrit', '/products/pdf-p5-i5.webp', 'Triphala Ashtamrit - Shlokveda', 0, TRUE, CURRENT_TIMESTAMP),
  ('pdfimg_wheat_grass_with_moringa', 'pdf_wheat_grass_with_moringa', '/products/wheat-grass-with-moringa-pack.webp', 'Wheat Grass with Moringa - Shlokveda', 0, TRUE, CURRENT_TIMESTAMP),
  ('pdfimg_wheat_grass', 'pdf_wheat_grass', '/products/wheat-grass-pack.webp', 'Wheat Grass - Shlokveda', 0, TRUE, CURRENT_TIMESTAMP),
  ('pdfimg_wonder_berries', 'pdf_wonder_berries', '/products/wonder-berries-pack.webp', 'Wonder Berries - Shlokveda', 0, TRUE, CURRENT_TIMESTAMP);

-- Homepage hero banners (editable afterwards in Admin -> CMS -> Banners).
INSERT INTO "Banner" ("id", "title", "subtitle", "imageUrl", "mobileImgUrl", "linkUrl", "buttonText", "secondaryCtaText", "secondaryCtaLink", "sortOrder", "isActive", "createdAt", "updatedAt") VALUES
  ('ban_hero_personal_care', 'Natural Personal Care for a Healthier You', 'Explore authentic Ayurvedic products crafted with traditional herbs for your everyday wellness routine.', '/banners/hero-personal-care.webp', NULL, '/category/personal-care', 'Shop Personal Care', 'Explore Categories', '/#categories', 1, TRUE, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('ban_hero_daily_wellness', 'Everyday Wellness, Rooted in Ayurveda', 'Discover traditional Ayurvedic formulations for your daily wellness routine.', '/banners/hero-wellness.webp', NULL, '/category/immunity-rasayana', 'Explore Wellness', 'Shop Bestsellers', '/shop', 2, TRUE, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('ban_hero_herbal_oils', 'Ancient Wisdom. Everyday Care.', 'Explore traditional herbal oils and Ayurvedic preparations for your daily care rituals.', '/banners/hero-herbal-oils.webp', NULL, '/category/herbal-oils', 'Shop Herbal Oils', 'Discover More', '/about', 3, TRUE, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('ban_hero_catalogue', 'Bring the Goodness of Ayurveda Home', 'Find Ayurvedic essentials for your family''s everyday wellness needs.', '/banners/hero-essentials.webp', NULL, '/shop', 'Shop All Products', 'Browse Categories', '/#categories', 4, TRUE, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
ON CONFLICT ("id") DO NOTHING;

-- Razorpay webhook idempotency log (required by /api/webhooks/razorpay —
-- previously only created by prisma/migrations/20261014_add_razorpay_webhook_events.sql,
-- so a setup following this file alone failed every webhook with a 500).
CREATE TABLE IF NOT EXISTS "RazorpayWebhookEvent" (
  "id" TEXT PRIMARY KEY,
  "event" TEXT NOT NULL,
  "status" TEXT NOT NULL DEFAULT 'PROCESSING',
  "receivedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "processedAt" TIMESTAMP(3),
  "error" TEXT
);
CREATE INDEX IF NOT EXISTS "RazorpayWebhookEvent_event_idx" ON "RazorpayWebhookEvent" ("event");
CREATE INDEX IF NOT EXISTS "RazorpayWebhookEvent_status_idx" ON "RazorpayWebhookEvent" ("status");

-- Newsletter subscribers (footer "Stay Updated" form, POST /api/newsletter)
CREATE TABLE IF NOT EXISTS "NewsletterSubscriber" (
  "id" TEXT PRIMARY KEY,
  "email" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE UNIQUE INDEX IF NOT EXISTS "NewsletterSubscriber_email_key" ON "NewsletterSubscriber" ("email");

-- Admin-uploaded images stored in Neon (POST /api/admin/uploads writes
-- JPG/PNG/WEBP bytes here; GET /api/uploads/<id> serves them back).
-- Identical to prisma/migrations/20261024_add_uploaded_files.sql.
CREATE TABLE IF NOT EXISTS "UploadedFile" (
  "id" TEXT PRIMARY KEY,
  "filename" TEXT NOT NULL,
  "contentType" TEXT NOT NULL,
  "size" INTEGER NOT NULL,
  "data" BYTEA NOT NULL,
  "uploadedById" TEXT REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS "UploadedFile_createdAt_idx" ON "UploadedFile" ("createdAt");

-- Policy static pages: all six store policy pages + the product
-- information notice, with structured icon sections (editable in
-- Admin -> CMS; auto-listed in the footer Trust & Policies column).
-- Identical to prisma/migrations/20261023_add_static_page_sections.sql.
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

COMMIT;
