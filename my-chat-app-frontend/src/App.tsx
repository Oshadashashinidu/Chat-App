import { useMemo, useState } from 'react';
import ChatBox from './components/ChatBox';
import AuthPanel from './components/AuthPanel';
import { disconnectSocket } from './socket';
import type { AuthSession } from './types';
import './App.css';

function App() {
  const [session, setSession] = useState<AuthSession | null>(() => {
    const raw = localStorage.getItem('chat-auth-session');
    return raw ? (JSON.parse(raw) as AuthSession) : null;
  });

  const username = useMemo(() => session?.user?.name || 'Anonymous', [session]);

  const handleAuthenticated = (authPayload: AuthSession) => {
    localStorage.setItem('chat-auth-session', JSON.stringify(authPayload));
    setSession(authPayload);
  };

  const logout = () => {
    disconnectSocket();
    localStorage.removeItem('chat-auth-session');
    setSession(null);
  };

  return (
    <div className={`app ${!session ? 'app-auth' : 'app-chat'}`}>

      {!session ? (
        <AuthPanel onAuthenticated={handleAuthenticated} />
      ) : (
        <div className="signed-chat-layout">
          <div className="session-bar">
            <div className="session-avatar">{username.charAt(0).toUpperCase()}</div>
            <p>
              Signed in as <strong>{username}</strong>
            </p>
            <button type="button" onClick={logout}>
              Logout
            </button>
          </div>
          <ChatBox username={username} token={session.token} userId={session.user.id} />
        </div>
      )}
    </div>
  );
}

export default App;
