"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { createPost, uploadPostPhoto, deleteOrphanedPhotos } from "@/app/_actions/posts";
import { getStaffRooms, getRoomChildren, getUserPreferences } from "@/app/_actions/rooms";
import imageCompression from "browser-image-compression";

type Room = { id: string; name: string };
type Child = { id: string; full_name: string; avatar_url: string | null };
type Photo = {
  id: string;
  file: File;
  previewUrl: string;
  storagePath: string;
  uploading: boolean;
  error: string | null;
};
type Toast = { message: string; type: "success" | "error" };

type Tipo = "Comida" | "Siesta" | "Actividad" | "Logro" | "Ánimo" | "Foto" | "Anuncio";

const TIPO_MAP: Record<Tipo, string> = {
  Comida: "meal",
  Siesta: "nap",
  Actividad: "activity",
  Logro: "achievement",
  Ánimo: "mood",
  Foto: "photo",
  Anuncio: "announcement",
};

const TIPOS: { id: Tipo; label: string; bg: string; color: string }[] = [
  { id: "Comida", label: "Comida", bg: "var(--color-tipo-comida)", color: "#fff" },
  { id: "Siesta", label: "Siesta", bg: "var(--color-tipo-siesta-bg)", color: "var(--color-tipo-siesta)" },
  { id: "Actividad", label: "Actividad", bg: "var(--color-badge-actividad)", color: "#fff" },
  { id: "Logro", label: "Logro", bg: "var(--color-badge-logro-bg)", color: "var(--color-badge-logro)" },
  { id: "Ánimo", label: "Ánimo", bg: "var(--color-tipo-animo-bg)", color: "var(--color-tipo-animo)" },
  { id: "Foto", label: "Foto", bg: "var(--color-tipo-foto-bg)", color: "var(--color-tipo-foto)" },
  { id: "Anuncio", label: "Anuncio", bg: "var(--color-badge-anuncio-bg)", color: "var(--color-badge-anuncio)" },
];

