import { useEffect, useState } from 'react';
import { trpc } from '@/lib/trpc';
import { useAuth } from '@/_core/hooks/useAuth';

const DISMISSED_KEY = 'popia_dismissed_until';
const DISMISS_TTL_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

function isDismissed(): boolean {
  try {
    const until = Number(localStorage.getItem(DISMISSED_KEY) ?? '0');
    return Date.now() < until;
  } catch { return false; }
}

function setDismissedFor7Days() {
  try { localStorage.setItem(DISMISSED_KEY, String(Date.now() + DISMISS_TTL_MS)); } catch { /* ignore */ }
}

function clearDismissed() {
  try { localStorage.removeItem(DISMISSED_KEY); } catch { /* ignore */ }
}

export function usePopiaConsent() {
  const { user } = useAuth();
  const [showModal, setShowModal] = useState(false);
  const [needsReconfirmation, setNeedsReconfirmation] = useState(false);
  const [isUnsigned, setIsUnsigned] = useState(false);
  const [dismissed, setDismissed] = useState(() => isDismissed());

  // Founders and admins are the platform owner — they set the POPIA requirements.
  // Never show the POPIA consent modal to them.
  const isFounderOrAdmin = user?.role === 'founder' || user?.role === 'admin';

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

  const signMutation = trpc.popia.sign.useMutation({
    onSuccess: () => {
      clearDismissed();
      setDismissed(false);
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
        // Only pop the modal if the dealer hasn't dismissed it in the last 7 days.
        if (!isDismissed()) {
          setShowModal(true);
        }
      } else if (status === 'expired') {
        setNeedsReconfirmation(true);
      }
    }
  }, [checkStatusQuery.data, checkStatusQuery.error, isFounderOrAdmin]);

  // Called when the user clicks "Remind me later" — hides modal for 7 days.
  const handleDismiss = () => {
    setDismissedFor7Days();
    setDismissed(true);
    setShowModal(false);
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
    isLoading: signMutation.isPending || reconfirmMutation.isPending,
    consentStatus: checkStatusQuery.data && checkStatusQuery.data.status ? checkStatusQuery.data : null,
    // True when the dealer has not signed POPIA but chose "Remind me later" this session.
    unsignedButDismissed: isUnsigned && dismissed && !isFounderOrAdmin,
  };
}
