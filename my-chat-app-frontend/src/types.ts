export type AuthMode = 'login' | 'signup';
export type ActiveTab = 'private' | 'public';
export type SelectedChatType = 'private' | 'group';

export interface User {
  id: number;
  name: string;
  email: string;
}

export interface AuthUser extends User {
  phone: string;
}

export interface AuthSession {
  token: string;
  user: AuthUser;
}

export interface PublicMessage {
  id: number;
  user: string;
  text: string;
  timestamp: string;
}

export interface PrivateMessage {
  id: number;
  text: string;
  fromUserId: number | string;
  fromUserName: string;
  toUserId: number | string;
  toUserName?: string;
  timestamp: string;
}

export interface Conversation extends User {
  lastMessage?: string;
  lastMessageAt?: string;
}

export interface GroupMember extends User {}

export interface ChatGroup {
  id: number;
  name: string;
  createdAt?: string;
  members?: GroupMember[];
}

export interface GroupMessage {
  id: number;
  groupId: number | string;
  senderId: number | string;
  senderName: string;
  text: string;
  timestamp: string;
}

export interface IncomingPopup {
  fromUserName: string;
  text: string;
}
