import { useMemo, useState } from 'react';
import ChatBox from './components/ChatBox';
import AuthPanel from './components/AuthPanel';
import { disconnectSocket } from './socket';
import './App.css';

function App() {
  const [session, setSession] = useState(() => {
    const raw = localStorage.getItem('chat-auth-session');
    return raw ? JSON.parse(raw) : null;
  });

  const username = useMemo(() => session?.user?.name || 'Anonymous', [session]);

  const handleAuthenticated = (authPayload) => {
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
        <>
          <div className="session-bar">
            <p>
              Signed in as <strong>{username}</strong>
            </p>
            <button type="button" onClick={logout}>
              Logout
            </button>
          </div>
          <ChatBox username={username} token={session.token} userId={session.user.id} />
        </>
      )}
    </div>
  );
}

export default App;
