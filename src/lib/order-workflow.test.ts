import { describe, expect, it } from 'vitest';
import { getOrderDispatchBlocker } from './order-workflow';

describe('getOrderDispatchBlocker', () => {
  it('requires WhatsApp receipt confirmation first', () => {
    expect(getOrderDispatchBlocker({})).toBe('whatsapp');
  });

  it('requires preparation after WhatsApp receipt is confirmed', () => {
    expect(getOrderDispatchBlocker({
      whatsapp_confirmed_at: '2026-10-23T10:00:00.000Z',
    })).toBe('preparation');
  });

  it('requires a confirmed shipping label after preparation', () => {
    expect(getOrderDispatchBlocker({
      whatsapp_confirmed_at: '2026-10-23T10:00:00.000Z',
      prepared_at: '2026-10-23T10:30:00.000Z',
    })).toBe('label');
  });

  it('allows dispatch when every prerequisite is confirmed', () => {
    expect(getOrderDispatchBlocker({
      whatsapp_confirmed_at: '2026-10-23T10:00:00.000Z',
      prepared_at: '2026-10-23T10:30:00.000Z',
      printed_at: '2026-10-23T11:00:00.000Z',
    })).toBeNull();
  });
});
