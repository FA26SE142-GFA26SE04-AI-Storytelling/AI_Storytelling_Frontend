import assert from 'node:assert/strict';
const wave=Buffer.alloc(44+16000*10);wave.write('RIFF',0);wave.writeUInt32LE(wave.length-8,4);wave.write('WAVEfmt ',8);wave.writeUInt32LE(16,16);wave.writeUInt16LE(1,20);wave.writeUInt16LE(1,22);wave.writeUInt32LE(8000,24);wave.writeUInt32LE(16000,28);wave.writeUInt16LE(2,32);wave.writeUInt16LE(16,34);wave.write('data',36);wave.writeUInt32LE(wave.length-44,40);
const voice='data:audio/wav;base64,'+wave.toString('base64');
const picture='data:image/svg+xml,'+encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="900" height="450"><rect width="900" height="450" fill="#243e45"/><circle cx="650" cy="100" r="65" fill="#f7dfad"/><path d="M0 350Q250 150 500 350T900 300V450H0" fill="#37664e"/></svg>');
export async function childReadingFixture({path,method,body,state,ok,caseName}) {
 state.reading ??= {page:1,mode:'ReadFirst',bookmark:false,favorite:false,collected:false,complete:false};const s=state.reading;
 const word={entryId:3,vocabularyId:8,term:'Đoàn kết',definition:'Cùng giúp đỡ nhau.',storyId:7,storyTitle:'Truyện đọc từ backend',sceneIndex:1,collectedAt:'2026-10-25T00:00:00Z'};
 if(path==='/child/reading/stories')return ok({isLocked:caseName==='ChildLibraryHold',unlockStoryId:caseName==='ChildLibraryHold'?7:null,message:caseName==='ChildLibraryHold'?'Em đọc lại truyện đang mở nhé.':null,items:caseName==='ChildLibraryHold'?[]:[{storyId:7,title:'Truyện đọc từ backend',coverImageUrl:null,description:'Truyện đã cấp quyền',source:'mine'}],pageIndex:1,pageSize:20,totalCount:1});
 if(path==='/child/reading/sessions') {assert(body.storyId===7||body.communitySubmissionId===31);return ok({sessionId:4,storyId:7,resumed:false,lastPage:s.page,lastReadingMode:s.mode,isBookmarked:s.bookmark,isFavorited:s.favorite});}
 if(path==='/child/reading/sessions/4/content')return ok({sessionId:4,storyId:7,title:'Truyện đọc từ backend',lesson:'Biết giúp bạn.',scenes:[0,1].map(i=>({sceneIndex:i,text:`Nội dung cảnh ${i+1} từ backend.`,illustrationUrl:caseName==='ChildTheater'?picture:null,segments:(caseName==='ChildTheater'?[0,1]:[0]).map(n=>({segmentOrder:n,text:n?'Cùng sẻ chia.':'Đọc cùng bạn',audioUrl:caseName==='ChildTheater'?voice:null,wordTimingsJson:null}))})),vocabulary:[{id:8,term:'Đoàn kết'}]});
 if(path==='/child/reading/sessions/4/signal')return ok({shouldExit:caseName==='ChildReadingExit'&&s.bookmark,returnTo:'JourneyMap',message:'Truyện này đang nghỉ một chút.',sessionStatus:'Reading'});
 if(path==='/child/reading/sessions/4/progress'){assert(body.page>=1&&body.page<=2);assert(body.addedSeconds>=0&&body.addedSeconds<=600);s.page=body.page;s.mode=body.readingMode;return ok({sessionId:4,page:s.page,readingMode:s.mode,timeSpentSeconds:body.addedSeconds});}
 if(path==='/child/reading/sessions/4/complete'){assert.equal(s.page,2);s.complete=true;return ok({sessionId:4,storyId:7,isRetake:false,roadmapStepCompleted:true});}
 if(path.endsWith('/4/bookmark')){s.bookmark=body.value;return ok({isBookmarked:s.bookmark,isFavorited:s.favorite});}
 if(path.endsWith('/4/favorite')){s.favorite=body.value;return ok({isBookmarked:s.bookmark,isFavorited:s.favorite});}
 if(path.endsWith('/4/events'))return ok(null);
 if(path==='/child/reading/sessions/4/vocabulary/8')return ok({vocabularyId:8,term:word.term,definition:word.definition,isCollected:s.collected});
 if(path==='/child/notebook/sessions/4/words'){assert.equal(body.vocabularyId,8);s.collected=true;return ok(word);}
 if(path==='/child/notebook')return ok(s.collected?[word]:[]);
 if(path==='/child/notebook/3'&&method==='DELETE'){s.collected=false;return ok(null);}
 return false;
}
