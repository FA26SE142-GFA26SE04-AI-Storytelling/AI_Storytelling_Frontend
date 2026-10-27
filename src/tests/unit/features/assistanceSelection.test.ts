import {describe,it,expect} from 'vitest';
import {assistanceTarget} from '@/app/features/story-workflow/assistanceSelection';
describe('Contextual assistance editor targets',()=>{
  const snapshot={title:'Chiếc hộp',content:'Mi 🐸 sửa hộp.'};
  it('uses the unsaved draft and UTF-16 offsets for continuation and review',()=>{
    expect(assistanceTarget('ContinueWriting',snapshot)).toEqual({kind:'cursor',start:snapshot.content.length,length:0});
    expect(assistanceTarget('ReviewDraft',snapshot)).toEqual({kind:'wholeDraft',start:0,length:snapshot.content.length});
    expect(assistanceTarget('ReviewDraft',{...snapshot,content:'  '})).toBeNull();
  });
  it('pins a selection to both title and text and rejects the entire draft',()=>{
    const selection={snapshot,start:3,length:2};
    expect(assistanceTarget('SupportSelection',snapshot,selection)).toEqual({kind:'selection',start:3,length:2});
    expect(assistanceTarget('SupportSelection',{...snapshot,title:'Đã đổi'},selection)).toBeNull();
    expect(assistanceTarget('SupportSelection',{...snapshot,content:snapshot.content+'x'},selection)).toBeNull();
    expect(assistanceTarget('SupportSelection',snapshot,{snapshot,start:0,length:snapshot.content.length})).toBeNull();
  });
  it('rejects missing, invalid and split-surrogate selections',()=>{
    expect(assistanceTarget('SupportSelection',snapshot)).toBeNull();
    for(const [start,length] of [[-1,2],[0,0],[0,999],[4,1],[3,1],[1.5,2]])
      expect(assistanceTarget('SupportSelection',snapshot,{snapshot,start,length})).toBeNull();
  });
});
