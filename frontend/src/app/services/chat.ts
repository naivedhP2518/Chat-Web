import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { io, Socket } from 'socket.io-client';

const API_URL = 'http://localhost:5000/api/messages';
const SOCKET_URL = 'http://localhost:5000';

@Injectable({
  providedIn: 'root',
})
export class ChatService {
  private socket!: Socket;

  constructor(private http: HttpClient) {}

  // Initialize socket connection with userId
  connect(userId: string): void {
    this.socket = io(SOCKET_URL);
    this.socket.emit('userOnline', userId);
  }

  disconnect(): void {
    if (this.socket) {
      this.socket.disconnect();
    }
  }

  // Send a private message via socket
  sendMessage(data: { senderId: string; receiverId: string; message: string; senderName: string }): void {
    this.socket.emit('sendMessage', data);
  }

  // Listen for incoming messages
  onMessage(callback: (data: any) => void): void {
    this.socket.on('receiveMessage', callback);
  }

  // Typing indicators
  emitTyping(data: { senderId: string; receiverId: string }): void {
    this.socket.emit('typing', data);
  }

  emitStopTyping(data: { senderId: string; receiverId: string }): void {
    this.socket.emit('stopTyping', data);
  }

  onTyping(callback: (data: any) => void): void {
    this.socket.on('typing', callback);
  }

  onStopTyping(callback: (data: any) => void): void {
    this.socket.on('stopTyping', callback);
  }

  // Online users
  onOnlineUsers(callback: (users: string[]) => void): void {
    this.socket.on('onlineUsers', callback);
  }

  // REST API — get conversation history
  getHistory(userId: string, token: string): Observable<any[]> {
    return this.http.get<any[]>(`${API_URL}/${userId}`, {
      headers: new HttpHeaders({ Authorization: `Bearer ${token}` }),
    });
  }

  // REST API — persist message to DB
  saveMessage(data: { receiver: string; message: string }, token: string): Observable<any> {
    return this.http.post(API_URL, data, {
      headers: new HttpHeaders({ Authorization: `Bearer ${token}` }),
    });
  }
}
