// src/utils/apiClient.ts
import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse, AxiosError } from 'axios';
import { IRateLimiter } from './rateLimiter';
import { ILogger } from './logger';
import logger from './logger';

// Define types for query parameters and request data
export type QueryParams = Record<string, string | number | boolean | null | undefined>;
export type RequestData = Record<string, unknown> | unknown[] | string | number | boolean | null;

export abstract class ApiClient {
  protected axiosInstance: AxiosInstance;
  protected rateLimiter: IRateLimiter;
  protected logger: ILogger;
  
  constructor(
    baseUrl: string, 
    rateLimiter: IRateLimiter, 
    customLogger?: ILogger,
    timeout: number = 30000
  ) {
    this.axiosInstance = axios.create({
      baseURL: baseUrl,
      timeout: timeout,
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      }
    });
    
    this.rateLimiter = rateLimiter;
    this.logger = customLogger || logger;
    
    this.logger.info(`API client initialized for ${baseUrl}`);
  }
  
  /**
   * Performs a GET request
   * @param path Endpoint path
   * @param params Query parameters
   */
  protected async get<T>(path: string, params?: QueryParams): Promise<T> {
    await this.checkRateLimit();
    
    try {
      const config: AxiosRequestConfig = {};
      if (params) {
        config.params = params;
      }
      
      const startTime = Date.now();
      const response = await this.axiosInstance.get<T>(path, config);
      const duration = Date.now() - startTime;
      
      this.logger.debug(`GET ${path} completed in ${duration}ms`);
      return this.validateResponse<T>(response);
    } catch (error) {
      this.handleRequestError(error, 'GET', path);
      throw error;
    }
  }
  
  /**
   * Performs a POST request
   * @param path Endpoint path
   * @param data Request body
   * @param params Query parameters
   */
  protected async post<T>(
    path: string, 
    data?: RequestData, 
    params?: QueryParams
  ): Promise<T> {
    await this.checkRateLimit();
    
    try {
      const config: AxiosRequestConfig = {};
      if (params) {
        config.params = params;
      }
      
      const startTime = Date.now();
      const response = await this.axiosInstance.post<T>(path, data, config);
      const duration = Date.now() - startTime;
      
      this.logger.debug(`POST ${path} completed in ${duration}ms`);
      return this.validateResponse<T>(response);
    } catch (error) {
      this.handleRequestError(error, 'POST', path);
      throw error;
    }
  }
  
  /**
   * Validates and processes the API response
   * @param response The API response to validate
   */
  protected validateResponse<T>(response: AxiosResponse<T>): T {
    // Record the request for rate limiting
    this.rateLimiter.recordRequest();
    
    // Check for successful status code
    if (response.status < 200 || response.status >= 300) {
      throw new Error(`API request failed with status ${response.status}`);
    }
    
    return response.data;
  }
  
  /**
   * Handles API request errors
   * @param error The error that occurred
   * @param method The HTTP method used
   * @param path The endpoint path
   */
  protected handleRequestError(error: unknown, method: string, path: string): void {
    if (axios.isAxiosError(error)) {
      const axiosError = error as AxiosError;
      if (axiosError.response) {
        // The request was made and the server responded with a status code
        // that falls out of the range of 2xx
        this.logger.error(
          `${method} ${path} failed with status ${axiosError.response.status}`,
          { data: axiosError.response.data }
        );
      } else if (axiosError.request) {
        // The request was made but no response was received
        this.logger.error(
          `${method} ${path} failed: No response received`
        );
      } else {
        // Something happened in setting up the request
        this.logger.error(
          `${method} ${path} failed: ${axiosError.message}`
        );
      }
    } else {
      this.logger.error(
        `${method} ${path} failed with unexpected error: ${
          error instanceof Error ? error.message : String(error)
        }`
      );
    }
  }
  
  /**
   * Checks if a request can be made without exceeding rate limits
   */
  protected async checkRateLimit(): Promise<void> {
    if (!this.rateLimiter.canMakeRequest()) {
      // Calculate wait time based on rate limiter interval
      const waitTime = this.rateLimiter.interval / 2;
      this.logger.warn(
        `Rate limit reached, waiting ${waitTime}ms before retry`
      );
      
      // Wait for the specified time
      await new Promise(resolve => setTimeout(resolve, waitTime));
      
      // Check again
      return this.checkRateLimit();
    }
  }
}