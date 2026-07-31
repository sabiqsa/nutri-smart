import { Icon } from "@/components/Icon/Icon";

export default function OfflinePage() {
  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-4 p-6 text-center">
      <span className="flex size-16 items-center justify-center rounded-full bg-primary text-on-primary">
        <Icon name="wifi_off" size={28} />
      </span>
      <h1 className="text-lg font-semibold">Gak ada koneksi</h1>
      <p className="max-w-sm text-sm text-on-surface-variant">
        Halaman ini butuh internet buat ambil data terbaru. Cek koneksi terus coba lagi.
      </p>
    </main>
  );
}
