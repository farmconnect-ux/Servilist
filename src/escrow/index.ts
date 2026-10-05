import { EscrowOrder, EscrowStatus, CurrencyCode } from '../types';

/**
 * Valid allowed state transitions in the Servilist Escrow state machine.
 */
export const ALLOWED_ESCROW_TRANSITIONS: Record<EscrowStatus, EscrowStatus[]> = {
  funded: ['inspection', 'otp_verified', 'disputed', 'refunded'],
  inspection: ['otp_verified', 'disputed'],
  otp_verified: ['released'],
  released: [], // terminal state
  disputed: ['released', 'refunded'],
  refunded: [], // terminal state
};

export function canTransitionEscrow(
  currentStatus: EscrowStatus,
  targetStatus: EscrowStatus
): boolean {
  const allowed = ALLOWED_ESCROW_TRANSITIONS[currentStatus] || [];
  return allowed.includes(targetStatus);
}

export function transitionEscrow(
  order: EscrowOrder,
  targetStatus: EscrowStatus,
  options?: { otpAttempt?: string; resolvedBy?: string }
): { success: boolean; order?: EscrowOrder; error?: string } {
  // If moving into otp_verified, verify OTP code strictly
  if (targetStatus === 'otp_verified') {
    if (!order.otpCode) {
      return { success: false, error: 'Order has no OTP code registered' };
    }
    const cleanAttempt = (options?.otpAttempt || '').replace(/[-\s]/g, '').trim();
    const cleanActual = order.otpCode.replace(/[-\s]/g, '').trim();

    if (!cleanAttempt || cleanAttempt.toLowerCase() === 'test') {
      return { success: false, error: 'Invalid handover OTP code' };
    }

    if (cleanAttempt !== cleanActual) {
      return { success: false, error: 'Incorrect handover OTP code' };
    }
  }

  // Check state machine validity
  if (!canTransitionEscrow(order.status, targetStatus)) {
    return {
      success: false,
      error: `Illegal state transition from ${order.status} to ${targetStatus}`,
    };
  }

  const updated: EscrowOrder = {
    ...order,
    status: targetStatus,
    releasedAt: targetStatus === 'released' ? Date.now() : order.releasedAt,
  };

  return { success: true, order: updated };
}

/**
 * Generates a collision-safe escrow order code.
 */
export function generateEscrowCode(): string {
  const ts = Date.now().toString(36).toUpperCase();
  const rand = Math.floor(1000 + Math.random() * 9000);
  return `ESC-${ts}-${rand}`;
}

/**
 * Generates a 6-digit random handover OTP code.
 */
export function generateHandoverOtp(): string {
  const p1 = Math.floor(100 + Math.random() * 900);
  const p2 = Math.floor(100 + Math.random() * 900);
  return `${p1}-${p2}`;
}

/**
 * Factory for creating a new EscrowOrder in 'funded' state.
 */
export function createEscrowOrder(params: {
  listingId?: string;
  requestId?: string;
  quoteId?: string;
  title: string;
  buyerName: string;
  buyerId?: string;
  sellerName: string;
  sellerId?: string;
  amountMinor: number;
  currency: CurrencyCode;
  targetCurrency?: CurrencyCode;
  safeZone: string;
}): EscrowOrder {
  return {
    id: `esc-${Date.now()}-${Math.floor(Math.random() * 10000)}`,
    listingId: params.listingId,
    requestId: params.requestId,
    quoteId: params.quoteId,
    orderCode: generateEscrowCode(),
    title: params.title,
    buyerName: params.buyerName,
    buyerId: params.buyerId,
    sellerName: params.sellerName,
    sellerId: params.sellerId,
    amountMinor: params.amountMinor,
    currency: params.currency,
    targetCurrency: params.targetCurrency || params.currency,
    safeZone: params.safeZone,
    status: 'funded',
    otpCode: generateHandoverOtp(),
    fundedAt: Date.now(),
  };
}
