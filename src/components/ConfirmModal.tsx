import { useEffect, useId, useRef } from "react";
import { TrashIcon, XIcon } from "./icons";
import { IconButton } from "./IconButton";

interface ConfirmModalProps {
  title: string;
  description: string;
  confirmLabel?: string;
  cancelLabel?: string;
  loading?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export function ConfirmModal({
  title,
  description,
  confirmLabel = "Delete",
  cancelLabel = "Cancel",
  loading = false,
  onConfirm,
  onCancel,
}: ConfirmModalProps) {
  const titleId = useId();
  const descriptionId = useId();
  const cancelRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    cancelRef.current?.focus();
  }, []);

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape" && !loading) onCancel();
    }

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [loading, onCancel]);

  return (
    <div
      className="fixed inset-0 z-50 grid place-items-center bg-black/40 px-4"
      onClick={() => {
        if (!loading) onCancel();
      }}
    >
      <div
        role="alertdialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={descriptionId}
        className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-3">
            <span className="mt-0.5 grid h-10 w-10 shrink-0 place-items-center rounded-full bg-red-50 text-red-700">
              <TrashIcon className="h-5 w-5" />
            </span>
            <div>
              <h2 id={titleId} className="text-lg font-semibold">
                {title}
              </h2>
              <p id={descriptionId} className="mt-1 text-sm text-slate-500">
                {description}
              </p>
            </div>
          </div>
          <IconButton icon={<XIcon />} label="Close" onClick={onCancel} disabled={loading} />
        </div>

        <div className="mt-6 flex justify-end gap-2">
          <button
            ref={cancelRef}
            type="button"
            className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-60"
            onClick={onCancel}
            disabled={loading}
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            className="rounded-lg bg-red-700 px-4 py-2 text-sm font-medium text-white hover:bg-red-800 disabled:opacity-60"
            onClick={onConfirm}
            disabled={loading}
          >
            {loading ? "Deleting…" : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
