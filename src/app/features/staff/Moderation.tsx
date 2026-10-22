import ConnectedModerationQueue from './ConnectedModerationQueue';
import UnavailableFeature from './UnavailableFeature';
export function ModerationQueue({admin}:{admin?:boolean}){return <ConnectedModerationQueue admin={admin}/>;}
export function RatingPage(){return <UnavailableFeature title="Chấm kết quả đánh giá AI"/>;}
