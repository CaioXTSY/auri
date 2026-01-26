import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios, { AxiosInstance } from 'axios';

/**
 * Mapeamento de linguagens da plataforma para IDs do Judge0
 * https://ce.judge0.com/#statuses-and-languages-language-get
 */
export const LANGUAGE_IDS = {
  javascript: 63, // Node.js 12.14.0
  python: 71, // Python 3.8.1
  java: 62, // Java (OpenJDK 13.0.1)
  c: 50, // C (GCC 9.2.0)
  cpp: 54, // C++ (GCC 9.2.0)
  typescript: 74, // TypeScript 3.7.4
} as const;

/**
 * Status de execução do Judge0
 */
export enum Judge0Status {
  IN_QUEUE = 1, // Na fila
  PROCESSING = 2, // Processando
  ACCEPTED = 3, // Aceito (passou)
  WRONG_ANSWER = 4, // Resposta errada
  TIME_LIMIT_EXCEEDED = 5, // Tempo excedido
  COMPILATION_ERROR = 6, // Erro de compilação
  RUNTIME_ERROR_SIGSEGV = 7, // Erro de runtime (segfault)
  RUNTIME_ERROR_SIGXFSZ = 8, // Erro de runtime (file size)
  RUNTIME_ERROR_SIGFPE = 9, // Erro de runtime (float point)
  RUNTIME_ERROR_SIGABRT = 10, // Erro de runtime (abort)
  RUNTIME_ERROR_NZEC = 11, // Erro de runtime (non-zero exit)
  RUNTIME_ERROR_OTHER = 12, // Erro de runtime (outro)
  INTERNAL_ERROR = 13, // Erro interno
  EXEC_FORMAT_ERROR = 14, // Erro de formato executável
}

export interface Judge0Submission {
  source_code: string;
  language_id: number;
  stdin?: string;
  expected_output?: string;
  cpu_time_limit?: number; // em segundos (ex: 2.0)
  memory_limit?: number; // em KB (ex: 128000)
  wall_time_limit?: number; // em segundos
}

export interface Judge0Result {
  stdout: string | null;
  stderr: string | null;
  compile_output: string | null;
  message: string | null;
  status: {
    id: number;
    description: string;
  };
  time: string | null; // tempo em segundos (ex: "0.123")
  memory: number | null; // memória em KB
  token: string;
}

@Injectable()
export class Judge0Service {
  private readonly logger = new Logger(Judge0Service.name);
  private readonly axios: AxiosInstance;
  private readonly baseUrl: string;
  private readonly maxWaitTime: number;

  constructor(private readonly configService: ConfigService) {
    this.baseUrl = this.configService.get<string>(
      'JUDGE0_URL',
      'http://localhost:2358',
    );
    this.maxWaitTime = this.configService.get<number>(
      'JUDGE0_MAX_WAIT_TIME',
      10000,
    );

    this.axios = axios.create({
      baseURL: this.baseUrl,
      headers: {
        'Content-Type': 'application/json',
      },
      timeout: this.maxWaitTime,
    });

    this.logger.log(`Judge0 configurado em: ${this.baseUrl}`);
  }

  /**
   * Obter ID da linguagem
   */
  getLanguageId(language: string): number {
    const langId = LANGUAGE_IDS[language.toLowerCase()];
    if (!langId) {
      throw new BadRequestException(
        `Linguagem não suportada: ${language}. Suportadas: ${Object.keys(LANGUAGE_IDS).join(', ')}`,
      );
    }
    return langId;
  }

  /**
   * Executar código contra um caso de teste
   */
  async executeCode(
    sourceCode: string,
    language: string,
    testInput: string,
    expectedOutput: string,
    timeLimitSeconds: number = 2,
    memoryLimitKB: number = 128000,
  ): Promise<Judge0Result> {
    try {
      const languageId = this.getLanguageId(language);

      const submission: Judge0Submission = {
        source_code: Buffer.from(sourceCode).toString('base64'),
        language_id: languageId,
        stdin: Buffer.from(testInput).toString('base64'),
        expected_output: Buffer.from(expectedOutput.trim()).toString('base64'),
        cpu_time_limit: timeLimitSeconds,
        memory_limit: memoryLimitKB,
        wall_time_limit: timeLimitSeconds + 1,
      };

      // Criar submissão
      const createResponse = await this.axios.post('/submissions', submission, {
        params: { base64_encoded: true },
      });

      const token = createResponse.data.token;
      this.logger.debug(`Submissão criada: ${token}`);

      // Aguardar resultado
      const result = await this.waitForResult(token);

      return result;
    } catch (error) {
      this.logger.error(
        `Erro ao executar código: ${error.message}`,
        error.stack,
      );
      throw new BadRequestException(
        `Falha na execução: ${error.message || 'Erro desconhecido'}`,
      );
    }
  }

