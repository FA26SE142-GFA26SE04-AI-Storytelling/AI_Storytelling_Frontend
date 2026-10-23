import { Page } from './ui';
export default function UnavailableFeature({title}:{title:string}) {
  return <Page title={title}><p className="notice" role="status">Chức năng này chưa được kết nối API trong frontend. Chưa có dữ liệu để hiển thị hoặc thao tác để thực hiện.</p></Page>;
}
