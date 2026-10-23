import { WORKSPACES, type WorkspaceId } from '@/app/components/shell/nav';
export function positiveStoryId(value: string | null): number | null {
  if (!value || !/^\d+$/.test(value)) return null;
  const id = Number(value);
  return Number.isSafeInteger(id) && id > 0 ? id : null;
}
export function readWorkspaceLocation(href: string): { workspace:WorkspaceId; storyId:number | null } {
  const url = new URL(href);
  const workspace = WORKSPACES.find(w => w.id === url.hash.slice(1))?.id ?? 'home';
  return { workspace, storyId: workspace === 'studio' ? positiveStoryId(url.searchParams.get('storyId')) : null };
}
export function workspaceLocation(href: string, workspace:WorkspaceId, storyId:number | null = null): string {
  const url = new URL(href); url.hash = workspace; url.searchParams.delete('storyId');
  if (workspace === 'studio' && storyId !== null && Number.isSafeInteger(storyId) && storyId > 0) url.searchParams.set('storyId',String(storyId));
  return `${url.pathname}${url.search}${url.hash}`;
}
