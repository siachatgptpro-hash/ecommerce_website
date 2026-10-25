import fs from 'node:fs';
import { BROCHURE_CATEGORIES, BROCHURE_PRODUCTS, PDF_CATALOG_ENTRY_COUNT } from './src/lib/brochure-data';
import { ProductRepository } from './src/repositories/product.repository';
import { CheckoutInitiateSchema } from './src/schemas';
import { PaymentGateway } from './src/types';

const checks: Array<{ label: string; ok: boolean }> = [];
const record = (label: string, ok: boolean) => checks.push({ label, ok });

async function runPreviewQA() {
  console.log('\nShlokveda storefront preview QA');

  record('95 brochure price-list entries, 84 products and 101 pack variants', PDF_CATALOG_ENTRY_COUNT === 95 && BROCHURE_PRODUCTS.length === 84 && BROCHURE_PRODUCTS.reduce((sum, product) => sum + product.variants.length, 0) === 101);
  record('brochure product image references resolve to local assets', BROCHURE_PRODUCTS.every((product) => product.images.length > 0 && product.images.every((image) => fs.existsSync(`public${image.url}`))));
  record('brochure category IDs are valid and populated', BROCHURE_CATEGORIES.length === 8 && BROCHURE_CATEGORIES.every((category) => BROCHURE_PRODUCTS.some((product) => product.categoryId === category.id)));

  const all = await ProductRepository.listProducts({ limit: 200 });
  record('catalogue repository returns the complete 84-product set', all.total === 84 && all.products.length === 84);
  const syrups = await ProductRepository.listProducts({ categorySlug: 'syrups-juices', limit: 200 });
  record('category filtering resolves brochure syrup listings', syrups.total > 0 && syrups.products.every((product) => product.category?.slug === 'syrups-juices'));
  const search = await ProductRepository.listProducts({ search: 'Triphala Ras', limit: 10 });
  record('catalogue search resolves source product names', search.products.some((product) => product.slug === 'triphala-ras'));
  record('every source product has a listed MRP and pack-size option', BROCHURE_PRODUCTS.every((product) => product.variants.length > 0 && product.variants.every((variant) => variant.mrp > 0 && variant.sellingPrice === variant.mrp)));

  const neonSetup = fs.readFileSync('prisma/neon-setup.sql', 'utf8');
  const neonVariantRows = neonSetup.split('\n').filter((line) => line.includes("('pdfv_"));
  record('fresh Neon setup seeds all 101 brochure variants at 100 units', neonVariantRows.length === 101 && neonVariantRows.every((line) => line.includes(', 0, 100, 0, 5, 0,')));
  record('fresh Neon setup writes matching opening-stock ledger rows', neonSetup.includes('INSERT INTO "InventoryLedger"') && neonSetup.includes("'inv_' || \"id\" || '_opening_100'") && neonSetup.includes("'OPENING_STOCK_100_20261024'"));

  const stockMigration = fs.readFileSync('prisma/migrations/20261024_fill_brochure_opening_stock_100.sql', 'utf8');
  const stockFillScript = fs.readFileSync('scripts/fill-brochure-stock.ts', 'utf8');
  record('existing-database stock fill is brochure-only, guarded and rerun-safe', stockMigration.includes("starts_with(v.\"id\", 'pdfv_')") && stockMigration.includes('"reservedQuantity" > 100') && stockMigration.includes("'OPENING_STOCK_100_20261024'") && stockMigration.includes("'STOCK_AUDIT_ADJUSTMENT'::\"InventoryChangeReason\"") && stockMigration.includes('ON CONFLICT ("id") DO NOTHING') && stockFillScript.includes('CONFIRM_FILL_BROCHURE_STOCK_100') && stockFillScript.includes('20261024_fill_brochure_opening_stock_100.sql'));

  const product = BROCHURE_PRODUCTS[0];
  const checkout = CheckoutInitiateSchema.safeParse({
    items: [{ variantId: product.variants[0].id, quantity: 1 }],
    customerName: 'Preview Customer',
    customerEmail: 'preview@example.test',
    customerPhone: '9812345678',
    shippingAddress: {
      fullName: 'Preview Customer',
      phone: '9812345678',
      addressLine1: '42 Example Street',
      city: 'Pune',
      state: 'Maharashtra',
      pincode: '421301',
    },
    paymentGateway: PaymentGateway.RAZORPAY,
  });
  record('validated checkout schema accepts an online-payment Indian address', checkout.success && checkout.data.paymentGateway === PaymentGateway.RAZORPAY);

  const ordersRoute = fs.readFileSync('src/app/api/orders/route.ts', 'utf8');
  const checkoutPage = fs.readFileSync('src/app/checkout/page.tsx', 'utf8');
  const productCard = fs.readFileSync('src/components/storefront/ProductCard.tsx', 'utf8');
  const mobileNav = fs.readFileSync('src/components/shared/MobileNav.tsx', 'utf8');
  const wishlistPage = fs.readFileSync('src/app/wishlist/page.tsx', 'utf8');
  const wishlistClient = fs.readFileSync('src/app/wishlist/WishlistClient.tsx', 'utf8');
  const header = fs.readFileSync('src/components/shared/Header.tsx', 'utf8');
  const styles = fs.readFileSync('src/app/global.css', 'utf8');
  record('orders endpoint exposes a POST handler for checkout', /export async function POST/.test(ordersRoute));
  record('checkout sends contact data and uses Razorpay online payment', /customerEmail: email\.trim\(\)/.test(checkoutPage) && /paymentMethod = 'RAZORPAY'/.test(checkoutPage));
  record('product cards show an explicit empty-review state', /No reviews yet/.test(productCard));
  record('mobile navigation is fixed and respects safe-area insets', /fixed bottom-0/.test(mobileNav) && /safe-area-bottom/.test(mobileNav) && /env\(safe-area-inset-bottom\)/.test(styles));
  record('mobile page content has bottom clearance for fixed navigation', /pb-20 md:pb-0/.test(fs.readFileSync('src/components/shared/Providers.tsx', 'utf8')));
  record('wishlist is reachable on desktop and mobile and displays saved brochure products', /href="\/wishlist"/.test(header) && /href="\/wishlist"/.test(mobileNav) && /wishlist\.includes\(product\.id\)/.test(wishlistClient) && /WishlistClient/.test(wishlistPage));

  // Regression guards for "admin changes never reach the storefront":
  // the drawer categories API must stay dynamic (never prerendered),
  // admin mutations must purge ISR-cached pages, and the Header must
  // revalidate categories whenever the drawer opens.
  const categoriesApi = fs.readFileSync('src/app/api/catalog/categories/route.ts', 'utf8');
  record('drawer categories API is force-dynamic and no-store', /export const dynamic = 'force-dynamic'/.test(categoriesApi) && /'Cache-Control': 'no-store'/.test(categoriesApi));
  record('header refreshes categories when the drawer opens', /refreshCatalogueCategories\(\)/.test(header));
  const mutationRoutes = [
    'src/app/api/admin/cms/banners/route.ts',
    'src/app/api/admin/cms/banners/[id]/route.ts',
    'src/app/api/admin/categories/route.ts',
    'src/app/api/admin/categories/[id]/route.ts',
    'src/app/api/admin/products/route.ts',
    'src/app/api/admin/products/[id]/route.ts',
    'src/app/api/admin/blog/route.ts',
    'src/app/api/admin/blog/[id]/route.ts',
    'src/app/api/admin/settings/route.ts',
  ];
  record('admin banner/category/product/blog/settings saves purge ISR pages', mutationRoutes.every((file) => /revalidatePath\(/.test(fs.readFileSync(file, 'utf8'))));

  // Regression guards for the admin orders desk on phones: the status
  // filter pills must wrap (not overflow) and the table must scroll
  // sideways at a readable minimum width instead of crushing columns.
  const adminOrdersPage = fs.readFileSync('src/app/admin/orders/page.tsx', 'utf8');
  record('admin orders status filters wrap on mobile', /flex flex-wrap gap-2/.test(adminOrdersPage) && /whitespace-nowrap/.test(adminOrdersPage));
  const adminTablePages = [
    'src/app/admin/orders/page.tsx',
    'src/app/admin/page.tsx',
    'src/app/admin/products/page.tsx',
    'src/app/admin/inventory/page.tsx',
    'src/app/admin/customers/page.tsx',
    'src/app/admin/coupons/page.tsx',
    'src/app/admin/blog/page.tsx',
    'src/app/admin/categories/page.tsx',
    'src/app/admin/audit-logs/page.tsx',
  ];
  record('admin tables keep a readable minimum width on mobile', adminTablePages.every((file) => /<table className="w-full min-w-\[\d+px\]/.test(fs.readFileSync(file, 'utf8'))));

  for (const check of checks) console.log(`  ${check.ok ? '[PASS]' : '[FAIL]'} ${check.label}`);
  const failed = checks.filter((check) => !check.ok).length;
  console.log(`\nPreview QA: ${checks.length - failed} passed, ${failed} failed.`);
  if (failed) process.exitCode = 1;
}

runPreviewQA().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
