export default function Toast({ message }: { message: string }) {
  return (
    <div className="fixed bottom-6 left-1/2 z-50 -translate-x-1/2 animate-modal-enter">
      <div className="border border-white/10 bg-neutral-900 px-5 py-3 text-sm font-medium text-white shadow-lg">
        {message}
      </div>
    </div>
  );
}
