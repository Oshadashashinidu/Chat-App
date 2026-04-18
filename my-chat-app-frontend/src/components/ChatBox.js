import { useEffect, useState } from 'react';
import socket, { connectSocket } from '../socket';

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:3000';

function ChatBox({ username, token, userId }) {
  const [activeTab, setActiveTab] = useState('private');
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState('');
  const [search, setSearch] = useState('');
  const [users, setUsers] = useState([]);
  const [conversations, setConversations] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [privateText, setPrivateText] = useState('');
  const [privateThreads, setPrivateThreads] = useState({});
  const [unreadCounts, setUnreadCounts] = useState({});
  const [groupUnreadCounts, setGroupUnreadCounts] = useState({});
  const [incomingPopup, setIncomingPopup] = useState(null);
  const [searchError, setSearchError] = useState('');
  const [groups, setGroups] = useState([]);
  const [selectedGroup, setSelectedGroup] = useState(null);
  const [groupMessagesById, setGroupMessagesById] = useState({});
  const [groupText, setGroupText] = useState('');
  const [showCreateGroup, setShowCreateGroup] = useState(false);
  const [groupName, setGroupName] = useState('');
  const [groupMembers, setGroupMembers] = useState([]);
  const [selectedChatType, setSelectedChatType] = useState('private');

  const loadUsersForGroup = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/users/search?q=`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      const payload = await response.json();
      if (!response.ok) {
        throw new Error(payload.error || 'Failed to load users');
      }

      setUsers(payload.users || []);
    } catch (error) {
      setSearchError(error.message);
    }
  };

  const upsertConversation = (user, lastMessage, lastMessageAt) => {
    setConversations((prev) => {
      const existing = prev.filter((item) => String(item.id) !== String(user.id));
      return [
        {
          id: user.id,
          name: user.name,
          email: user.email || '',
          lastMessage,
          lastMessageAt
        },
        ...existing
      ];
    });
  };

  const loadConversations = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/private-messages/conversations`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      const payload = await response.json();

      if (!response.ok) {
        throw new Error(payload.error || 'Failed to load conversations');
      }

      setConversations(payload.conversations || []);
    } catch (error) {
      setSearchError(error.message);
    }
  };

  const loadGroups = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/groups`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      const payload = await response.json();

      if (!response.ok) {
        throw new Error(payload.error || 'Failed to load groups');
      }

      setGroups(payload.groups || []);
    } catch (error) {
      setSearchError(error.message);
    }
  };

  useEffect(() => {
    loadConversations();
    loadGroups();
  }, [token]);

  useEffect(() => {
    connectSocket(token);

    socket.on('chat:history', (history) => setMessages(history));
    socket.on('chat:message', (message) => {
      setMessages((prev) => [...prev, message]);
    });

    socket.on('private:message', (message) => {
      const currentUserId = String(userId);
      const otherUserId =
        String(message.fromUserId) === currentUserId
          ? String(message.toUserId)
          : String(message.fromUserId);

      setPrivateThreads((prev) => ({
        ...prev,
        [otherUserId]: [...(prev[otherUserId] || []), message]
      }));

      const isMine = String(message.fromUserId) === currentUserId;
      const conversationUser = {
        id: Number(otherUserId),
        name: isMine ? message.toUserName || selectedUser?.name || 'User' : message.fromUserName,
        email: ''
      };

      upsertConversation(conversationUser, message.text, message.timestamp);

      const isIncoming = String(message.toUserId) === currentUserId;
      const isActiveConversation = selectedUser && String(selectedUser.id) === otherUserId && activeTab === 'private';

      if (isIncoming && !isActiveConversation) {
        setUnreadCounts((prev) => ({
          ...prev,
          [otherUserId]: (prev[otherUserId] || 0) + 1
        }));

        setIncomingPopup({
          fromUserName: message.fromUserName,
          text: message.text
        });

        setTimeout(() => {
          setIncomingPopup(null);
        }, 3000);
      }
    });

    socket.on('group:message', (message) => {
      const groupId = String(message.groupId);

      setGroupMessagesById((prev) => ({
        ...prev,
        [groupId]: [...(prev[groupId] || []), message]
      }));

      const isActiveGroup =
        activeTab === 'private' &&
        selectedChatType === 'group' &&
        selectedGroup &&
        String(selectedGroup.id) === groupId;

      if (!isActiveGroup) {
        setGroupUnreadCounts((prev) => ({
          ...prev,
          [groupId]: (prev[groupId] || 0) + 1
        }));
      }
    });

    return () => {
      socket.off('chat:history');
      socket.off('chat:message');
      socket.off('private:message');
      socket.off('group:message');
    };
  }, [token, userId, selectedUser, selectedGroup, activeTab, selectedChatType]);

  const sendMessage = (event) => {
    event.preventDefault();

    if (!text.trim()) {
      return;
    }

    socket.emit('chat:message', {
      user: username,
      text
    });

    setText('');
  };

  const searchUsers = async (event) => {
    event.preventDefault();
    setSearchError('');

    try {
      const response = await fetch(`${API_BASE_URL}/api/users/search?q=${encodeURIComponent(search)}`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      const payload = await response.json();

      if (!response.ok) {
        throw new Error(payload.error || 'User search failed');
      }

      setUsers(payload.users || []);
    } catch (error) {
      setSearchError(error.message);
    }
  };

  const openPrivateChat = async (user) => {
    setSelectedUser(user);
    setSelectedGroup(null);
    setSelectedChatType('private');
    setActiveTab('private');
    setUnreadCounts((prev) => ({
      ...prev,
      [String(user.id)]: 0
    }));

    try {
      const response = await fetch(`${API_BASE_URL}/api/private-messages/thread/${user.id}`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      const payload = await response.json();

      if (!response.ok) {
        throw new Error(payload.error || 'Failed to load private thread');
      }

      setPrivateThreads((prev) => ({
        ...prev,
        [String(user.id)]: payload.messages || []
      }));

      const last = (payload.messages || []).slice(-1)[0];
      upsertConversation(user, last?.text || '', last?.timestamp || new Date().toISOString());
    } catch (error) {
      setSearchError(error.message);
    }
  };

  const sendPrivateMessage = (event) => {
    event.preventDefault();

    if (!selectedUser || !privateText.trim()) {
      return;
    }

    socket.emit('private:message', {
      targetUserId: String(selectedUser.id),
      text: privateText,
      fromUserName: username,
      toUserName: selectedUser.name
    });

    setPrivateText('');
  };

  const toggleGroupMember = (memberId) => {
    setGroupMembers((prev) =>
      prev.includes(memberId) ? prev.filter((id) => id !== memberId) : [...prev, memberId]
    );
  };

  const createGroup = async (event) => {
    event.preventDefault();

    if (!groupName.trim() || groupMembers.length === 0) {
      setSearchError('Enter group name and select at least one member');
      return;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/api/groups`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          name: groupName,
          memberIds: groupMembers
        })
      });

      const payload = await response.json();

      if (!response.ok) {
        throw new Error(payload.error || 'Failed to create group');
      }

      setGroups((prev) => [payload.group, ...prev]);
      setGroupName('');
      setGroupMembers([]);
      setShowCreateGroup(false);
      setSearchError('');
      loadGroups();
    } catch (error) {
      setSearchError(error.message);
    }
  };

  const openGroupChat = async (group) => {
    setSelectedGroup(group);
    setSelectedUser(null);
    setSelectedChatType('group');
    setGroupUnreadCounts((prev) => ({
      ...prev,
      [String(group.id)]: 0
    }));

    try {
      const response = await fetch(`${API_BASE_URL}/api/groups/${group.id}/messages`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      const payload = await response.json();

      if (!response.ok) {
        throw new Error(payload.error || 'Failed to load group messages');
      }

      setGroupMessagesById((prev) => ({
        ...prev,
        [String(group.id)]: payload.messages || []
      }));
    } catch (error) {
      setSearchError(error.message);
    }
  };

  const sendGroupMessage = (event) => {
    event.preventDefault();

    if (!selectedGroup || !groupText.trim()) {
      return;
    }

    socket.emit('group:message', {
      groupId: selectedGroup.id,
      text: groupText
    });

    setGroupText('');
  };

  const currentPrivateMessages = selectedUser ? privateThreads[String(selectedUser.id)] || [] : [];
  const currentGroupMessages = selectedGroup ? groupMessagesById[String(selectedGroup.id)] || [] : [];

  const privateUsers = search.trim() ? users : conversations;
  const privateList = [
    ...groups.map((group) => ({
      id: `group-${group.id}`,
      isGroup: true,
      group
    })),
    ...privateUsers.map((user) => ({
      id: `user-${user.id}`,
      isGroup: false,
      user
    }))
  ];

  return (
    <div className="chat-shell">
      {incomingPopup && (
        <div className="incoming-popup">
          <strong>{incomingPopup.fromUserName}</strong>
          <span>{incomingPopup.text}</span>
        </div>
      )}

      <section className="chat-main chat-main-full">
        <div className="chat-topbar tabs-only">
          <div className="chat-tabs">
            <button
              type="button"
              className={activeTab === 'private' ? 'active' : ''}
              onClick={() => setActiveTab('private')}
            >
              Private Chat
            </button>
            <button
              type="button"
              className={activeTab === 'public' ? 'active' : ''}
              onClick={() => setActiveTab('public')}
            >
              Public Chat
            </button>
          </div>
        </div>

        {activeTab === 'private' ? (
          <div className="private-layout">
            <aside className="chat-sidebar">
              <div className="messages-header">
                <h2>Messages</h2>
                <button
                  type="button"
                  className="create-group-btn"
                  onClick={() => {
                    setShowCreateGroup((prev) => !prev);
                    loadUsersForGroup();
                  }}
                >
                  Create Group
                </button>
              </div>

              <form onSubmit={searchUsers} className="search-form dark">
                <input
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Search user by name"
                />
                <button type="submit">Search</button>
              </form>

              {showCreateGroup && (
                <form onSubmit={createGroup} className="create-group-form">
                  <input
                    value={groupName}
                    onChange={(event) => setGroupName(event.target.value)}
                    placeholder="Group name"
                  />
                  <p>Select members</p>
                  <div className="group-members-list">
                    {users.map((user) => (
                      <label key={user.id}>
                        <input
                          type="checkbox"
                          checked={groupMembers.includes(user.id)}
                          onChange={() => toggleGroupMember(user.id)}
                        />
                        <span>{user.name}</span>
                      </label>
                    ))}
                  </div>
                  <button type="submit">Create</button>
                </form>
              )}

              {searchError && <p className="auth-error">{searchError}</p>}

              <ul className="users-list dark">
                {privateList.map((entry) => {
                  if (entry.isGroup) {
                    const group = entry.group;
                    return (
                      <li key={entry.id}>
                        <button
                          type="button"
                          className={selectedGroup?.id === group.id ? 'active' : ''}
                          onClick={() => openGroupChat(group)}
                        >
                          <span>{group.name}</span>
                          <small>{(group.members || []).length} members</small>
                          {(groupUnreadCounts[String(group.id)] || 0) > 0 && (
                            <em className="unread-badge">{groupUnreadCounts[String(group.id)]}</em>
                          )}
                        </button>
                      </li>
                    );
                  }

                  const user = entry.user;
                  return (
                    <li key={entry.id}>
                      <button
                        type="button"
                        className={selectedUser?.id === user.id ? 'active' : ''}
                        onClick={() => openPrivateChat(user)}
                      >
                        <span>{user.name}</span>
                        <small>{search.trim() ? user.email : user.lastMessage || user.email}</small>
                        {(unreadCounts[String(user.id)] || 0) > 0 && (
                          <em className="unread-badge">{unreadCounts[String(user.id)]}</em>
                        )}
                      </button>
                    </li>
                  );
                })}
              </ul>
            </aside>

            <div className="chat-conversation">
            <div className="chat-title">
              {selectedChatType === 'group' && selectedGroup ? (
                <>
                  <h3>{selectedGroup.name}</h3>
                  <p>Group chat (members only)</p>
                  <p>
                    Members:{' '}
                    {(selectedGroup.members || [])
                      .map((member) => member.name)
                      .join(', ') || 'No members'}
                  </p>
                </>
              ) : selectedUser ? (
                <>
                  <h3>{selectedUser.name}</h3>
                  <p>Private conversation</p>
                </>
              ) : (
                <>
                  <h3>Private Chat</h3>
                  <p>Select a user from the left list</p>
                </>
              )}
            </div>

            <ul className="messages-list dark">
              {selectedChatType === 'group' && selectedGroup
                ? currentGroupMessages.map((message) => {
                    const isMine = Number(message.senderId) === Number(userId);
                    return (
                      <li key={`${message.id}-${message.timestamp}`} className={isMine ? 'mine' : 'theirs'}>
                        <strong>{message.senderName}</strong>
                        <span>{message.text}</span>
                      </li>
                    );
                  })
                : currentPrivateMessages.map((message) => {
                    const isMine = String(message.fromUserId) === String(userId);
                    return (
                      <li key={`${message.id}-${message.timestamp}`} className={isMine ? 'mine' : 'theirs'}>
                        <span>{message.text}</span>
                      </li>
                    );
                  })}
            </ul>

            {selectedChatType === 'group' ? (
              <form onSubmit={sendGroupMessage} className="chat-form dark">
                <input
                  value={groupText}
                  onChange={(event) => setGroupText(event.target.value)}
                  placeholder={selectedGroup ? 'Type group message' : 'Select a group first'}
                  disabled={!selectedGroup}
                />
                <button type="submit" disabled={!selectedGroup}>
                  Send
                </button>
              </form>
            ) : (
              <form onSubmit={sendPrivateMessage} className="chat-form dark">
                <input
                  value={privateText}
                  onChange={(event) => setPrivateText(event.target.value)}
                  placeholder={selectedUser ? 'Type a private message' : 'Select a user first'}
                  disabled={!selectedUser}
                />
                <button type="submit" disabled={!selectedUser}>
                  Send
                </button>
              </form>
            )}
            </div>
          </div>
        ) : (
          activeTab === 'public' ? (
          <>
            <div className="chat-title">
              <h3>Public Chat Room</h3>
              <p>Visible to all connected users</p>
            </div>

            <ul className="messages-list dark">
              {messages.map((message) => {
                const isMine = message.user === username;
                return (
                  <li key={`${message.id}-${message.timestamp}`} className={isMine ? 'mine' : 'theirs'}>
                    <strong>{message.user}</strong>
                    <span>{message.text}</span>
                  </li>
                );
              })}
            </ul>

            <form onSubmit={sendMessage} className="chat-form dark">
              <input
                value={text}
                onChange={(event) => setText(event.target.value)}
                placeholder="Type a public message"
              />
              <button type="submit">Send</button>
            </form>
          </>
          ) : null
        )}
      </section>
    </div>
  );
}

export default ChatBox;
