import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Request,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiBody,
  ApiOperation,
  ApiParam,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { Role } from '@prisma/client';
import { Roles } from '../auth/decorators/roles.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { PostsService } from './posts.service';
import {
  CreatePostDto,
  CreatePostReplyDto,
  QueryPostsDto,
  UpdatePostDto,
  UpdatePostReplyDto,
} from './dto';

@ApiTags('posts')
@ApiBearerAuth()
@Controller('posts')
@UseGuards(JwtAuthGuard, RolesGuard)
export class PostsController {
  constructor(private readonly postsService: PostsService) {}

  @Post()
  @Roles(Role.ALUNO, Role.PROFESSOR, Role.ADMIN)
  @ApiOperation({ summary: 'Criar postagem para alunos' })
  @ApiBody({ type: CreatePostDto })
  @ApiResponse({ status: 201, description: 'Post criado com sucesso' })
  @ApiResponse({ status: 401, description: 'Não autenticado' })
  @ApiResponse({ status: 403, description: 'Sem permissão' })
  create(@Request() req, @Body() createPostDto: CreatePostDto) {
    return this.postsService.create(req.user.id, req.user.role, createPostDto);
  }

  @Get()
  @Roles(Role.ALUNO, Role.PROFESSOR, Role.ADMIN)
  @ApiOperation({ summary: 'Listar postagens com paginação' })
  @ApiResponse({ status: 200, description: 'Lista de posts' })
  findAll(@Request() req, @Query() query: QueryPostsDto) {
    return this.postsService.findAll(req.user.id, req.user.role, query);
  }

  @Get(':id')
  @Roles(Role.ALUNO, Role.PROFESSOR, Role.ADMIN)
  @ApiOperation({ summary: 'Detalhar postagem com respostas' })
  @ApiParam({ name: 'id', description: 'ID do post' })
  @ApiResponse({ status: 200, description: 'Post encontrado' })
  @ApiResponse({ status: 404, description: 'Post não encontrado' })
  findOne(@Request() req, @Param('id') id: string) {
    return this.postsService.findOne(req.user.id, req.user.role, id);
  }

  @Patch(':id')
  @Roles(Role.PROFESSOR, Role.ADMIN)
  @ApiOperation({ summary: 'Editar postagem' })
  @ApiParam({ name: 'id', description: 'ID do post' })
  @ApiBody({ type: UpdatePostDto })
  @ApiResponse({ status: 200, description: 'Post atualizado' })
  @ApiResponse({ status: 403, description: 'Sem permissão para editar o post' })
  update(@Request() req, @Param('id') id: string, @Body() updatePostDto: UpdatePostDto) {
    return this.postsService.update(req.user.id, req.user.role, id, updatePostDto);
  }

  @Delete(':id')
  @Roles(Role.PROFESSOR, Role.ADMIN)
  @ApiOperation({ summary: 'Remover postagem' })
  @ApiParam({ name: 'id', description: 'ID do post' })
  @ApiResponse({ status: 200, description: 'Post removido' })
  @ApiResponse({ status: 403, description: 'Sem permissão para remover o post' })
  remove(@Request() req, @Param('id') id: string) {
    return this.postsService.remove(req.user.id, req.user.role, id);
  }

  @Patch(':id/approve')
  @Roles(Role.PROFESSOR, Role.ADMIN)
  @ApiOperation({ summary: 'Aprovar postagem pendente' })
  approvePost(@Request() req, @Param('id') id: string) {
    return this.postsService.reviewPost(req.user.id, req.user.role, id, 'approve');
  }

  @Patch(':id/reject')
  @Roles(Role.PROFESSOR, Role.ADMIN)
  @ApiOperation({ summary: 'Rejeitar postagem pendente' })
  rejectPost(@Request() req, @Param('id') id: string) {
    return this.postsService.reviewPost(req.user.id, req.user.role, id, 'reject');
  }

  @Post(':id/replies')
  @Roles(Role.ALUNO, Role.PROFESSOR, Role.ADMIN)
  @ApiOperation({ summary: 'Responder uma postagem' })
  @ApiParam({ name: 'id', description: 'ID do post' })
  @ApiBody({ type: CreatePostReplyDto })
  @ApiResponse({ status: 201, description: 'Resposta criada' })
  createReply(
    @Request() req,
    @Param('id') id: string,
    @Body() createReplyDto: CreatePostReplyDto,
  ) {
    return this.postsService.createReply(req.user.id, req.user.role, id, createReplyDto);
  }

  @Patch(':id/replies/:replyId')
  @Roles(Role.ALUNO, Role.PROFESSOR, Role.ADMIN)
  @ApiOperation({ summary: 'Editar resposta de postagem' })
  @ApiParam({ name: 'id', description: 'ID do post' })
  @ApiParam({ name: 'replyId', description: 'ID da resposta' })
  @ApiBody({ type: UpdatePostReplyDto })
  @ApiResponse({ status: 200, description: 'Resposta atualizada' })
  updateReply(
    @Request() req,
    @Param('id') id: string,
    @Param('replyId') replyId: string,
    @Body() updateReplyDto: UpdatePostReplyDto,
  ) {
    return this.postsService.updateReply(
      req.user.id,
      req.user.role,
      id,
      replyId,
      updateReplyDto,
    );
  }

  @Delete(':id/replies/:replyId')
  @Roles(Role.ALUNO, Role.PROFESSOR, Role.ADMIN)
  @ApiOperation({ summary: 'Remover resposta de postagem' })
  @ApiParam({ name: 'id', description: 'ID do post' })
  @ApiParam({ name: 'replyId', description: 'ID da resposta' })
  @ApiResponse({ status: 200, description: 'Resposta removida' })
  removeReply(@Request() req, @Param('id') id: string, @Param('replyId') replyId: string) {
    return this.postsService.removeReply(req.user.id, req.user.role, id, replyId);
  }

  @Patch(':id/replies/:replyId/approve')
  @Roles(Role.PROFESSOR, Role.ADMIN)
  @ApiOperation({ summary: 'Aprovar resposta pendente' })
  approveReply(
    @Request() req,
    @Param('id') id: string,
    @Param('replyId') replyId: string,
  ) {
    return this.postsService.reviewReply(req.user.id, req.user.role, id, replyId, 'approve');
  }

  @Patch(':id/replies/:replyId/reject')
  @Roles(Role.PROFESSOR, Role.ADMIN)
  @ApiOperation({ summary: 'Rejeitar resposta pendente' })
  rejectReply(
    @Request() req,
    @Param('id') id: string,
    @Param('replyId') replyId: string,
  ) {
    return this.postsService.reviewReply(req.user.id, req.user.role, id, replyId, 'reject');
  }
}
