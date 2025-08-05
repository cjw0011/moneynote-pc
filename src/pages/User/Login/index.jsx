import {useRef} from "react";
import {SelectLang, Helmet} from '@umijs/max';
import {LockOutlined, UserOutlined} from '@ant-design/icons';
import {LoginForm, ProFormCheckbox, ProFormText} from '@ant-design/pro-components';
import Settings from '../../../../config/defaultSettings';
import { login, wxLoginUrl } from '@/services/user';
import { requiredRules } from '@/utils/rules';
import Footer from '@/components/Footer';
import t from '@/utils/i18n';
import styles from '../index.less';


export default () => {

  const formRef = useRef();

  const handleSubmit = async (values) => {
    const response = await login({ ...values });
    localStorage.setItem('accessToken', response.data.accessToken);
    localStorage.setItem('refreshToken', response.data.refreshToken);
    sessionStorage.setItem('accessToken', response.data.accessToken);
    sessionStorage.setItem('refreshToken', response.data.refreshToken);
    setTimeout(() => {
      window.location.href = '/';
    }, 300);
  };

  const windowRef = useRef(null);
  const handleWechat = async () => {
    const response = await wxLoginUrl();
    if (response.success) {
      window.removeEventListener('message', handleMessage, false);
      if (windowRef.current) {
        windowRef.current.close();
      }
      window.addEventListener('message', handleMessage, false);
      windowRef.current = window.open(
        response.data,
        '_blank',
        'top=150,left=300,width=600,height=500'
      );
      let intervalId = window.setInterval(() => {
        if (windowRef.current?.closed) {
          clearInterval(intervalId);
          window.removeEventListener('message', handleMessage, false);
        }
      }, 2000);
    }
  }
  const handleMessage = (e) => {
    if (e.origin !== window.location.origin) return;

    if (windowRef.current) {
      windowRef.current.close();
    }
    if (formRef.current?.getFieldValue('remember')) {
      if (typeof e.data === 'string') {
        localStorage.setItem('accessToken', e.data);
        sessionStorage.setItem('accessToken', e.data);
      } else {
        localStorage.setItem('accessToken', e.data.accessToken);
        sessionStorage.setItem('accessToken', e.data.accessToken);
        if (e.data.refreshToken) {
          localStorage.setItem('refreshToken', e.data.refreshToken);
          sessionStorage.setItem('refreshToken', e.data.refreshToken);
        }
      }
    }
    window.location.href = '/report';
  }

  // const handleWechat2 = async () => {
  //   show(<WxLoginModal />)
  // }

  return (
    <div className={styles.container}>
      <Helmet>
        <title>
          {t('menu.login')}
          - {Settings.title}
        </title>
      </Helmet>
      <div className={styles.lang} data-lang>
        {SelectLang && <SelectLang />}
      </div>
      <div className={styles.content}>
        <LoginForm
          formRef={formRef}
          logo={<img alt="logo" src="/logo.svg" />}
          title="MoneyNote"
          subTitle=" "
          initialValues={{
            remember: false,
          }}
          onFinish={async (values) => {
            await handleSubmit(values);
          }}
        >
          <ProFormText
            name="username"
            fieldProps={{
              size: 'large',
              prefix: <UserOutlined className={styles.prefixIcon} />,
            }}
            rules={requiredRules()}
            placeholder={t('username.placeholder')}
          />
          <ProFormText.Password
            name="password"
            fieldProps={{
              size: 'large',
              prefix: <LockOutlined className={styles.prefixIcon} />,
            }}
            rules={requiredRules()}
            placeholder={t('password.placeholder')}
          />
          <div style={{ marginBottom: 24 }}>
            <ProFormCheckbox noStyle name="remember">{t('login.remember')}</ProFormCheckbox>
          </div>
        </LoginForm>
        <div className={styles.loginFormAction}>
          {/*<Button type="link" icon={<WechatOutlined />} onClick={handleWechat}>{t('wechat.login')}</Button>*/}
          <a href="/user/register">{t('register.account')}</a>
        </div>
      </div>
      <Footer />
    </div>
  );
};
