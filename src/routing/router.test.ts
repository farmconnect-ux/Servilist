import { describe, it, expect } from 'vitest';
import { AppRouter } from './router';

describe('AppRouter & WhatsApp Sharing', () => {
  it('parses listing ID from search query correctly', () => {
    const route = AppRouter.parseRoute('?listing=lst-prado-v6');
    expect(route.type).toBe('listing');
    expect(route.id).toBe('lst-prado-v6');
  });

  it('parses request ID from search query correctly', () => {
    const route = AppRouter.parseRoute('?request=req-solar-inverter');
    expect(route.type).toBe('request');
    expect(route.id).toBe('req-solar-inverter');
  });

  it('returns null type when no item query parameter is present', () => {
    const route = AppRouter.parseRoute('');
    expect(route.type).toBeNull();
    expect(route.id).toBeNull();

    const otherRoute = AppRouter.parseRoute('?category=electronics&city=Lagos');
    expect(otherRoute.type).toBeNull();
    expect(otherRoute.id).toBeNull();
  });

  it('constructs correct direct URLs', () => {
    const url = AppRouter.buildDirectUrl('item-123', 'listing', 'https://servilist.africa');
    expect(url).toBe('https://servilist.africa/?listing=item-123');
  });

  it('generates valid WhatsApp click-to-chat URL with encoded text and link', () => {
    const waUrl = AppRouter.generateWhatsAppShareUrl({
      title: '5kVA Hybrid Solar Inverter',
      priceFormatted: '₦850,000',
      city: 'Lagos, Nigeria',
      itemId: 'inv-500',
      type: 'listing',
      origin: 'https://servilist.africa',
    });

    expect(waUrl).toContain('https://wa.me/?text=');
    expect(waUrl).toContain(encodeURIComponent('5kVA Hybrid Solar Inverter'));
    expect(waUrl).toContain(encodeURIComponent('https://servilist.africa/?listing=inv-500'));
  });
});
