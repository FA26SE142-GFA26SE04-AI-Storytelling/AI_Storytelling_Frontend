'use client';
import '@/app/styles/features/kid/kid.css';
import '@/app/styles/features/kid/kidapp.css';
import ConnectedKidHome from './ConnectedKidHome';
/** openStoryId: mở thẳng truyện này khi vào ("Cho bé đọc truyện này"). */
export default function KidApp(props:{childId:number;onExit:()=>void;openStoryId?:number|null}){return <ConnectedKidHome key={props.childId} {...props}/>;}
