import { useEffect, useState } from 'react';
import { trpc } from '@/lib/trpc';
import { useAuth } from '@/_core/hooks/useAuth';
import { isFounderEmail } from '@shared/founderAccess';
import { isFounderOrAdmin as roleIsFounderOrAdmin } from '@shared/userRoles';

const DISMISSED_KEY = 'popia_dismissed_until';
const BANNER_DISMISSED_KEY = 'popia_banner_dismissed_until';
/** Remind-me-later / banner soft-dismiss — short so unsigned dealers are prompted again soon. */
const DISMISS_TTL_MS = 3 * 24 * 60 * 60 * 1000; // 3 days

function readUntil(key: string): boolean {
  try {
    const until = Number(localStorage.getItem(key) ?? '0');
    return Date.now() < until;
  } catch {
    return false;
  }
}

function writeUntil(key: string) {
  try {
    localStorage.setItem(key, String(Date.now() + DISMISS_TTL_MS));
  } catch {
    /* ignore */
  }
}

function clearKey(key: string) {
  try {
    localStorage.removeItem(key);
  } catch {
    /* ignore */
  }
}

function isDismissed(): boolean {
  return readUntil(DISMISSED_KEY);
}

function setDismissedForTtl() {
  writeUntil(DISMISSED_KEY);
}

function clearDismissed() {
  clearKey(DISMISSED_KEY);
  clearKey(BANNER_DISMISSED_KEY);
}

function isBannerDismissed(): boolean {
  return readUntil(BANNER_DISMISSED_KEY);
}

function setBannerDismissedForTtl() {
  writeUntil(BANNER_DISMISSED_KEY);
}

export function usePopiaConsent() {
  const { user } = useAuth();
  const [showModal, setShowModal] = useState(false);
  const [needsReconfirmation, setNeedsReconfirmation] = useState(false);
  const [isUnsigned, setIsUnsigned] = useState(false);
  const [dismissed, setDismissed] = useState(() => isDismissed());
  const [bannerDismissed, setBannerDismissed] = useState(() => isBannerDismissed());

  // Platform owners set POPIA requirements — never trap them behind the dealer modal/banner.
  // Also respect founder emails even if role has not been promoted yet in this session.
  const isFounderOrAdmin =
    roleIsFounderOrAdmin(user) || isFounderEmail(user?.email);

  const checkStatusQuery = trpc.popia.checkStatus.useQuery(
    user && user.dealershipId
      ? { userId: user.id, dealershipId: user.dealershipId }
      : { userId: 0, dealershipId: 0 },
    {
      enabled: !!user && !!user.dealershipId && !isFounderOrAdmin,
      refetchInterval: 60 * 60 * 1000,
      retry: false,
    }
  );

  // If we discover we are a founder mid-session, force-hide any stuck modal/banner.
  useEffect(() => {
    if (isFounderOrAdmin) {
      setShowModal(false);
      setIsUnsigned(false);
      setDismissed(false);
      setBannerDismissed(false);
    }
  }, [isFounderOrAdmin]);

  const signMutation = trpc.popia.sign.useMutation({
    onSuccess: () => {
      clearDismissed();
      setDismissed(false);
      setBannerDismissed(false);
      setIsUnsigned(false);
      setShowModal(false);
      checkStatusQuery.refetch();
    },
    onError: (error) => {
      console.error('[POPIA] Error signing consent:', error);
    },
  });

  const reconfirmMutation = trpc.popia.reconfirm.useMutation({
    onSuccess: () => {
      setNeedsReconfirmation(false);
      checkStatusQuery.refetch();
    },
    onError: (error) => {
      console.error('[POPIA] Error reconfirming consent:', error);
    },
  });

  useEffect(() => {
    if (isFounderOrAdmin) return;
    if (checkStatusQuery.error) {
      console.warn('[POPIA] Error checking consent status:', checkStatusQuery.error);
      return;
    }
    if (checkStatusQuery.data) {
      const status = checkStatusQuery.data.status;

      if (status === 'not_signed') {
        setIsUnsigned(true);
        // Only pop the modal if the dealer hasn't dismissed it recently (3-day snooze).
        if (!isDismissed()) {
          setShowModal(true);
        }
      } else if (status === 'expired') {
        setNeedsReconfirmation(true);
      }
    }
  }, [checkStatusQuery.data, checkStatusQuery.error, isFounderOrAdmin]);

  // Called when the user clicks "Remind me later" — hides modal for 3 days.
  const handleDismiss = () => {
    setDismissedForTtl();
    setDismissed(true);
    setShowModal(false);
  };

  // Soft-dismiss the pending banner only (does not require signing POPIA).
  // Same TTL as remind-later; Legal → POPIA remains available anytime.
  const handleBannerDismiss = () => {
    setBannerDismissedForTtl();
    setBannerDismissed(true);
  };

  const handleSign = async (signedName: string) => {
    if (!user || !user.dealershipId) return;

    const ipAddress = await fetch('https://api.ipify.org?format=json')
      .then((res) => res.json())
      .then((data) => data.ip)
      .catch(() => 'unknown');

    await signMutation.mutateAsync({
      userId: user.id,
      dealershipId: user.dealershipId,
      signedName,
      ipAddress,
      userAgent: navigator.userAgent,
    });
  };

  const handleReconfirm = async (consentId: number) => {
    await reconfirmMutation.mutateAsync({ consentId });
  };

  return {
    showModal,
    setShowModal,
    needsReconfirmation,
    setNeedsReconfirmation,
    handleSign,
    handleReconfirm,
    handleDismiss,
    handleBannerDismiss,
    isFounderOrAdmin,
    isLoading: signMutation.isPending || reconfirmMutation.isPending,
    consentStatus: checkStatusQuery.data && checkStatusQuery.data.status ? checkStatusQuery.data : null,
    // True when a non-founder dealer dismissed the modal and has not soft-dismissed the banner.
    unsignedButDismissed:
      isUnsigned && dismissed && !bannerDismissed && !isFounderOrAdmin,
  };
}
