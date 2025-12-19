import { http } from './http';
import { User } from './auth';

export interface UpdateProfileInput {
  name?: string;
  username?: string;
  avatar?: string | null;
  email?: string;
  notificationsEnabled?: boolean;
  pushToken?: string | null;
}

export const userApi = {
  async updateProfile(payload: UpdateProfileInput): Promise<User> {
    const response = await http.request<{ user: User }>('/me', {
      method: 'PUT',
      body: JSON.stringify(payload),
    });
    return response.user;
  },
};
