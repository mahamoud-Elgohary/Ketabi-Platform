export interface Profile {
  name: string;
  email: string;
  phone?: string;
  address?: Address | Address[];
  gender?: 'male' | 'female' | 'other';
  avatar?: {
    public_id?: string;
    url?: string;
  };
  role: string;
}

export interface Address {
  street: string;
  city: string;
}

export interface ProfileResponse {
  status: string;
  message: string;
  code: number;
  data: Profile;
}

export interface UpdateProfileRequest {
  name?: string;
  phone?: string;
  address?: Address | Address[];
  gender?: 'male' | 'female' | 'other';
  avatar?: {
    public_id?: string;
    url?: string;
  };
}


