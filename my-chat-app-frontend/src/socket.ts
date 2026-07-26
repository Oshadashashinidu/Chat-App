import { io } from 'socket.io-client';

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:3000';
const socket = io(API_BASE_URL, {
	autoConnect: false
});

export const connectSocket = (token: string) => {
	socket.auth = { token };

	if (!socket.connected) {
		socket.connect();
	}

	return socket;
};

export const disconnectSocket = () => {
	if (socket.connected) {
		socket.disconnect();
	}
};

export default socket;