  /**
   * Aguardar resultado da submissão
   */
  private async waitForResult(token: string): Promise<Judge0Result> {
    const startTime = Date.now();

    while (Date.now() - startTime < this.maxWaitTime) {
      try {
        const response = await this.axios.get(`/submissions/${token}`, {
          params: { base64_encoded: true },
        });

        const result = response.data;

        // Decodificar campos base64
        if (result.stdout) {
          result.stdout = Buffer.from(result.stdout, 'base64').toString(
            'utf-8',
          );
        }
        if (result.stderr) {
          result.stderr = Buffer.from(result.stderr, 'base64').toString(
            'utf-8',
          );
        }
        if (result.compile_output) {
          result.compile_output = Buffer.from(
            result.compile_output,
            'base64',
          ).toString('utf-8');
        }
        if (result.message) {
          result.message = Buffer.from(result.message, 'base64').toString(
            'utf-8',
          );
        }

        // Status 1 = na fila, 2 = processando
        if (result.status.id > 2) {
          return result;
        }

        // Aguardar antes de tentar novamente
        await new Promise((resolve) => setTimeout(resolve, 500));
      } catch (error) {
        this.logger.error(
          `Erro ao buscar resultado: ${error.message}`,
          error.stack,
        );
        throw error;
      }
    }

    throw new BadRequestException(
      'Timeout: execução demorou muito para completar',
    );
  }

  /**
   * Executar código contra múltiplos casos de teste
   */
  async executeAgainstTestCases(
    sourceCode: string,
    language: string,
    testCases: Array<{ input: string; expectedOutput: string }>,
    timeLimitSeconds: number = 2,
    memoryLimitKB: number = 128000,
  ): Promise<
    Array<{
      passed: boolean;
      input: string;
      expectedOutput: string;
      actualOutput: string | null;
      status: string;
      time: number | null;
      memory: number | null;
      error: string | null;
    }>
  > {
    const results = [];

    for (const [index, testCase] of testCases.entries()) {
      this.logger.debug(
        `Executando caso de teste ${index + 1}/${testCases.length}`,
      );

      try {
        const result = await this.executeCode(
          sourceCode,
          language,
          testCase.input,
          testCase.expectedOutput,
          timeLimitSeconds,
          memoryLimitKB,
        );

        const passed = result.status.id === Judge0Status.ACCEPTED;
        const actualOutput = result.stdout ? result.stdout.trim() : null;

        results.push({
          passed,
          input: testCase.input,
          expectedOutput: testCase.expectedOutput,
          actualOutput,
          status: result.status.description,
          time: result.time ? parseFloat(result.time) * 1000 : null, // converter para ms
          memory: result.memory,
          error:
            result.stderr ||
            result.compile_output ||
            result.message ||
            null,
        });
      } catch (error) {
        this.logger.error(
          `Erro no caso de teste ${index + 1}: ${error.message}`,
        );
        results.push({
          passed: false,
          input: testCase.input,
          expectedOutput: testCase.expectedOutput,
          actualOutput: null,
          status: 'Internal Error',
          time: null,
          memory: null,
          error: error.message,
        });
      }
    }

    return results;
  }

  /**
   * Verificar se Judge0 está disponível
   */
  async healthCheck(): Promise<boolean> {
    try {
      const response = await this.axios.get('/about');
      this.logger.log('Judge0 está disponível');
      return response.status === 200;
    } catch (error) {
      this.logger.error(
        `Judge0 não está disponível: ${error.message}`,
        error.stack,
      );
      return false;
    }
  }
}