export function NewPostModal() {
  const [open, setOpen] = useState(false);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [selectedRoomId, setSelectedRoomId] = useState<string>("");
  const [children, setChildren] = useState<Child[]>([]);
  const [selectedChildIds, setSelectedChildIds] = useState<Set<string>>(new Set());
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [tipo, setTipo] = useState<Tipo>("Actividad");
  const [descripcion, setDescripcion] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [showDiscardConfirm, setShowDiscardConfirm] = useState(false);
  const [toast, setToast] = useState<Toast | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const dialogRef = useRef<HTMLDivElement>(null);

  const showToast = useCallback((message: string, type: "success" | "error") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 5000);
  }, []);

  const resetForm = useCallback(() => {
    setRooms([]);
    setSelectedRoomId("");
    setChildren([]);
    setSelectedChildIds(new Set());
    setPhotos([]);
    setTipo("Actividad");
    setDescripcion("");
    setSubmitting(false);
    setShowDiscardConfirm(false);
  }, []);

  const handleRoomChange = useCallback(async (roomId: string) => {
    setSelectedRoomId(roomId);
    const childrenResult = await getRoomChildren(roomId);
    setChildren(childrenResult.children);
    setSelectedChildIds(new Set(childrenResult.children.map((c) => c.id)));
  }, []);

  const toggleChild = useCallback((childId: string) => {
    setSelectedChildIds((prev) => {
      const next = new Set(prev);
      if (next.has(childId)) {
        next.delete(childId);
      } else {
        next.add(childId);
      }
      return next;
    });
  }, []);

  const toggleAllChildren = useCallback(() => {
    if (selectedChildIds.size === children.length) {
      setSelectedChildIds(new Set());
    } else {
      setSelectedChildIds(new Set(children.map((c) => c.id)));
    }
  }, [children, selectedChildIds.size]);

  const handleFileSelect = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;

    const remaining = 5 - photos.length;
    const filesToAdd = files.slice(0, remaining);

    for (const file of filesToAdd) {
      const previewUrl = URL.createObjectURL(file);
      const photoId = crypto.randomUUID();

      setPhotos((prev) => [
        ...prev,
        { id: photoId, file, previewUrl, storagePath: "", uploading: true, error: null },
      ]);

      try {
        const options = {
          maxSizeMB: 1,
          maxWidthOrHeight: 1920,
          useWebWorker: true,
          fileType: "image/webp",
        };

        const compressedFile = await imageCompression(file, options);
        
        const uploadFormData = new FormData();
        uploadFormData.append("file", compressedFile, compressedFile.name || "photo.webp");
        
        const result = await uploadPostPhoto(uploadFormData);

        if (result.success && result.path) {
          setPhotos((prev) =>
            prev.map((p) =>
              p.id === photoId ? { ...p, storagePath: result.path!, uploading: false } : p,
            ),
          );
        } else {
          setPhotos((prev) =>
            prev.map((p) =>
              p.id === photoId ? { ...p, uploading: false, error: result.error || "Error al subir" } : p,
            ),
          );
        }
      } catch {
        setPhotos((prev) =>
          prev.map((p) =>
            p.id === photoId ? { ...p, uploading: false, error: "Error al procesar imagen" } : p,
          ),
        );
      }
    }

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  }, [photos.length]);

  const removePhoto = useCallback((photoId: string) => {
    setPhotos((prev) => {
      const photo = prev.find((p) => p.id === photoId);
      if (photo && photo.storagePath) {
        deleteOrphanedPhotos([photo.storagePath]);
      }
      if (photo) {
        URL.revokeObjectURL(photo.previewUrl);
      }
      return prev.filter((p) => p.id !== photoId);
    });
  }, []);

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();

      if (!descripcion.trim()) {
        showToast("La descripción es obligatoria", "error");
        return;
      }

      if (!selectedRoomId) {
        showToast("Selecciona una sala", "error");
        return;
      }

      const uploadingPhotos = photos.filter((p) => p.uploading);
      if (uploadingPhotos.length > 0) {
        showToast("Espera a que terminen de subir las fotos", "error");
        return;
      }

      const failedPhotos = photos.filter((p) => p.error);
      if (failedPhotos.length > 0) {
        showToast("Hay fotos con error. Elimínalas o reintenta", "error");
        return;
      }

      setSubmitting(true);

      const formData = new FormData();
      formData.append("descripcion", descripcion.trim());
      formData.append("tipo", TIPO_MAP[tipo]);
      formData.append("room_id", selectedRoomId);
      formData.append("child_ids", JSON.stringify(Array.from(selectedChildIds)));
      formData.append("photo_paths", JSON.stringify(photos.map((p) => p.storagePath)));

      const result = await createPost(formData);

      setSubmitting(false);

      if (result.success) {
        showToast("Publicación creada", "success");
        resetForm();
        setOpen(false);
      } else {
        showToast(result.error || "Error al crear publicación", "error");
      }
    },
    [descripcion, selectedRoomId, photos, selectedChildIds, tipo, showToast, resetForm],
  );

  const requestClose = useCallback(() => {
    if (photos.length > 0) {
      setShowDiscardConfirm(true);
    } else {
      setOpen(false);
      resetForm();
    }
  }, [photos.length, resetForm]);

  const confirmDiscard = useCallback(async () => {
    if (photos.length > 0) {
      const paths = photos.map((p) => p.storagePath).filter(Boolean);
      if (paths.length > 0) {
        await deleteOrphanedPhotos(paths);
      }
      photos.forEach((p) => URL.revokeObjectURL(p.previewUrl));
    }
    setShowDiscardConfirm(false);
    setOpen(false);
    resetForm();
  }, [photos, resetForm]);

  const cancelDiscard = useCallback(() => {
    setShowDiscardConfirm(false);
  }, []);

  useEffect(() => {
    if (!open) return;
    
    const loadData = async () => {
      const [roomsResult, prefsResult] = await Promise.all([
        getStaffRooms(),
        getUserPreferences(),
      ]);

      setRooms(roomsResult.rooms);

      let defaultRoomId = "";
      if (prefsResult.lastRoomId && roomsResult.rooms.some((r) => r.id === prefsResult.lastRoomId)) {
        defaultRoomId = prefsResult.lastRoomId;
      } else if (roomsResult.rooms.length > 0) {
        defaultRoomId = roomsResult.rooms[0].id;
      }

      setSelectedRoomId(defaultRoomId);

      if (defaultRoomId) {
        const childrenResult = await getRoomChildren(defaultRoomId);
        setChildren(childrenResult.children);
        setSelectedChildIds(new Set(childrenResult.children.map((c) => c.id)));
      }
    };
    
    loadData();
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        if (showDiscardConfirm) {
          cancelDiscard();
        } else {
          requestClose();
        }
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, requestClose, showDiscardConfirm, cancelDiscard]);

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  useEffect(() => {
    if (!open || !dialogRef.current) return;
    const dialog = dialogRef.current;
    const focusable = dialog.querySelectorAll<HTMLElement>(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
    );
    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    first?.focus();
    const trap = (e: KeyboardEvent) => {
      if (e.key !== "Tab") return;
      if (e.shiftKey) {
        if (document.activeElement === first) {
          e.preventDefault();
          last?.focus();
        }
      } else {
        if (document.activeElement === last) {
          e.preventDefault();
          first?.focus();
        }
      }
    };
    dialog.addEventListener("keydown", trap);
    return () => dialog.removeEventListener("keydown", trap);
  }, [open]);

  const allSelected = children.length > 0 && selectedChildIds.size === children.length;

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="Abrir nueva publicación"
        className="flex items-center justify-center gap-2 w-full p-3 rounded-[14px] text-white font-extrabold text-[14.5px] mb-[18px] bg-[linear-gradient(180deg,var(--color-primary-gradient-from),var(--color-primary-gradient-to))] shadow-[0_8px_18px_-8px_rgba(238,129,100,0.75)]"
      >
        <svg
          width="17"
          height="17"
          viewBox="0 0 24 24"
          fill="none"
          stroke="#fff"
          strokeWidth="2.4"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M12 5v14M5 12h14" />
        </svg>
        Nueva publicación
      </button>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-start justify-center p-[40px_24px]"
          style={{ background: "var(--color-modal-overlay)" }}
          onClick={requestClose}
          aria-hidden="true"
        >
          <div
            ref={dialogRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby="new-post-title"
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-[580px] bg-auth-bg border border-border-cream rounded-[24px] shadow-[0_20px_50px_-24px_rgba(63,54,46,0.35)] overflow-hidden"
          >
            <div className="flex items-center justify-between px-[26px] py-5 border-b border-border-cream">
              <button
                type="button"
                onClick={requestClose}
                className="text-ink-muted text-[15px] font-bold"
                disabled={submitting}
              >
                Cancelar
              </button>
              <span id="new-post-title" className="font-display text-[18px] font-semibold text-ink">
                Nueva publicación
              </span>
              <button
                type="submit"
                form="new-post-form"
                className="text-primary text-[15px] font-extrabold cursor-pointer bg-transparent border-none p-0 disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={submitting}
              >
                {submitting ? "Publicando..." : "Publicar"}
              </button>
            </div>

            <form id="new-post-form" onSubmit={handleSubmit}>
              <div className="px-[26px] py-6">
                {rooms.length > 1 && (
                  <>
                    <div className="text-[12px] font-extrabold tracking-[0.7px] text-ink-muted mb-[10px]">
                      SALA
                    </div>
                    <select
                      value={selectedRoomId}
                      onChange={(e) => handleRoomChange(e.target.value)}
                      className="w-full px-[16px] py-[12px] rounded-[14px] border-[1.5px] border-solid border-border-input bg-white text-[15px] text-ink leading-[1.5] outline-none mb-[22px]"
                      disabled={submitting}
                    >
                      {rooms.map((room) => (
                        <option key={room.id} value={room.id}>
                          {room.name}
                        </option>
                      ))}
                    </select>
                  </>
                )}

                <div className="text-[12px] font-extrabold tracking-[0.7px] text-ink-muted mb-[10px]">
                  PARA
                </div>
                <div className="flex flex-wrap gap-[9px] mb-[22px]">
                  <button
                    type="button"
                    onClick={toggleAllChildren}
                    className={[
                      "flex items-center gap-2 rounded-full border-[1.5px] border-solid font-bold text-[14px] py-[6px] px-[16px]",
                      allSelected
                        ? "border-ink bg-ink text-white"
                        : "border-border-cream bg-surface text-ink-soft",
                    ].join(" ")}
                    disabled={submitting}
                  >
                    Toda la sala
                  </button>
                  {children.map((child) => {
                    const active = selectedChildIds.has(child.id);
                    const letter = child.full_name.charAt(0).toUpperCase();
                    return (
                      <button
                        key={child.id}
                        type="button"
                        onClick={() => toggleChild(child.id)}
                        className={[
                          "flex items-center gap-2 rounded-full border-[1.5px] border-solid font-bold text-[14px] py-[6px] pr-[14px] pl-[6px]",
                          active
                            ? "border-ink bg-ink text-white"
                            : "border-border-cream bg-surface text-ink-soft",
                        ].join(" ")}
                        disabled={submitting}
                      >
                        <span
                          className="w-[26px] h-[26px] rounded-full font-display font-semibold text-[13px] flex items-center justify-center"
                          style={{
                            background: active ? "#fff" : "var(--color-avatar-sky-bg)",
                            color: active ? "var(--color-ink)" : "var(--color-avatar-sky)",
                          }}
                        >
                          {letter}
                        </span>
                        {child.full_name}
                      </button>
                    );
                  })}
                </div>

                <div className="text-[12px] font-extrabold tracking-[0.7px] text-ink-muted mb-[10px]">
                  TIPO
                </div>
                <div className="flex flex-wrap gap-[9px] mb-[22px]">
                  {TIPOS.map(({ id, label, bg, color }) => {
                    const active = tipo === id;
                    return (
                      <button
                        key={id}
                        type="button"
                        onClick={() => setTipo(id)}
                        className={[
                          "py-[8px] px-[16px] rounded-full border-none font-extrabold text-[13.5px]",
                          active ? "outline outline-2 outline-offset-[3px] outline-ink" : "",
                        ].join(" ")}
                        style={{ background: bg, color }}
                        disabled={submitting}
                      >
                        {label}
                      </button>
                    );
                  })}
                </div>

                <div className="text-[12px] font-extrabold tracking-[0.7px] text-ink-muted mb-[10px]">
                  DESCRIPCIÓN
                </div>
                <textarea
                  value={descripcion}
                  onChange={(e) => setDescripcion(e.target.value)}
                  placeholder="Contá cómo le fue hoy…"
                  className="w-full min-h-[120px] resize-y px-[16px] py-[14px] rounded-[14px] border-[1.5px] border-solid border-border-input bg-white text-[15px] text-ink leading-[1.5] outline-none mb-[22px]"
                  disabled={submitting}
                />

                <div className="text-[12px] font-extrabold tracking-[0.7px] text-ink-muted mb-[10px]">
                  FOTOS
                </div>
                <div className="flex flex-wrap gap-[12px]">
                  {photos.map((photo) => (
                    <div key={photo.id} className="relative w-[96px] h-[96px]">
                      <img
                        src={photo.previewUrl}
                        alt=""
                        className="w-full h-full object-cover rounded-[14px] border border-border-cream"
                      />
                      {photo.uploading && (
                        <div className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-[14px]">
                          <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        </div>
                      )}
                      {photo.error && (
                        <div className="absolute inset-0 flex items-center justify-center bg-red-500/80 rounded-[14px] text-white text-[10px] text-center p-1">
                          Error
                        </div>
                      )}
                      {!photo.uploading && (
                        <button
                          type="button"
                          onClick={() => removePhoto(photo.id)}
                          className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center text-xs hover:bg-red-600"
                          disabled={submitting}
                        >
                          ×
                        </button>
                      )}
                    </div>
                  ))}
                  {photos.length < 5 && (
                    <label
                      className={[
                        "w-[96px] h-[96px] border-[1.5px] border-dashed border-photo-add-border rounded-[14px] flex flex-col items-center justify-center gap-[6px] text-ink-placeholder cursor-pointer",
                        submitting ? "opacity-50 cursor-not-allowed" : "hover:bg-photo-tile-bg/50",
                      ].join(" ")}
                    >
                      <svg
                        className="text-primary-dark"
                        width="22"
                        height="22"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <path d="M12 5v14M5 12h14" />
                      </svg>
                      <span className="text-[12px]">Agregar</span>
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/jpeg,image/png,image/webp"
                        multiple
                        onChange={handleFileSelect}
                        className="hidden"
                        disabled={submitting}
                      />
                    </label>
                  )}
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {showDiscardConfirm && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center p-6"
          style={{ background: "var(--color-modal-overlay)" }}
          onClick={cancelDiscard}
          aria-hidden="true"
        >
          <div
            role="alertdialog"
            aria-modal="true"
            aria-labelledby="discard-title"
            aria-describedby="discard-desc"
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-[400px] bg-auth-bg border border-border-cream rounded-[20px] shadow-[0_20px_50px_-24px_rgba(63,54,46,0.35)] p-6"
          >
            <h3 id="discard-title" className="font-display text-[18px] font-semibold text-ink mb-2">
              ¿Descartar cambios?
            </h3>
            <p id="discard-desc" className="text-[14px] text-ink-muted mb-6">
              Las fotos no se publicarán.
            </p>
            <div className="flex gap-3 justify-end">
              <button
                type="button"
                onClick={cancelDiscard}
                className="px-4 py-2 rounded-[10px] border border-border-cream bg-surface text-ink-soft font-bold text-[14px] hover:bg-surface/80"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={confirmDiscard}
                className="px-4 py-2 rounded-[10px] bg-red-500 text-white font-bold text-[14px] hover:bg-red-600"
              >
                Descartar
              </button>
            </div>
          </div>
        </div>
      )}

      {toast && (
        <div
          role="status"
          aria-live="polite"
          className={[
            "fixed bottom-6 right-6 z-[70] flex items-center gap-3 px-4 py-3 rounded-[12px] shadow-lg text-white font-bold text-[14px]",
            toast.type === "success" ? "bg-green-500" : "bg-red-500",
          ].join(" ")}
        >
          {toast.type === "success" ? (
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M20 6 9 17l-5-5" />
            </svg>
          ) : (
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10" />
              <path d="m15 9-6 6M9 9l6 6" />
            </svg>
          )}
          {toast.message}
          <button
            type="button"
            onClick={() => setToast(null)}
            className="ml-2 text-white/80 hover:text-white"
            aria-label="Cerrar"
          >
            ×
          </button>
        </div>
      )}
    </>
  );
}
