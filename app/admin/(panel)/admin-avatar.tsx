// Photo de l'administrateur, ou l'initiale de son nom sur fond cuivre s'il n'en a pas.
export function AdminAvatar({ name, email, avatar, size = 32 }: { name: string | null; email: string; avatar: string | null; size?: number }) {
  const label = name ?? email;
  if (avatar) {
    // eslint-disable-next-line @next/next/no-img-element -- data URL stockée en base : next/image n'apporte rien ici.
    return <img src={avatar} alt={`Photo de ${label}`} width={size} height={size} className="shrink-0 rounded-full object-cover" style={{ width: size, height: size }} />;
  }
  return (
    <span
      aria-hidden="true"
      className="flex shrink-0 items-center justify-center rounded-full bg-[#bd642d] font-[Georgia,'Times_New_Roman',serif] text-white"
      style={{ width: size, height: size, fontSize: Math.round(size * 0.42) }}
    >
      {label.slice(0, 1).toUpperCase()}
    </span>
  );
}
