import { useCallback, useEffect, useState } from "react";
import {
  classService,
  type ClassSettings,
  type UpdateClassSettingsPayload,
} from "@/services/class-service";

export const useClassSettings = (
  classId: string,
  initial: ClassSettings | null | undefined,
) => {
  const [settings, setSettings] = useState<ClassSettings | null>(
    initial ?? null,
  );
  const [error, setError] = useState<string | null>(null);
  const [savingSetting, setSavingSetting] = useState<
    keyof UpdateClassSettingsPayload | null
  >(null);

  const reload = useCallback(async () => {
    setError(null);
    try {
      setSettings(await classService.getSettings(classId));
    } catch {
      setError("Não foi possível carregar as configurações da turma.");
    }
  }, [classId]);

  useEffect(() => {
    void reload();
  }, [reload]);

  const update = useCallback(
    async (key: keyof UpdateClassSettingsPayload, value: boolean) => {
      if (!settings) return;
      const previous = settings;
      setSavingSetting(key);
      setError(null);
      setSettings({ ...settings, [key]: value });
      try {
        setSettings(
          await classService.updateSettings(classId, { [key]: value }),
        );
      } catch {
        setSettings(previous);
        setError("Não foi possível salvar a configuração.");
      } finally {
        setSavingSetting(null);
      }
    },
    [classId, settings],
  );

  return { settings, error, savingSetting, reload, update };
};
