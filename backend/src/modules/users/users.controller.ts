import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Request,
  Query,
  UseInterceptors,
  UploadedFile,
  BadRequestException,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiConsumes,
  ApiResponse,
  ApiBody,
} from '@nestjs/swagger';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname } from 'path';
import { existsSync, mkdirSync } from 'fs';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateOwnProfileDto } from './dto/update-own-profile.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { QueryUsersDto } from './dto/query-users.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Role } from '@prisma/client';
import { AuthenticatedRequest } from '../../common/types/authenticated-request';

@ApiTags('users')
@ApiBearerAuth()
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @ApiOperation({
    summary: 'Criar novo usuário (apenas Admin)',
    description:
      'Cria um novo usuário no sistema. Apenas administradores podem usar este endpoint.',
  })
  @ApiBody({
    type: CreateUserDto,
    examples: {
      aluno: {
        summary: 'Criar aluno',
        value: {
          name: 'Pedro Oliveira',
          email: 'pedro@example.com',
          password: 'Senha@123',
          role: 'ALUNO',
        },
      },
    },
  })
  @ApiResponse({
    status: 201,
    description: 'Usuário criado com sucesso',
    schema: {
      example: {
        id: 'uuid-here',
        name: 'Pedro Oliveira',
        email: 'pedro@example.com',
        role: 'ALUNO',
        avatar: null,
        createdAt: '2024-01-26T00:00:00.000Z',
      },
    },
  })
  @ApiResponse({ status: 400, description: 'Dados inválidos' })
  @ApiResponse({ status: 401, description: 'Não autenticado' })
  @ApiResponse({ status: 403, description: 'Sem permissão (apenas Admin)' })
  @ApiResponse({ status: 409, description: 'Email já cadastrado' })
  create(@Body() createUserDto: CreateUserDto) {
    return this.usersService.create(createUserDto);
  }

  @Get()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.PROFESSOR)
  @ApiOperation({
    summary: 'Listar todos os usuários (Admin e Professor)',
    description: 'Retorna lista paginada de usuários com filtros opcionais',
  })
  @ApiResponse({
    status: 200,
    description: 'Lista de usuários',
    schema: {
      example: {
        data: [
          {
            id: 'uuid-here',
            name: 'João Silva',
            email: 'joao@example.com',
            role: 'ALUNO',
            avatar: '/uploads/avatars/avatar.jpg',
            createdAt: '2024-01-26T00:00:00.000Z',
          },
        ],
        meta: {
          page: 1,
          limit: 10,
          total: 50,
          totalPages: 5,
        },
      },
    },
  })
  @ApiResponse({ status: 401, description: 'Não autenticado' })
  @ApiResponse({ status: 403, description: 'Sem permissão' })
  findAll(@Query() query: QueryUsersDto) {
    return this.usersService.findAll(query);
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({
    summary: 'Obter perfil do usuário logado',
    description: 'Retorna informações do usuário autenticado',
  })
  @ApiResponse({
    status: 200,
    description: 'Perfil do usuário',
    schema: {
      example: {
        id: 'uuid-here',
        name: 'João Silva',
        email: 'joao@example.com',
        role: 'ALUNO',
        avatar: '/uploads/avatars/avatar.jpg',
        createdAt: '2024-01-26T00:00:00.000Z',
        updatedAt: '2024-01-26T00:00:00.000Z',
      },
    },
  })
  @ApiResponse({ status: 401, description: 'Não autenticado' })
  getProfile(@Request() req: AuthenticatedRequest) {
    return this.usersService.findOne(req.user.id);
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({
    summary: 'Buscar usuário por ID',
    description: 'Retorna informações de um usuário específico',
  })
  @ApiResponse({
    status: 200,
    description: 'Usuário encontrado',
    schema: {
      example: {
        id: 'uuid-here',
        name: 'João Silva',
        email: 'joao@example.com',
        role: 'ALUNO',
        avatar: '/uploads/avatars/avatar.jpg',
        createdAt: '2024-01-26T00:00:00.000Z',
      },
    },
  })
  @ApiResponse({ status: 401, description: 'Não autenticado' })
  @ApiResponse({ status: 404, description: 'Usuário não encontrado' })
  findOne(@Param('id') id: string) {
    return this.usersService.findOne(id);
  }

  @Patch('me')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({
    summary: 'Atualizar próprio perfil',
    description: 'Permite ao usuário atualizar seus próprios dados',
  })
  @ApiBody({
    type: UpdateOwnProfileDto,
    examples: {
      update: {
        summary: 'Atualizar perfil',
        value: {
          name: 'João Silva Santos',
          email: 'joao.novo@example.com',
        },
      },
    },
  })
  @ApiResponse({
    status: 200,
    description: 'Perfil atualizado',
    schema: {
      example: {
        id: 'uuid-here',
        name: 'João Silva Santos',
        email: 'joao.novo@example.com',
        role: 'ALUNO',
        avatar: '/uploads/avatars/avatar.jpg',
        updatedAt: '2024-01-26T00:00:00.000Z',
      },
    },
  })
  @ApiResponse({ status: 400, description: 'Dados inválidos' })
  @ApiResponse({ status: 401, description: 'Não autenticado' })
  updateProfile(
    @Request() req: AuthenticatedRequest,
    @Body() updateUserDto: UpdateOwnProfileDto,
  ) {
    return this.usersService.update(req.user.id, updateUserDto);
  }

  @Post('me/avatar')
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(
    FileInterceptor('avatar', {
      storage: diskStorage({
        destination: (req, file, cb) => {
          const uploadPath = './uploads/avatars';
          if (!existsSync(uploadPath)) {
            mkdirSync(uploadPath, { recursive: true });
          }
          cb(null, uploadPath);
        },
        filename: (req, file, cb) => {
          const randomName = Array(32)
            .fill(null)
            .map(() => Math.round(Math.random() * 16).toString(16))
            .join('');
          cb(null, `${randomName}${extname(file.originalname)}`);
        },
      }),
      fileFilter: (req, file, cb) => {
        const allowedMimeTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
        const allowedExtensions = /\.(jpg|jpeg|png|gif|webp)$/i;

        if (
          !allowedMimeTypes.includes(file.mimetype) ||
          !file.originalname.match(allowedExtensions)
        ) {
          return cb(new BadRequestException('Apenas imagens são permitidas'), false);
        }
        cb(null, true);
      },
      limits: {
        fileSize: 5 * 1024 * 1024, // 5MB
      },
    }),
  )
  @ApiOperation({
    summary: 'Upload de avatar do usuário logado',
    description:
      'Faz upload da foto de perfil do usuário. Tamanho máximo: 5MB. Formatos: jpg, jpeg, png, gif, webp',
  })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        avatar: {
          type: 'string',
          format: 'binary',
          description: 'Arquivo de imagem (jpg, jpeg, png, gif, webp)',
        },
      },
    },
  })
  @ApiResponse({
    status: 200,
    description: 'Avatar atualizado',
    schema: {
      example: {
        id: 'uuid-here',
        avatar: '/uploads/avatars/abc123.jpg',
        updatedAt: '2024-01-26T00:00:00.000Z',
      },
    },
  })
  @ApiResponse({ status: 400, description: 'Arquivo inválido ou não enviado' })
  @ApiResponse({ status: 401, description: 'Não autenticado' })
  async uploadAvatar(
    @Request() req: AuthenticatedRequest,
    @UploadedFile() file: Express.Multer.File,
  ) {
    if (!file) {
      throw new BadRequestException('Nenhum arquivo foi enviado');
    }

    const avatarPath = `/uploads/avatars/${file.filename}`;
    return this.usersService.updateAvatar(req.user.id, avatarPath);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @ApiOperation({
    summary: 'Atualizar usuário (apenas Admin)',
    description: 'Administrador pode atualizar qualquer usuário, incluindo role',
  })
  @ApiBody({
    type: UpdateUserDto,
    examples: {
      update: {
        summary: 'Atualizar usuário',
        value: {
          name: 'João Silva Santos',
          role: 'PROFESSOR',
        },
      },
    },
  })
  @ApiResponse({
    status: 200,
    description: 'Usuário atualizado',
    schema: {
      example: {
        id: 'uuid-here',
        name: 'João Silva Santos',
        email: 'joao@example.com',
        role: 'PROFESSOR',
        avatar: '/uploads/avatars/avatar.jpg',
        updatedAt: '2024-01-26T00:00:00.000Z',
      },
    },
  })
  @ApiResponse({ status: 400, description: 'Dados inválidos' })
  @ApiResponse({ status: 401, description: 'Não autenticado' })
  @ApiResponse({ status: 403, description: 'Sem permissão (apenas Admin)' })
  @ApiResponse({ status: 404, description: 'Usuário não encontrado' })
  update(@Param('id') id: string, @Body() updateUserDto: UpdateUserDto) {
    return this.usersService.update(id, updateUserDto);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @ApiOperation({
    summary: 'Deletar usuário (apenas Admin)',
    description: 'Remove permanentemente um usuário do sistema',
  })
  @ApiResponse({
    status: 200,
    description: 'Usuário deletado',
    schema: {
      example: {
        id: 'uuid-here',
      },
    },
  })
  @ApiResponse({ status: 401, description: 'Não autenticado' })
  @ApiResponse({ status: 403, description: 'Sem permissão (apenas Admin)' })
  @ApiResponse({ status: 404, description: 'Usuário não encontrado' })
  remove(@Param('id') id: string) {
    return this.usersService.remove(id);
  }
}
