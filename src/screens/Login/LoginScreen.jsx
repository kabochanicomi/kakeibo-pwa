import { useState } from 'react';
import { auth } from '../../firebase';
import { signInWithEmailAndPassword } from 'firebase/auth';

function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleLogin = async () => {
    try {
      await signInWithEmailAndPassword(auth, email, password);
    } catch (error) {
      let message = "エラーが発生しました。";
      if (error.code === 'auth/user-not-found') message = "ユーザーが見つかりません。";
      if (error.code === 'auth/wrong-password') message = "パスワードが違います。";
      if (error.code === 'auth/invalid-email') message = "メールアドレスの形式が正しくありません。";
      if (error.code === 'auth/invalid-credential') message = "メールアドレスまたはパスワードが違います。";
      alert(message);
    }
  };

  return (
    <div style={{ 
      display: 'flex', 
      flexDirection: 'column', 
      alignItems: 'center', 
      justifyContent: 'center', 
      height: '100%', 
      backgroundColor: '#f8f9fa',
      padding: '0 20px'
    }}>
      <div style={{ marginBottom: '40px', textAlign: 'center' }}>
        <h1 style={{ color: '#ff69b4', fontSize: '28px', fontWeight: 'bold', margin: 0 }}>
          家計簿
        </h1>
        <p style={{ color: '#888', marginTop: '10px' }}>家族でつくる、シンプル家計簿</p>
      </div>

      <div style={{ 
        width: '100%', 
        maxWidth: '320px', 
        display: 'flex', 
        flexDirection: 'column', 
        gap: '15px' 
      }}>
        {/* fontSizeはApp.cssで指定済みなので不要 */}
        <input 
          type="email" 
          placeholder="メールアドレス" 
          value={email} 
          onChange={(e) => setEmail(e.target.value)} 
          style={{ 
            padding: '15px', 
            borderRadius: '10px', 
            border: '1px solid #ddd', 
            outline: 'none'
          }} 
        />
        <input 
          type="password" 
          placeholder="パスワード" 
          value={password} 
          onChange={(e) => setPassword(e.target.value)} 
          style={{ 
            padding: '15px', 
            borderRadius: '10px', 
            border: '1px solid #ddd', 
            outline: 'none'
          }} 
        />
        
        <button
          onClick={handleLogin}
          style={{
            padding: '15px',
            backgroundColor: '#ff69b4',
            color: 'white',
            border: 'none',
            borderRadius: '10px',
            fontWeight: 'bold',
            marginTop: '10px',
            boxShadow: '0 4px 6px rgba(255, 105, 180, 0.2)'
          }}
        >
          ログイン
        </button>
      </div>

      <div style={{ position: 'absolute', bottom: '30px', color: '#ccc', fontSize: '12px' }}>
        v1.0.0
      </div>
    </div>
  );
}

export default LoginScreen;