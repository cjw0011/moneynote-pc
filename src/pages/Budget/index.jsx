import { PageContainer } from '@ant-design/pro-components';

export default () => {
  const token = localStorage.getItem('accessToken');
  const iframeUrl = `https://budget.mylabcdd.top:30046/?token=${token}`;

  return (
    <PageContainer title={false}>
      <iframe
        src={iframeUrl} 
        style={{ width: '100%', height: '80vh', border: 'none' }}
        title="Budget"
      />
    </PageContainer>
  );
};
