'use client';
import './kid.css';
import './kidapp.css';
import ConnectedKidHome from './ConnectedKidHome';
/** openStoryId: mở thẳng truyện này khi vào ("Cho bé đọc truyện này"). */
export default function KidApp(props:{childId:number;onExit:()=>void;openStoryId?:number|null}){return <ConnectedKidHome key={props.childId} {...props}/>;}
