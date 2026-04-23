import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import Icon from "@/components/ui/icon";
import type { User } from "@/lib/types";

type ModerationAction = "ban" | "mute" | "warn";

interface ModerationModalProps {
  open: boolean;
  onClose: () => void;
  action: ModerationAction;
  target: User;
  onConfirm: (data: { reason: string; expires_at?: string; permanent?: boolean }) => Promise<void>;
}

const ACTION_CONFIG: Record<ModerationAction, { title: string; icon: string; color: string; showExpiry: boolean; showPermanent: boolean }> = {
  ban: {
    title: "Забанить пользователя",
    icon: "Ban",
    color: "#ef4444",
    showExpiry: true,
    showPermanent: true,
  },
  mute: {
    title: "Замутить пользователя",
    icon: "MicOff",
    color: "#f97316",
    showExpiry: true,
    showPermanent: false,
  },
  warn: {
    title: "Выдать варн",
    icon: "AlertTriangle",
    color: "#f59e0b",
    showExpiry: false,
    showPermanent: false,
  },
};

export default function ModerationModal({
  open,
  onClose,
  action,
  target,
  onConfirm,
}: ModerationModalProps) {
  const [reason, setReason] = useState("");
  const [expiresAt, setExpiresAt] = useState("");
  const [permanent, setPermanent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const config = ACTION_CONFIG[action];

  const handleConfirm = async () => {
    if (!reason.trim()) {
      setError("Укажите причину");
      return;
    }
    setError("");
    setLoading(true);
    try {
      await onConfirm({
        reason: reason.trim(),
        expires_at: expiresAt || undefined,
        permanent: action === "ban" ? permanent : undefined,
      });
      setReason("");
      setExpiresAt("");
      setPermanent(false);
      onClose();
    } catch {
      setError("Ошибка при выполнении действия");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="glass-strong border border-white/10 max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 font-exo" style={{ color: config.color }}>
            <Icon name={config.icon} size={20} />
            {config.title}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="glass rounded-lg p-3 flex items-center gap-3">
            <div
              className="w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold"
              style={{ background: `${config.color}20`, color: config.color }}
            >
              {target.username[0].toUpperCase()}
            </div>
            <div>
              <div className="text-sm font-medium text-foreground">{target.username}</div>
              <div className="text-xs text-muted-foreground">{target.email}</div>
            </div>
          </div>

          <div className="space-y-2">
            <Label className="text-sm text-muted-foreground">Причина *</Label>
            <Textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Укажите причину..."
              className="glass border-white/10 resize-none"
              rows={3}
            />
          </div>

          {config.showPermanent && (
            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                id="permanent"
                checked={permanent}
                onChange={(e) => setPermanent(e.target.checked)}
                className="rounded"
              />
              <Label htmlFor="permanent" className="text-sm cursor-pointer">
                Перманентный бан
              </Label>
            </div>
          )}

          {config.showExpiry && !permanent && (
            <div className="space-y-2">
              <Label className="text-sm text-muted-foreground">Срок до (опционально)</Label>
              <Input
                type="datetime-local"
                value={expiresAt}
                onChange={(e) => setExpiresAt(e.target.value)}
                className="glass border-white/10"
              />
            </div>
          )}

          {error && (
            <p className="text-red-400 text-sm flex items-center gap-1">
              <Icon name="AlertCircle" size={13} />
              {error}
            </p>
          )}
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={onClose} className="glass border-white/10">
            Отмена
          </Button>
          <Button
            onClick={handleConfirm}
            disabled={loading}
            style={{
              background: `linear-gradient(135deg, ${config.color}cc, ${config.color}88)`,
              border: `1px solid ${config.color}40`,
            }}
          >
            {loading ? (
              <Icon name="Loader2" size={14} className="animate-spin" />
            ) : (
              <Icon name={config.icon} size={14} />
            )}
            Подтвердить
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
