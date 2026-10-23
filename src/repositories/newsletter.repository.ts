// ==============================================================================
// NEWSLETTER REPOSITORY — SHLOKVEDA
// Captures footer "Stay Updated" subscriptions. Emails are stored only so the
// store can send updates later; there is intentionally no public read API.
// ==============================================================================

import { db } from '@/lib/db';
import { isPostgresConfigured, pgQuery } from '@/lib/postgres';
import crypto from 'node:crypto';
import { NewsletterSubscriber } from '@/types';

const iso = (date: Date | string) => new Date(date).toISOString();
function mapDbSubscriber(r: any): NewsletterSubscriber {
  return { id: r.id, email: r.email, createdAt: iso(r.createdAt) };
}

export class NewsletterRepository {
  public static async findByEmail(email: string): Promise<NewsletterSubscriber | null> {
    const clean = email.trim().toLowerCase();
    if (isPostgresConfigured()) {
      const result = await pgQuery(
        'SELECT * FROM "NewsletterSubscriber" WHERE "email"=$1 LIMIT 1',
        [clean],
      );
      return result.rows[0] ? mapDbSubscriber(result.rows[0]) : null;
    }
    for (const subscriber of db.newsletterSubscribers.values()) {
      if (subscriber.email === clean) return { ...subscriber };
    }
    return null;
  }

  /**
   * Subscribes an email address. Returns created=false (with the existing
   * record) when the address was already subscribed, so repeat submissions
   * are a friendly no-op instead of an error.
   */
  public static async subscribe(
    email: string,
  ): Promise<{ subscriber: NewsletterSubscriber; created: boolean }> {
    const clean = email.trim().toLowerCase();
    const existing = await NewsletterRepository.findByEmail(clean);
    if (existing) return { subscriber: existing, created: false };

    const subscriber: NewsletterSubscriber = {
      id: `nws_${crypto.randomUUID().replace(/-/g, '').slice(0, 20)}`,
      email: clean,
      createdAt: new Date().toISOString(),
    };

    if (isPostgresConfigured()) {
      const result = await pgQuery(
        'INSERT INTO "NewsletterSubscriber" ("id","email","createdAt") VALUES ($1,$2,$3) ON CONFLICT ("email") DO NOTHING RETURNING *',
        [subscriber.id, subscriber.email, subscriber.createdAt],
      );
      if (!result.rows[0]) {
        // Lost a concurrent-subscribe race on the unique email index.
        const winner = await NewsletterRepository.findByEmail(clean);
        if (winner) return { subscriber: winner, created: false };
        return { subscriber, created: true };
      }
      return { subscriber: mapDbSubscriber(result.rows[0]), created: true };
    }

    db.newsletterSubscribers.set(subscriber.id, subscriber);
    return { subscriber, created: true };
  }
}
