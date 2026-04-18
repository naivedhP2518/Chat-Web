import {
  Component, OnInit, OnDestroy, ViewChild, ElementRef,
  AfterViewChecked, HostListener
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { forkJoin, timer } from 'rxjs';
import { map, finalize, delay, switchMap } from 'rxjs/operators';
import { AuthService } from '../../services/auth';
import { ChatService } from '../../services/chat';
import { ThemeService } from '../../services/theme';

@Component({
  selector: 'app-chat',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './chat.html',
  styleUrls: ['./chat.css'],
})
export class ChatComponent implements OnInit, OnDestroy, AfterViewChecked {
  @ViewChild('messagesContainer') messagesContainer!: ElementRef;
  @ViewChild('fileInput') fileInput!: ElementRef<HTMLInputElement>;

  users: any[] = [];
  onlineUsers: Set<string> = new Set();
  selectedUser: any = null;
  messages: any[] = [];
  newMessage = '';
  currentUser: any = null;
  isTyping = false;
  typingTimeout: any;
  private shouldScrollToBottom = false;

  // Panel states
  showEmojiPanel = false;
  showMenu = false;
  activeCategory = 0;
  isMobileSidebarOpen = false;
  searchQuery = '';
  isLoading = false;
  
  // Message actions state
  activeMenuMessageId: string | null = null;
  replyingTo: any = null;

  emojiCategories = [
    {
      label: 'Smileys', icon: '\uD83D\uDE00',
      emojis: [
        '\uD83D\uDE00','\uD83D\uDE01','\uD83D\uDE02','\uD83E\uDD23','\uD83D\uDE04','\uD83D\uDE05','\uD83D\uDE06','\uD83D\uDE07',
        '\uD83D\uDE08','\uD83D\uDE09','\uD83D\uDE0A','\uD83D\uDE0B','\uD83D\uDE0C','\uD83D\uDE0D','\uD83D\uDE0E','\uD83D\uDE0F',
        '\uD83D\uDE10','\uD83D\uDE11','\uD83D\uDE12','\uD83D\uDE13','\uD83D\uDE14','\uD83D\uDE15','\uD83D\uDE16','\uD83D\uDE17',
        '\uD83D\uDE18','\uD83D\uDE19','\uD83D\uDE1A','\uD83D\uDE1B','\uD83D\uDE1C','\uD83D\uDE1D','\uD83D\uDE1E','\uD83D\uDE1F',
        '\uD83D\uDE20','\uD83D\uDE21','\uD83D\uDE22','\uD83D\uDE23','\uD83D\uDE24','\uD83D\uDE25','\uD83D\uDE26','\uD83D\uDE27',
        '\uD83D\uDE28','\uD83D\uDE29','\uD83D\uDE2A','\uD83D\uDE2B','\uD83D\uDE2C','\uD83D\uDE2D','\uD83D\uDE2E','\uD83D\uDE34',
        '\uD83E\uDD70','\uD83E\uDD73','\uD83E\uDD7A','\uD83E\uDD29','\uD83E\uDD2A','\uD83E\uDD2B','\uD83E\uDD2C','\uD83E\uDD2D',
        '\uD83E\uDD14','\uD83E\uDD17','\uD83E\uDD10','\uD83D\uDE37','\uD83E\uDD12','\uD83E\uDD15','\uD83E\uDD11','\uD83E\uDD20',
      ],
    },
    {
      label: 'Gestures', icon: '\uD83D\uDC4D',
      emojis: [
        '\uD83D\uDC4D','\uD83D\uDC4E','\uD83D\uDC4C','\uD83D\uDC48','\uD83D\uDC49','\uD83D\uDC46','\uD83D\uDC47','\uD83D\uDC4B',
        '\uD83D\uDC4F','\uD83D\uDE4C','\uD83E\uDD1D','\uD83D\uDE4F','\uD83D\uDCAA','\uD83D\uDD90','\u270B','\u270A',
        '\uD83D\uDC4A','\uD83D\uDD96','\uD83E\uDD1E','\uD83E\uDD1F','\uD83E\uDD18','\uD83E\uDD19','\uD83E\uDD1C','\uD83E\uDD1B',
        '\uD83E\uDD1A','\uD83E\uDD33','\uD83D\uDC85','\uD83E\uDD32','\uD83E\uDD26','\uD83E\uDD37','\uD83D\uDE4B','\uD83D\uDE4A',
        '\uD83D\uDE47','\uD83D\uDE45','\uD83D\uDE46','\uD83D\uDC81','\uD83D\uDE4D','\uD83D\uDE4E','\uD83D\uDEB6','\uD83C\uDFC3',
      ],
    },
    {
      label: 'Hearts', icon: '\uD83D\uDC93',
      emojis: [
        '\uD83D\uDC93','\uD83E\uDDE1','\uD83D\uDC9B','\uD83D\uDC9A','\uD83D\uDC99','\uD83D\uDC9C','\uD83D\uDDA4','\uD83E\uDD0D',
        '\uD83E\uDD0E','\uD83D\uDC94','\uD83D\uDC95','\uD83D\uDC9E','\u2764','\uD83D\uDC97','\uD83D\uDC96','\uD83D\uDC98',
        '\uD83D\uDC9D','\uD83D\uDC9F','\uD83D\uDC8B','\uD83D\uDC44','\uD83D\uDC8C','\uD83D\uDC8F','\uD83D\uDC91','\uD83E\uDEC2',
        '\uD83D\uDCEF','\uD83D\uDCAF','\u2605','\u2606','\u2728','\uD83C\uDF1F','\u2705','\u274C',
      ],
    },
    {
      label: 'Fun', icon: '\uD83C\uDF89',
      emojis: [
        '\uD83C\uDF89','\uD83C\uDF8A','\uD83C\uDF88','\uD83C\uDF81','\uD83C\uDF80','\uD83C\uDFC6','\uD83E\uDD47','\uD83E\uDD48',
        '\uD83E\uDD49','\uD83C\uDFC5','\uD83C\uDFAA','\uD83C\uDFAD','\uD83C\uDFA8','\uD83C\uDFAC','\uD83C\uDFA4','\uD83C\uDFA7',
        '\uD83C\uDFBC','\uD83C\uDFB5','\uD83C\uDFB6','\uD83C\uDFB7','\uD83C\uDFB8','\uD83C\uDFB9','\uD83C\uDFBA','\uD83C\uDFBB',
        '\uD83E\uDD41','\uD83C\uDFAE','\uD83C\uDFB2','\uD83C\uDFAF','\uD83C\uDFB3','\uD83D\uDD2E','\uD83C\uDFB1','\uD83C\uDCCF',
        '\uD83C\uDC04','\uD83C\uDFB4','\uD83C\uDFA0','\uD83C\uDFA1','\uD83C\uDE00','\uD83C\uDE01','\uD83C\uDE36','\uD83C\uDF0A',
      ],
    },
    {
      label: 'Objects', icon: '\uD83D\uDCA1',
      emojis: [
        '\uD83D\uDCA1','\uD83D\uDD26','\uD83D\uDCBB','\uD83D\uDCF1','\uD83D\uDCDE','\uD83D\uDCF7','\uD83D\uDCF8','\uD83D\uDCF9',
        '\uD83D\uDCFA','\uD83D\uDCFB','\uD83D\uDD0B','\uD83D\uDD0C','\uD83D\uDCBE','\uD83D\uDCBF','\uD83E\uDDF2','\uD83D\uDD2D',
        '\uD83D\uDD2C','\uD83D\uDC8A','\uD83E\uDE79','\uD83D\uDE80','\u2708','\uD83D\uDE97','\uD83D\uDEB5','\uD83D\uDEB2',
        '\u26A1','\uD83D\uDD25','\uD83D\uDCA5','\uD83C\uDF0A','\uD83C\uDF3A','\uD83C\uDF3B','\uD83C\uDF40','\uD83C\uDF39',
        '\uD83C\uDF19','\u2600','\u2B50','\uD83C\uDF08','\u2744','\uD83C\uDF0D','\uD83C\uDF0F','\uD83C\uDF0E',
      ],
    },
  ];
  get activeEmojis(): string[] {
    return this.emojiCategories[this.activeCategory]?.emojis ?? [];
  }

  setCategory(index: number, event: MouseEvent): void {
    event.stopPropagation();
    this.activeCategory = index;
  }

  constructor(
    private authService: AuthService,
    private chatService: ChatService,
    private router: Router,
    public themeService: ThemeService
  ) {}

  // Close panels when clicking outside
  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    const target = event.target as HTMLElement;
    if (!target.closest('.emoji-panel-wrap')) this.showEmojiPanel = false;
    if (!target.closest('.menu-wrap')) this.showMenu = false;
    if (!target.closest('.msg-bubble-wrapper')) this.activeMenuMessageId = null;
  }

  ngOnInit(): void {
    if (!this.authService.isLoggedIn()) {
      this.router.navigate(['/login']);
      return;
    }

    this.currentUser = this.authService.getCurrentUser();
    this.chatService.connect(this.currentUser.id);
    this.loadConversationSummaries();

    this.chatService.onMessage((data: any) => {
      // Message format from backend populated object:
      const formattedData = {
        _id: data._id,
        senderId: data.sender._id || data.sender,
        senderName: data.sender.username || data.sender,
        receiverId: data.receiver._id || data.receiver,
        message: data.message,
        replyTo: data.replyTo,
        replyToId: data.replyTo?._id || data.replyTo,
        createdAt: data.createdAt,
      };

      this.upsertConversationPreview(formattedData);

      if (
        this.selectedUser &&
        (formattedData.senderId === this.selectedUser._id || formattedData.receiverId === this.selectedUser._id)
      ) {
        // Avoid duplicates if for some reason the REST response also tries to push (though we removed that)
        if (!this.messages.some(m => m._id === formattedData._id)) {
          this.messages.push(formattedData);
          this.shouldScrollToBottom = true;
        }
      }
    });

    this.chatService.onOnlineUsers((users: string[]) => {
      this.onlineUsers = new Set(users);
    });

    this.chatService.onMessageDeleted((data: { messageId: string }) => {
      this.messages = this.messages.filter(m => m._id !== data.messageId);
      this.loadConversationSummaries();
    });

    this.chatService.onTyping((data: any) => {
      if (this.selectedUser && data.senderId === this.selectedUser._id) {
        this.isTyping = true;
      }
    });

    this.chatService.onStopTyping((data: any) => {
      if (this.selectedUser && data.senderId === this.selectedUser._id) {
        this.isTyping = false;
      }
    });
  }

  ngAfterViewChecked(): void {
    if (this.shouldScrollToBottom) {
      this.scrollToBottom();
      this.shouldScrollToBottom = false;
    }
  }

  ngOnDestroy(): void {
    this.chatService.disconnect();
  }

  selectUser(user: any): void {
    this.selectedUser = user;
    this.messages = [];
    this.isTyping = false;
    this.showEmojiPanel = false;
    this.showMenu = false;
    this.isMobileSidebarOpen = false; // Close sidebar on mobile when selecting user

    const token = this.authService.getToken()!;
    this.chatService.getHistory(user._id, token).subscribe({
      next: (msgs) => {
        this.messages = msgs.map((m: any) => ({
          _id: m._id,
          senderId: m.sender._id || m.sender,
          senderName: m.sender.username || m.sender,
          receiverId: m.receiver._id || m.receiver,
          message: m.message,
          replyTo: m.replyTo,
          replyToId: m.replyTo?._id || m.replyTo, // Store the ID even if populate fails in future
          isDeleted: m.isDeleted,
          createdAt: m.createdAt,
        }));
        this.updateSelectedConversationFromMessages();
        this.shouldScrollToBottom = true;
      },
      error: (err) => console.error('Failed to load history', err),
    });
  }

  hasReplyId(msg: any): boolean {
    return !!msg.replyToId;
  }

  sendMessage(): void {
    const msg = this.newMessage.trim();
    if (!msg || !this.selectedUser) return;

    const token = this.authService.getToken()!;
    
    // We only call saveMessage (REST). 
    // The backend will broadcast back to us via Socket.IO once saved with an ID.
    this.chatService.saveMessage({
      receiver: this.selectedUser._id,
      message: msg,
      replyTo: this.replyingTo?._id 
    }, token).subscribe({
      next: (savedMsg) => {
        // Message will arrive via chatService.onMessage
        console.log('Message sent and saved:', savedMsg._id);
        this.loadConversationSummaries();
      },
      error: (err) => console.error('Failed to send message', err)
    });

    this.newMessage = '';
    this.replyingTo = null;
    this.showEmojiPanel = false;
    this.chatService.emitStopTyping({ senderId: this.currentUser.id, receiverId: this.selectedUser._id });
  }

  onTyping(): void {
    if (!this.selectedUser) return;
    this.chatService.emitTyping({ senderId: this.currentUser.id, receiverId: this.selectedUser._id });

    clearTimeout(this.typingTimeout);
    this.typingTimeout = setTimeout(() => {
      this.chatService.emitStopTyping({ senderId: this.currentUser.id, receiverId: this.selectedUser._id });
    }, 1500);
  }

  // ── Attach button ──
  triggerFileInput(event: MouseEvent): void {
    event.stopPropagation();
    this.fileInput.nativeElement.click();
  }

  onFileSelected(event: Event): void {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (!file || !this.selectedUser) return;

    // Send filename as a message (file sharing placeholder)
    const fileMsg = `📎 ${file.name} (${(file.size / 1024).toFixed(1)} KB)`;
    this.newMessage = fileMsg;
    this.sendMessage();

    // Reset input so same file can be re-selected
    (event.target as HTMLInputElement).value = '';
  }

  // ── Emoji picker ──
  toggleEmojiPanel(event: MouseEvent): void {
    event.stopPropagation();
    this.showEmojiPanel = !this.showEmojiPanel;
    this.showMenu = false;
  }

  insertEmoji(emoji: string, event: MouseEvent): void {
    event.stopPropagation();
    this.newMessage += emoji;
    this.showEmojiPanel = false;
  }

  // ── Three-dot menu ──
  toggleMenu(event: MouseEvent): void {
    event.stopPropagation();
    this.showMenu = !this.showMenu;
    this.showEmojiPanel = false;
  }

  clearChat(): void {
    if (!this.selectedUser) return;
    const token = this.authService.getToken();
    if (token) {
      this.chatService.clearChatHistory(this.selectedUser._id, token).subscribe({
        next: () => {
          this.messages = [];
          this.updateConversationAfterClear(this.selectedUser._id);
          this.showMenu = false;
        },
        error: (err) => console.error('Error clearing chat history:', err)
      });
    } else {
      this.messages = [];
      this.showMenu = false;
    }
  }

  copyUsername(): void {
    navigator.clipboard.writeText(this.selectedUser?.username || '');
    this.showMenu = false;
  }

  // ── Message Specific Actions ──
  onMessageContextMenu(event: MouseEvent, msg: any): void {
    if (msg.isDeleted) return;
    event.preventDefault();
    this.activeMenuMessageId = msg._id;
  }

  toggleMessageMenu(event: MouseEvent, msg: any): void {
    event.stopPropagation();
    this.activeMenuMessageId = this.activeMenuMessageId === msg._id ? null : msg._id;
  }

  copyMessageText(msg: any): void {
    navigator.clipboard.writeText(msg.message);
    this.activeMenuMessageId = null;
  }

  replyToMessage(msg: any): void {
    this.replyingTo = {
      _id: msg._id,
      message: msg.message,
      senderName: msg.senderName || msg.sender?.username
    };
    this.activeMenuMessageId = null;
    // Focus input
    setTimeout(() => {
      const input = document.querySelector('.message-input') as HTMLInputElement;
      if (input) input.focus();
    }, 0);
  }

  cancelReply(): void {
    this.replyingTo = null;
  }

  deleteMessage(messageId: string): void {
    if (!messageId) return;
    console.log('Delete button clicked for message:', messageId);
    const token = this.authService.getToken()!;
    
    // We only call the API. 
    // The backend will broadcast 'messageDeleted' via socket once confirmed.
    this.chatService.deleteIndividualMessage(messageId, token).subscribe({
      next: (res) => {
        console.log('Message deletion request successful from server:', res);
        this.activeMenuMessageId = null;
        this.loadConversationSummaries();
      },
      error: (err) => {
        console.error('Failed to delete message at server level:', err);
        // Fallback UI cleanup if server fails but we want to be safe? 
        // No, stay consistent with backend-first.
      }
    });
  }

  scrollToMessage(messageId: string): void {
    const element = document.getElementById(`msg-${messageId}`);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'center' });
      element.classList.add('highlight-msg');
      setTimeout(() => element.classList.remove('highlight-msg'), 2000);
    }
  }

  // ── Helpers ──
  isOnline(userId: string): boolean {
    return this.onlineUsers.has(userId);
  }

  isMine(msg: any): boolean {
    return msg.senderId === this.currentUser.id;
  }

  getMessageStatus(msg: any): 'sent' | 'read' {
    if (!this.isMine(msg) || !this.selectedUser?._id) {
      return 'sent';
    }

    // Placeholder until the backend exposes persisted read receipts.
    return this.isOnline(this.selectedUser._id) ? 'read' : 'sent';
  }

  logout(): void {
    this.chatService.disconnect();
    this.authService.logout();
    this.router.navigate(['/login']);
  }

  toggleMobileSidebar(): void {
    this.isMobileSidebarOpen = !this.isMobileSidebarOpen;
  }

  private loadConversationSummaries(): void {
    const token = this.authService.getToken();
    if (!token) {
      this.logout();
      return;
    }

    this.isLoading = true;

    // Use pipe to ensure we wait at least 2 seconds for a smoother transition
    forkJoin({
      conversations: this.chatService.getConversations(token),
      users: this.authService.getUsers()
    }).pipe(
      // Ensure the skeleton is visible for at least 2 seconds (2000ms)
      switchMap(data => timer(2000).pipe(map(() => data))),
      finalize(() => this.isLoading = false)
    ).subscribe({
      next: ({ conversations, users }) => {
        const conversationMap = new Map(
          conversations.map((c: any) => [c._id, c])
        );

        this.users = users.map((user: any) => {
          const summary = conversationMap.get(user._id);
          return {
            ...user,
            lastMessage: summary?.lastMessage || 'No messages yet',
            lastMessageAt: summary?.lastMessageAt || null,
            lastMessageTime: this.formatConversationTime(summary?.lastMessageAt),
            unreadCount: summary?.unreadCount || 0,
          };
        });

        this.sortUsersByLatestActivity();

        // Auto-select the absolute latest conversation
        if (this.users.length > 0) {
          const latestUser = this.users[0];
          console.log('Auto-opening latest chat with:', latestUser.username);
          this.selectUser(latestUser);
        }
      },
      error: (err) => {
        console.error('Error loading sidebar data:', err);
        if (err.status === 401) {
          this.logout();
        }
      }
    });
  }

  private upsertConversationPreview(message: any): void {
    const otherUserId =
      message.senderId === this.currentUser.id ? message.receiverId : message.senderId;

    const userIndex = this.users.findIndex((user) => user._id === otherUserId);
    if (userIndex === -1) return;

    const updatedUser = {
      ...this.users[userIndex],
      lastMessage: message.message,
      lastMessageAt: message.createdAt,
      lastMessageTime: this.formatConversationTime(message.createdAt),
      unreadCount:
        message.senderId === this.currentUser.id
          ? this.users[userIndex].unreadCount || 0
          : ((this.users[userIndex].unreadCount || 0) + (this.selectedUser?._id === otherUserId ? 0 : 1)),
    };

    this.users = [
      updatedUser,
      ...this.users.filter((user) => user._id !== otherUserId),
    ];
  }

  private updateSelectedConversationFromMessages(): void {
    if (!this.selectedUser) return;

    const lastMessage = this.messages[this.messages.length - 1];
    const userIndex = this.users.findIndex((user) => user._id === this.selectedUser._id);
    if (userIndex === -1) return;

    const updatedUser = {
      ...this.users[userIndex],
      lastMessage: lastMessage?.message || 'No messages yet',
      lastMessageAt: lastMessage?.createdAt || null,
      lastMessageTime: this.formatConversationTime(lastMessage?.createdAt),
      unreadCount: 0,
    };

    this.users = [
      updatedUser,
      ...this.users.filter((user) => user._id !== this.selectedUser._id),
    ];
  }

  private updateConversationAfterClear(userId: string): void {
    this.users = this.users.map((user) =>
      user._id === userId
        ? {
            ...user,
            lastMessage: 'No messages yet',
            lastMessageAt: null,
            lastMessageTime: '',
            unreadCount: 0,
          }
        : user
    );
  }

  private sortUsersByLatestActivity(): void {
    this.users = [...this.users].sort((a, b) => {
      const timeA = a.lastMessageAt ? new Date(a.lastMessageAt).getTime() : 0;
      const timeB = b.lastMessageAt ? new Date(b.lastMessageAt).getTime() : 0;
      return timeB - timeA;
    });
  }

  private formatConversationTime(dateValue: string | null | undefined): string {
    if (!dateValue) return '';

    const date = new Date(dateValue);
    const now = new Date();

    const isSameDay =
      date.getFullYear() === now.getFullYear() &&
      date.getMonth() === now.getMonth() &&
      date.getDate() === now.getDate();

    if (isSameDay) {
      return date.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
    }

    const yesterday = new Date(now);
    yesterday.setDate(now.getDate() - 1);

    const isYesterday =
      date.getFullYear() === yesterday.getFullYear() &&
      date.getMonth() === yesterday.getMonth() &&
      date.getDate() === yesterday.getDate();

    if (isYesterday) {
      return 'Yesterday';
    }

    return date.toLocaleDateString([], { weekday: 'short' });
  }

  private scrollToBottom(): void {
    try {
      this.messagesContainer.nativeElement.scrollTop =
        this.messagesContainer.nativeElement.scrollHeight;
    } catch {}
  }
}
