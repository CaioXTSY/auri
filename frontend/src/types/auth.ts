export interface LoginDto {
  email: string;
  password: string;
}

export interface RegisterDto {
  email: string;
  password: string;
  name: string;
  role: 'ADMIN' | 'PROFESSOR' | 'ALUNO';
}
