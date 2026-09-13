'use client';

import React from 'react';
import { Box, Orbit, Volume2, Globe, Cpu, Palette } from 'lucide-react';

const FEATURES = [
  {
    icon: Box,
    title: 'Thế Giới Truyện 3D Tương Tác',
    description: 'Chuyển đổi từng chương truyện thành không gian 3D trực quan, cho phép trẻ xoay, phóng to và khám phá môi trường câu chuyện.',
    badge: 'Spatial 3D',
    color: 'from-red-500 to-amber-500',
  },
  {
    icon: Orbit,
    title: 'Hệ Thống Hạt Phép Thuật (Particles)',
    description: 'Mô phỏng hiệu ứng ma thuật, tuyết rơi, sao lấp lánh và lửa trại sống động với thuật toán Three.js BufferGeometry.',
    badge: 'VFX WebGL',
    color: 'from-amber-500 to-emerald-500',
  },
  {
    icon: Volume2,
    title: 'Âm Thanh Vòm 3D Đa Dạng',
    description: 'Tích hợp vị trí âm thanh trong không gian 3D, giọng đọc nhân vật phát ra chính xác theo góc nhìn người dùng.',
    badge: '3D Positional Audio',
    color: 'from-emerald-500 to-cyan-500',
  },
  {
    icon: Globe,
    title: 'Vũ Trụ Nhân Vật AI 360°',
    description: 'Quan sát các nhân vật hoạt hình cổ tích dưới dạng mô hình 3D xoay 360 độ đầy sinh động.',
    badge: '3D Characters',
    color: 'from-cyan-500 to-purple-500',
  },
  {
    icon: Cpu,
    title: 'Tối Ưu Hiệu Năng Cao',
    description: 'Sử dụng WebGL 2.0 Renderer với cơ chế culling và dispose bộ nhớ thông minh, đảm bảo mượt màng trên cả thiết bị di động.',
    badge: 'High Performance',
    color: 'from-purple-500 to-pink-500',
  },
  {
    icon: Palette,
    title: 'Chiếu Sáng & Chất Liệu Động',
    description: 'Hỗ trợ ánh sáng điểm (PointLight), bóng đổ (ShadowMap) và chất liệu kim loại / phản chiếu cao cấp.',
    badge: 'Dynamic Lighting',
    color: 'from-pink-500 to-red-500',
  },
];

export const ThreeFeatureGrid: React.FC = () => {
  return (
    <section className="w-full py-8">
      <div className="space-y-6">
        <div className="text-center space-y-2">
          <h2 className="text-2xl sm:text-3xl font-extrabold text-zinc-900 dark:text-white">
            Ứng Dụng Three.js Trong AI Storytelling
          </h2>
          <p className="text-sm sm:text-base text-zinc-500 dark:text-zinc-400 max-w-2xl mx-auto">
            Nâng tầm trải nghiệm đọc truyện tương tác cho trẻ nhỏ và gia đình bằng công nghệ đồ họa WebGL tiên tiến.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {FEATURES.map((feat, idx) => {
            const Icon = feat.icon;
            return (
              <div
                key={idx}
                className="group relative p-6 rounded-3xl bg-white/70 dark:bg-zinc-900/70 border border-amber-100 dark:border-zinc-800 shadow-md hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 overflow-hidden"
              >
                <div className={`absolute top-0 right-0 w-24 h-24 bg-gradient-to-br ${feat.color} opacity-10 rounded-bl-full group-hover:scale-125 transition-transform`} />

                <div className="flex items-center justify-between mb-4">
                  <div className={`p-3 rounded-2xl bg-gradient-to-br ${feat.color} text-white shadow-md`}>
                    <Icon className="w-6 h-6" />
                  </div>
                  <span className="text-[11px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300">
                    {feat.badge}
                  </span>
                </div>

                <h3 className="text-lg font-bold text-zinc-900 dark:text-white mb-2 group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors">
                  {feat.title}
                </h3>
                <p className="text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed">
                  {feat.description}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};
