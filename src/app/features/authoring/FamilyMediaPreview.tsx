'use client';
import type { ParentPreparationDto } from '@/app/types/backendContracts';
export default function FamilyMediaPreview({ preparation }: { preparation:ParentPreparationDto }) {
  const media = preparation.media;
  if (!media || !media.isConfirmed || !media.isReady || media.storyVersionId !== preparation.storyVersionId || media.packageRevision !== preparation.mediaPackageRevision) return null;
  return <div>{media.scenes.map(scene => <section key={scene.sceneId}>
    {scene.illustrations.map(image => image.url && image.status === 'Ready' ?
      // Signed media URLs come from the authorized package, without a public storage host assumption.
      // eslint-disable-next-line @next/next/no-img-element
      <img key={image.beatId} src={image.url} alt={image.visualFocus} style={{maxWidth:'100%', maxHeight:420, objectFit:'contain'}}/> : null)}
    {scene.audio?.map(audio => audio.url && audio.status === 'Ready' ? <audio key={audio.segmentId} controls preload="none" src={audio.url} aria-label={`Nghe đoạn ${audio.segmentOrder + 1}`}/> : null)}
  </section>)}</div>;
}
