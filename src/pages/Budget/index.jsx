import { PageContainer } from '@ant-design/pro-components';

export default () => {
  return (
    <PageContainer title={false}>
      <iframe
        src="https://budget.mylabcdd.top:30046/"
        style={{ width: '100%', height: '80vh', border: 'none' }}
        title="Budget"
      />
    </PageContainer>
  );
};
