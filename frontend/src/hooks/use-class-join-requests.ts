import { useCallback, useEffect, useState } from "react";
import { classService, type ClassJoinRequest } from "@/services/class-service";

export const useClassJoinRequests = (
  classId: string,
  enabled: boolean,
  onApproved: () => Promise<void>,
) => {
  const [requests, setRequests] = useState<ClassJoinRequest[]>([]);
  const [isLoading, setIsLoading] = useState(enabled);
  const [error, setError] = useState<string | null>(null);
  const [reviewingId, setReviewingId] = useState<string | null>(null);

  const reload = useCallback(async () => {
    if (!enabled) return;
    setIsLoading(true);
    setError(null);
    try {
      setRequests(await classService.getJoinRequests(classId));
    } catch {
      setError("Não foi possível carregar as solicitações de matrícula.");
    } finally {
      setIsLoading(false);
    }
  }, [classId, enabled]);

  useEffect(() => {
    void reload();
  }, [reload]);

  const review = useCallback(
    async (requestId: string, action: "approve" | "reject") => {
      setReviewingId(requestId);
      setError(null);
      try {
        if (action === "approve") {
          await classService.approveJoinRequest(classId, requestId);
          await onApproved();
        } else await classService.rejectJoinRequest(classId, requestId);
        setRequests((current) =>
          current.filter((item) => item.id !== requestId),
        );
      } catch {
        setError("Não foi possível revisar a solicitação.");
      } finally {
        setReviewingId(null);
      }
    },
    [classId, onApproved],
  );

  return { requests, isLoading, error, reviewingId, reload, review };
};
