import { 
  ChatRoom, 
  ChatMessage, 
  SendMessageRequest, 
  ChatRoomsResponse, 
  ApiResponse 
} from '@/types/marketplace';
import authService from '@/lib/auth';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8085';

class ChatService {
  private static instance: ChatService;

  public static getInstance(): ChatService {
    if (!ChatService.instance) {
      ChatService.instance = new ChatService();
    }
    return ChatService.instance;
  }

  /**
   * Get user's chat rooms
   */
  public async getChatRooms(page: number = 1, limit: number = 20): Promise<ChatRoomsResponse> {
    try {
      const response = await authService.makeAuthenticatedRequest(
        `${API_BASE_URL}/chat/rooms?page=${page}&limit=${limit}`,
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to fetch chat rooms');
      }

      const data: ApiResponse<ChatRoomsResponse> = await response.json();
      return data.data;
    } catch (error) {
      console.error('Get chat rooms error:', error);
      throw error;
    }
  }

  /**
   * Create or get chat room for a listing
   */
  public async createChatRoom(listingId: string): Promise<ChatRoom> {
    try {
      const response = await authService.makeAuthenticatedRequest(
        `${API_BASE_URL}/chat/rooms`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ listingId }),
        }
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to create chat room');
      }

      const data: ApiResponse<ChatRoom> = await response.json();
      return data.data;
    } catch (error) {
      console.error('Create chat room error:', error);
      throw error;
    }
  }

  /**
   * Send a message to a chat room
   */
  public async sendMessage(message: SendMessageRequest): Promise<ChatMessage> {
    try {
      const response = await authService.makeAuthenticatedRequest(
        `${API_BASE_URL}/chat/messages`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(message),
        }
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to send message');
      }

      const data: ApiResponse<ChatMessage> = await response.json();
      return data.data;
    } catch (error) {
      console.error('Send message error:', error);
      throw error;
    }
  }

  /**
   * Get messages for a chat room
   */
  public async getMessages(roomId: string, page: number = 1, limit: number = 50): Promise<ChatMessage[]> {
    try {
      const response = await authService.makeAuthenticatedRequest(
        `${API_BASE_URL}/chat/rooms/${roomId}/messages?page=${page}&limit=${limit}`,
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to fetch messages');
      }

      const data: ApiResponse<ChatMessage[]> = await response.json();
      return data.data;
    } catch (error) {
      console.error('Get messages error:', error);
      throw error;
    }
  }
}

export const chatService = ChatService.getInstance();
export default chatService;