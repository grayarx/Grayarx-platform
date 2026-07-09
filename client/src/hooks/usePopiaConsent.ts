import { useEffect, useState } from 'react';
import { trpc } from '@/lib/trpc';
import { useAuth } from '@/_core/hooks/useAuth';

export function usePopiaConsent() {
  const { user } = useAuth();
  const [showModal, setShowModal] = useState(false);
  const [needsReconfirmation, setNeedsReconfirmation] = useState(false);

  const checkStatusQuery = trpc.popia.checkStatus.useQuery(
    user && user.dealershipId
      ? { userId: user.id, dealershipId: user.dealershipId }
      : { userId: 0, dealershipId: 0 },
    {
      enabled: !!user && !!user.dealershipId,
      refetchInterval: 60 * 60 * 1000,
      retry: false,
    }
  );

  const signMutation = trpc.popia.sign.useMutation({
    onSuccess: () => {
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
    if (checkStatusQuery.error) {
      console.warn('[POPIA] Error checking consent status:', checkStatusQuery.error);
      return;
    }
    if (checkStatusQuery.data) {
      const status = checkStatusQuery.data.status;

      if (status === 'not_signed') {
        setShowModal(true);
      } else if (status === 'expired') {
        setNeedsReconfirmation(true);
      }
    }
  }, [checkStatusQuery.data, checkStatusQuery.error]);

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
    isLoading: signMutation.isPending || reconfirmMutation.isPending,
    consentStatus: checkStatusQuery.data && checkStatusQuery.data.status ? checkStatusQuery.data : null,
  };
}
