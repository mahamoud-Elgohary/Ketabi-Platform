export interface Genre {
  _id: string;
  name: string;
  slug: string;
  description?: string;
}

export interface GenresResponse {
  status: string;
  message?: string;
  code: number;
  data: Genre[];
}
