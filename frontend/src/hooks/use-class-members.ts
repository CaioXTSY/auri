import { useCallback, useEffect, useState } from "react";
import { classService, type StudentInClass } from "@/services/class-service";

export const useClassMembers = (classId: string) => {
  const [students, setStudents] = useState<StudentInClass[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      setStudents(await classService.getStudents(classId));
    } catch {
      setError("Não foi possível carregar os alunos da turma.");
    } finally {
      setIsLoading(false);
    }
  }, [classId]);

  useEffect(() => {
    void reload();
  }, [reload]);

  const remove = useCallback(
    async (student: StudentInClass) => {
      await classService.removeStudent(classId, student.user.id);
      setStudents((current) =>
        current.filter((item) => item.user.id !== student.user.id),
      );
    },
    [classId],
  );

  return { students, isLoading, error, reload, remove };
};
