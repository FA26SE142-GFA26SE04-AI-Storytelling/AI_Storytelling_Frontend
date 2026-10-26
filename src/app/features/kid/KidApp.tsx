'use client';
import './kid.css';
import './kidapp.css';
import ConnectedKidHome from './ConnectedKidHome';
export default function KidApp(props:{childId:number;onExit:()=>void}){return <ConnectedKidHome key={props.childId} {...props}/>;}
