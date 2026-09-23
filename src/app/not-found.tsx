import Link from 'next/link';
import { Home, Sparkles, Compass } from 'lucide-react';

export default function NotFound() {
  return (
    <main className="min-h-screen w-full flex flex-col items-center justify-center p-6 bg-zinc-950 text-zinc-100 font-sans select-none relative overflow-hidden">
      {/* Background ambient glow */}
      <div className="absolute w-96 h-96 rounded-full bg-amber-500/10 blur-[100px] pointer-events-none -top-20 -left-20" />
      <div className="absolute w-96 h-96 rounded-full bg-sky-500/10 blur-[100px] pointer-events-none -bottom-20 -right-20" />

      <div className="relative z-10 max-w-md w-full p-8 rounded-3xl bg-zinc-900/80 backdrop-blur-2xl border border-zinc-800 text-center shadow-2xl flex flex-col items-center gap-4">
        <div className="w-16 h-16 rounded-2xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400 shadow-lg">
          <Compass className="w-8 h-8 animate-spin" style={{ animationDuration: '12s' }} />
        </div>

        <span className="text-4xl font-black tracking-tight text-white">404</span>

        <h1 className="text-lg font-extrabold text-zinc-200">
          Không Tìm Thấy Góc Không Gian Này
        </h1>

        <p className="text-xs text-zinc-400 leading-relaxed">
          Có vẻ như bạn đã đi lạc khỏi căn phòng Nobita kỳ diệu. Hãy cùng quay trở lại phòng 3D để tiếp tục khám phá những câu chuyện thần kỳ nhé!
        </p>

        <Link
          href="/"
          className="mt-2 w-full py-3 rounded-2xl bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 hover:from-amber-400 hover:to-orange-400 text-white font-black text-sm flex items-center justify-center gap-2 shadow-lg shadow-amber-500/20 hover:scale-105 active:scale-95 transition-all"
        >
          <Home className="w-4 h-4" />
          <span>Quay Về Phòng 3D</span>
          <Sparkles className="w-4 h-4 text-amber-200" />
        </Link>
      </div>
    </main>
  );
}
