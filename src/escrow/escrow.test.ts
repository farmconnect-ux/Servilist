import { describe, it, expect } from 'vitest';
import {
  canTransitionEscrow,
  transitionEscrow,
  createEscrowOrder,
  generateEscrowCode,
  generateHandoverOtp,
} from './index';

describe('Escrow Module & State Machine', () => {
  describe('canTransitionEscrow', () => {
    it('allows valid transitions from funded to inspection', () => {
      expect(canTransitionEscrow('funded', 'inspection')).toBe(true);
    });

    it('allows valid transitions from inspection to otp_verified', () => {
      expect(canTransitionEscrow('inspection', 'otp_verified')).toBe(true);
    });

    it('allows valid transitions from otp_verified to released', () => {
      expect(canTransitionEscrow('otp_verified', 'released')).toBe(true);
    });

    it('allows dispute flow from funded or inspection', () => {
      expect(canTransitionEscrow('funded', 'disputed')).toBe(true);
      expect(canTransitionEscrow('inspection', 'disputed')).toBe(true);
    });

    it('rejects direct illegal skips (e.g. funded directly to released)', () => {
      expect(canTransitionEscrow('funded', 'released')).toBe(false);
    });

    it('rejects any transition out of terminal released state', () => {
      expect(canTransitionEscrow('released', 'funded')).toBe(false);
      expect(canTransitionEscrow('released', 'disputed')).toBe(false);
    });

    it('rejects any transition out of terminal refunded state', () => {
      expect(canTransitionEscrow('refunded', 'released')).toBe(false);
    });
  });

  describe('transitionEscrow with OTP verification', () => {
    const order = createEscrowOrder({
      title: 'Solar Inverter 5kVA',
      buyerName: 'John Doe',
      sellerName: 'Solar Tech Pro',
      amountMinor: 80000000,
      currency: 'NGN',
      safeZone: 'Ikeja Safe Zone',
    });

    it('moves from funded to inspection smoothly', () => {
      const res = transitionEscrow(order, 'inspection');
      expect(res.success).toBe(true);
      expect(res.order?.status).toBe('inspection');
    });

    it('rejects invalid OTP code when moving into otp_verified', () => {
      const inInspection = { ...order, status: 'inspection' as const };
      const res = transitionEscrow(inInspection, 'otp_verified', { otpAttempt: '000-000' });
      expect(res.success).toBe(false);
      expect(res.error).toContain('Incorrect handover OTP code');
    });

    it('rejects empty or "test" OTP bypass', () => {
      const inInspection = { ...order, status: 'inspection' as const };
      expect(transitionEscrow(inInspection, 'otp_verified', { otpAttempt: '' }).success).toBe(
        false
      );
      expect(transitionEscrow(inInspection, 'otp_verified', { otpAttempt: 'test' }).success).toBe(
        false
      );
    });

    it('accepts correct OTP code (ignoring spaces or dashes)', () => {
      const inInspection = { ...order, status: 'inspection' as const };
      const rawOtp = inInspection.otpCode;
      const strippedOtp = rawOtp.replace('-', '');
      const res = transitionEscrow(inInspection, 'otp_verified', { otpAttempt: strippedOtp });
      expect(res.success).toBe(true);
      expect(res.order?.status).toBe('otp_verified');
    });
  });

  describe('generateEscrowCode and generateHandoverOtp', () => {
    it('generates unique collision-safe escrow codes starting with ESC-', () => {
      const c1 = generateEscrowCode();
      const c2 = generateEscrowCode();
      expect(c1).toMatch(/^ESC-[A-Z0-9]+-\d{4}$/);
      expect(c1).not.toBe(c2);
    });

    it('generates 6-digit handover OTP in format XXX-XXX', () => {
      const otp = generateHandoverOtp();
      expect(otp).toMatch(/^\d{3}-\d{3}$/);
    });
  });
});
