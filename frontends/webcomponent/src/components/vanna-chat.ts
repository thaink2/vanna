import { LitElement, html, css } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import { vannaDesignTokens } from '../styles/vanna-design-tokens.js';
import { VannaApiClient, ChatStreamChunk } from '../services/api-client.js';
import { ComponentManager, RichComponent } from './rich-component-system.js';
import './vanna-status-bar.js';
import './vanna-progress-tracker.js';
import './rich-card.js';
import './rich-task-list.js';
import './rich-progress-bar.js';
import './plotly-chart.js';

@customElement('vanna-chat')
export class VannaChat extends LitElement {
  static styles = [
    vannaDesignTokens,
    css`
      *, *::before, *::after {
        box-sizing: border-box;
      }

      :host {
        display: block;
        font-family: var(--vanna-font-family-default);
        --chat-primary: var(--vanna-accent-primary-default);
        --chat-primary-stronger: var(--vanna-accent-primary-stronger);
        --chat-primary-foreground: rgb(255, 255, 255);
        --chat-accent-soft: var(--vanna-accent-primary-subtle);
        --chat-outline: var(--vanna-outline-default);
        --chat-surface: var(--vanna-background-root);
        --chat-muted: var(--vanna-background-default);
        --chat-muted-stronger: var(--vanna-background-higher);
        max-width: 1024px;
        margin: 0 auto;
        background: var(--vanna-background-root);
        border: 1px solid var(--vanna-outline-dimmer);
        border-radius: var(--vanna-border-radius-2xl);
        box-shadow: var(--vanna-shadow-xl);
        overflow: hidden;
        transition: box-shadow var(--vanna-duration-300) ease, transform var(--vanna-duration-300) ease;
        position: relative;
      }

      :host(:hover) {
        box-shadow: var(--vanna-shadow-2xl);
        transform: translateY(-2px);
      }

      :host([theme="dark"]) {
        --chat-primary: var(--vanna-accent-primary-default);
        --chat-primary-stronger: var(--vanna-accent-primary-stronger);
        --chat-primary-foreground: rgb(255, 255, 255);
        --chat-accent-soft: var(--vanna-accent-primary-subtle);
        --chat-outline: var(--vanna-outline-default);
        --chat-surface: var(--vanna-background-higher);
        --chat-muted: var(--vanna-background-default);
        --chat-muted-stronger: var(--vanna-background-highest);
        background: var(--vanna-background-higher);
        border-color: var(--vanna-outline-default);
      }

      :host(.maximized) {
        position: fixed;
        top: var(--vanna-space-6);
        left: var(--vanna-space-6);
        right: var(--vanna-space-6);
        bottom: var(--vanna-space-6);
        max-width: none;
        width: auto;
        margin: 0;
        z-index: var(--vanna-z-modal);
        border-radius: var(--vanna-border-radius-xl);
        transform: none;
        box-shadow: var(--vanna-shadow-2xl);
      }

      :host(.maximized):hover {
        transform: none;
      }

      :host(.minimized) {
        position: fixed !important;
        bottom: var(--vanna-space-6) !important;
        right: var(--vanna-space-6) !important;
        width: 64px !important;
        height: 64px !important;
        max-width: none !important;
        margin: 0 !important;
        z-index: var(--vanna-z-modal) !important;
        border-radius: var(--vanna-border-radius-full) !important;
        cursor: pointer !important;
        background: linear-gradient(135deg, var(--chat-primary-stronger), var(--chat-primary)) !important;
        border: 2px solid rgba(255, 255, 255, 0.9) !important;
        box-shadow: var(--vanna-shadow-xl) !important;
        overflow: hidden !important;
      }

      :host(.minimized):hover {
        transform: scale(1.05);
        box-shadow: var(--vanna-shadow-2xl) !important;
      }

      :host(.minimized) .chat-layout {
        display: none;
      }

      .minimized-icon {
        display: none;
      }

      :host(.minimized) .minimized-icon {
        display: flex;
        align-items: center;
        justify-content: center;
        width: 100%;
        height: 100%;
        color: var(--chat-primary-foreground);
        font-size: 24px;
        transition: transform var(--vanna-duration-200) ease;
      }

      :host(.minimized) .minimized-icon:hover {
        transform: scale(1.1);
      }

      :host(.minimized) .minimized-icon svg {
        filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.3));
      }

      .chat-layout {
        display: grid;
        grid-template-columns: minmax(0, 1fr) 300px;
        height: 600px;
        max-height: 80vh;
        background: var(--chat-muted);
      }

      :host(.maximized) .chat-layout {
        height: calc(100vh - 48px);
        max-height: calc(100vh - 48px);
      }

      .chat-layout.compact {
        grid-template-columns: 1fr;
      }

      .chat-main {
        display: flex;
        flex-direction: column;
        border-right: 1px solid var(--chat-outline);
        background: var(--chat-surface);
        min-height: 0;
      }

      .chat-layout.compact .chat-main {
        border-right: none;
      }

      .chat-header {
        padding: var(--vanna-space-6) var(--vanna-space-7);
        background: linear-gradient(135deg, var(--chat-primary) 0%, var(--chat-primary-stronger) 100%);
        border-bottom: 1px solid rgba(255, 255, 255, 0.2);
        display: flex;
        flex-direction: column;
        gap: var(--vanna-space-4);
        color: var(--chat-primary-foreground);
        position: relative;
        overflow: hidden;
      }

      .chat-header::before {
        content: '';
        position: absolute;
        top: -50%;
        right: -50%;
        width: 100%;
        height: 200%;
        background: radial-gradient(circle, rgba(255, 255, 255, 0.15) 0%, transparent 70%);
        opacity: 0.6;
        pointer-events: none;
      }

      :host([theme="dark"]) .chat-header {
        border-bottom-color: rgba(255, 255, 255, 0.1);
      }

      .header-top {
        position: relative;
        z-index: 1;
        display: flex;
        align-items: center;
        gap: var(--vanna-space-4);
        width: 100%;
      }

      .header-left {
        display: flex;
        align-items: center;
        gap: var(--vanna-space-4);
        min-width: 0;
        flex: 1;
      }

      .header-top-actions {
        display: inline-flex;
        align-items: center;
        gap: var(--vanna-space-2);
        margin-left: auto;
      }

      .chat-avatar {
        width: 44px;
        height: 44px;
        border-radius: var(--vanna-border-radius-lg);
        background: rgba(255, 255, 255, 0.2);
        backdrop-filter: blur(10px);
        display: grid;
        place-items: center;
        font-weight: 600;
        font-size: 16px;
        letter-spacing: 0.02em;
        color: var(--chat-primary-foreground);
        border: 1px solid rgba(255, 255, 255, 0.3);
      }

      .header-text {
        display: flex;
        flex-direction: column;
        gap: var(--vanna-space-1);
        min-width: 0;
      }

      .chat-title {
        margin: 0;
        font-size: 18px;
        font-weight: 600;
        letter-spacing: -0.01em;
        color: var(--chat-primary-foreground);
      }

      .chat-subtitle {
        font-size: 13px;
        letter-spacing: 0.01em;
        opacity: 0.9;
        font-weight: 400;
        color: var(--chat-primary-foreground);
      }

      .window-controls {
        display: flex;
        align-items: center;
        gap: var(--vanna-space-2);
      }

      .window-control-btn {
        width: 28px;
        height: 28px;
        border-radius: var(--vanna-border-radius-md);
        border: none;
        background: rgba(255, 255, 255, 0.15);
        backdrop-filter: blur(10px);
        color: white;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        transition: all var(--vanna-duration-150) ease;
        padding: 0;
      }

      .window-control-btn:hover {
        background: rgba(255, 255, 255, 0.25);
        transform: scale(1.05);
      }

      .window-control-btn:active {
        transform: scale(0.95);
      }

      .window-control-btn svg {
        width: 16px;
        height: 16px;
        opacity: 0.9;
      }

      .chat-messages {
        flex: 1;
        overflow-y: auto;
        padding: var(--vanna-space-4) var(--vanna-space-3) var(--vanna-space-4) var(--vanna-space-4);
        scroll-behavior: smooth;
        display: flex;
        flex-direction: column;
        min-height: 0;
        position: relative;
      }

      .chat-messages::-webkit-scrollbar {
        width: 8px;
      }

      .chat-messages::-webkit-scrollbar-track {
        background: transparent;
      }

      .chat-messages::-webkit-scrollbar-thumb {
        background: var(--chat-outline);
        border-radius: 4px;
      }

      .chat-messages::-webkit-scrollbar-thumb:hover {
        background: var(--vanna-outline-hover);
      }

      .chat-messages.has-scroll::before {
        content: '';
        position: sticky;
        top: 0;
        left: 0;
        right: 0;
        height: 16px;
        background: linear-gradient(to bottom, var(--chat-surface), transparent);
        pointer-events: none;
        z-index: 1;
        margin-bottom: -16px;
      }

      .empty-state {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        height: 100%;
        padding: var(--vanna-space-10);
        color: var(--vanna-foreground-dimmest);
        text-align: center;
        gap: var(--vanna-space-4);
      }

      .empty-state-icon {
        width: 64px;
        height: 64px;
        border-radius: var(--vanna-border-radius-2xl);
        background: var(--chat-accent-soft);
        display: flex;
        align-items: center;
        justify-content: center;
        margin-bottom: var(--vanna-space-2);
      }

      .empty-state-icon svg {
        width: 32px;
        height: 32px;
        color: var(--chat-primary);
        opacity: 0.8;
      }

      .empty-state-text {
        font-size: 18px;
        font-weight: 600;
        color: var(--vanna-foreground-default);
        letter-spacing: -0.01em;
      }

      .empty-state-subtitle {
        font-size: 14px;
        color: var(--vanna-foreground-dimmer);
        max-width: 300px;
      }

      .rich-components-container {
        display: flex;
        flex-direction: column;
        gap: var(--vanna-space-4);
        flex: 1;
      }

      .chat-input-area {
        padding: var(--vanna-space-4) var(--vanna-space-5);
        border-top: 1px solid var(--chat-outline);
        background: var(--chat-surface);
      }

      .chat-input-container {
        display: flex;
        align-items: flex-end;
        gap: var(--vanna-space-3);
        background: var(--chat-muted);
        border: 1px solid var(--chat-outline);
        border-radius: var(--vanna-border-radius-xl);
        padding: var(--vanna-space-3);
        transition: border-color var(--vanna-duration-150) ease, box-shadow var(--vanna-duration-150) ease;
      }

      .chat-input-container:focus-within {
        border-color: var(--chat-primary);
        box-shadow: 0 0 0 3px var(--chat-accent-soft);
      }

      .message-input {
        flex: 1;
        border: none;
        background: transparent;
        font-size: 15px;
        color: var(--vanna-foreground-default);
        resize: none;
        outline: none;
        font-family: var(--vanna-font-family-default);
        line-height: 1.5;
        min-height: 24px;
        max-height: 200px;
        padding: var(--vanna-space-1) 0;
      }

      .message-input::placeholder {
        color: var(--vanna-foreground-dimmest);
      }

      .message-input:disabled {
        opacity: 0.5;
        cursor: not-allowed;
      }

      .send-button {
        flex-shrink: 0;
        width: 36px;
        height: 36px;
        border-radius: var(--vanna-border-radius-lg);
        border: none;
        background: linear-gradient(135deg, var(--chat-primary) 0%, var(--chat-primary-stronger) 100%);
        color: white;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        transition: all var(--vanna-duration-150) ease;
        box-shadow: var(--vanna-shadow-sm);
      }

      .send-button:hover:not(:disabled) {
        transform: scale(1.05);
        box-shadow: var(--vanna-shadow-md);
      }

      .send-button:active:not(:disabled) {
        transform: scale(0.95);
      }

      .send-button:disabled {
        opacity: 0.4;
        cursor: not-allowed;
        background: var(--vanna-outline-default);
      }

      .send-button svg {
        width: 16px;
        height: 16px;
      }

      .sidebar {
        background: var(--chat-muted);
        border-left: 1px solid var(--chat-outline);
        overflow-y: auto;
        display: flex;
        flex-direction: column;
      }

      .sidebar::-webkit-scrollbar {
        width: 6px;
      }

      .sidebar::-webkit-scrollbar-track {
        background: transparent;
      }

      .sidebar::-webkit-scrollbar-thumb {
        background: var(--chat-outline);
        border-radius: 3px;
      }

      .sidebar::-webkit-scrollbar-thumb:hover {
        background: var(--vanna-outline-hover);
      }

      @media (max-width: 768px) {
        :host {
          border-radius: 0;
          max-width: none;
          margin: 0;
        }

        .chat-layout {
          grid-template-columns: 1fr;
          height: 100vh;
          max-height: 100vh;
        }

        .sidebar {
          display: none;
        }

        .chat-header {
          padding: var(--vanna-space-4) var(--vanna-space-5);
        }

        .chat-messages {
          padding: var(--vanna-space-3);
        }

        .message-input {
          font-size: 16px;
        }

        .empty-state {
          padding: var(--vanna-space-8);
          gap: var(--vanna-space-3);
        }

        .empty-state-icon {
          width: 48px;
          height: 48px;
          margin-bottom: var(--vanna-space-5);
        }

        .chat-input-area {
          padding: var(--vanna-space-4) var(--vanna-space-4) var(--vanna-space-5);
        }
      }
    `
  ];

  @property() title = 'thaink² AI Chat';
  @property() placeholder = 'Ask me anything...';
  @property({ type: Boolean }) disabled = false;
  @property({ type: Boolean }) showProgress = true;
  @property({ type: Boolean }) allowMinimize = true;
  @property({ reflect: true }) theme = 'light';
  @property({ attribute: 'api-base' }) apiBaseUrl = '';
  @property({ attribute: 'sse-endpoint' }) sseEndpoint = '/api/vanna/v2/chat_sse';
  @property({ attribute: 'ws-endpoint' }) wsEndpoint = '/api/vanna/v2/chat_websocket';
  @property({ attribute: 'poll-endpoint' }) pollEndpoint = '/api/vanna/v2/chat_poll';
  @property() subtitle = '';
  @property() startingState: 'normal' | 'maximized' | 'minimized' = 'normal';
  // ⭐ NEW PROPERTY: Control whether to hide thinking and tool execution components
  @property({ type: Boolean, attribute: 'hide-thoughts' }) hideThoughts = true;

  @state() private currentMessage = '';
  @state() private status: 'idle' | 'working' | 'error' | 'success' = 'idle';
  @state() private statusMessage = '';
  @state() private statusDetail = '';
  private _windowState: 'normal' | 'maximized' | 'minimized' = 'normal';

  @property({ reflect: false })
  get windowState() {
    return this._windowState;
  }

  set windowState(value: 'normal' | 'maximized' | 'minimized') {
    console.log('windowState setter called with:', value);
    console.trace('Call stack:');
    const oldValue = this._windowState;
    this._windowState = value;
    this.requestUpdate('windowState', oldValue);
  }

  private apiClient!: VannaApiClient;
  private conversationId: string;
  private componentManager: ComponentManager | null = null;
  private componentObserver: MutationObserver | null = null;

  constructor() {
    super();
    // Note: Don't create apiClient here - attributes haven't been set yet!
    // It will be created lazily in getApiClient() or firstUpdated()
    this.conversationId = this.generateId();
  }

  /**
   * Ensure API client is created/updated with current endpoint values
   */
  private ensureApiClient() {
    // Always recreate to ensure we have the latest endpoint values
    console.log('[VannaChat] Creating API client with:', {
      baseUrl: this.apiBaseUrl,
      sseEndpoint: this.sseEndpoint,
      wsEndpoint: this.wsEndpoint,
      pollEndpoint: this.pollEndpoint
    });

    this.apiClient = new VannaApiClient({
      baseUrl: this.apiBaseUrl,
      sseEndpoint: this.sseEndpoint,
      wsEndpoint: this.wsEndpoint,
      pollEndpoint: this.pollEndpoint
    });
  }

  firstUpdated() {
    // Create API client now that attributes have been set
    this.ensureApiClient();

    // Initialize component manager with rich components container (fallback)
    const richContainer = this.shadowRoot?.querySelector('.rich-components-container') as HTMLElement;
    if (richContainer) {
      this.componentManager = new ComponentManager(richContainer);
      
      // Watch for changes in the rich components container to manage empty state
      this.componentObserver = new MutationObserver(() => {
        // Update empty state visibility
        this.updateEmptyState();
      });
      
      this.componentObserver.observe(richContainer, {
        childList: true,
        subtree: true,
        attributes: false
      });
    }

    // Set initial window state from startingState property
    if (this.startingState !== 'normal') {
      this._windowState = this.startingState;
    }

    // Set initial CSS class
    this.classList.add(this._windowState);

    // Request starter UI from backend
    this.requestStarterUI();
  }

  /**
   * Request starter UI (buttons, welcome messages) from backend
   */
  private async requestStarterUI(): Promise<void> {
    try {
      const request = {
        message: "",
        conversation_id: this.conversationId,
        request_id: this.generateId(),
        metadata: {
          starter_ui_request: true
        }
      };

      // Stream the starter UI response
      await this.handleStreamingResponse(request);
    } catch (error) {
      console.error('Error requesting starter UI:', error);
      // Fail silently - starter UI is optional
    }
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    
    // Clean up mutation observer
    if (this.componentObserver) {
      this.componentObserver.disconnect();
      this.componentObserver = null;
    }
  }

  updated(changedProperties: Map<string, any>) {
    super.updated(changedProperties);

    // Update host classes based on window state
    if (changedProperties.has('windowState')) {
      console.log('windowState changed to:', this._windowState);
      this.classList.remove('normal', 'maximized', 'minimized');
      this.classList.add(this._windowState);
      console.log('Applied CSS classes:', this.className);
    }
  }

  /**
   * Get the progress tracker element (if available)
   */
  private getProgressTracker() {
    return this.shadowRoot?.querySelector('vanna-progress-tracker');
  }

  /**
   * Set the status bar state
   */
  private setStatus(
    status: 'idle' | 'working' | 'error' | 'success',
    message: string = '',
    detail: string = ''
  ) {
    this.status = status;
    this.statusMessage = message;
    this.statusDetail = detail;
  }

  /**
   * Get initials from title for avatar
   */
  private getTitleInitials(): string {
    return this.title
      .split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase()
      .substring(0, 2);
  }

  /**
   * Window control methods
   */
  private maximizeWindow() {
    console.log('maximizeWindow called');
    this.windowState = 'maximized';
  }

  private minimizeWindow() {
    console.log('minimizeWindow called');
    this.windowState = 'minimized';
  }

  private restoreWindow() {
    console.log('restoreWindow called');
    if (this.windowState === 'minimized') {
      // When clicking the minimized icon, restore to previous state or normal
      this.windowState = 'normal';
    } else if (this.windowState === 'maximized') {
      this.windowState = 'normal';
    }
  }

  /**
   * Handle textarea input
   */
  private handleInput(e: Event) {
    const textarea = e.target as HTMLTextAreaElement;
    this.currentMessage = textarea.value;
    
    // Auto-resize textarea
    textarea.style.height = 'auto';
    textarea.style.height = Math.min(textarea.scrollHeight, 200) + 'px';
  }

  /**
   * Handle keypress for sending messages (Shift+Enter sends, Enter alone creates new line)
   */
  private handleKeyPress(e: KeyboardEvent) {
    if (e.key === 'Enter' && e.shiftKey && !this.disabled) {
      e.preventDefault();
      this.sendMessage();
    }
  }

  /**
   * Send message to the API
   */
  private async sendMessage() {
    if (!this.currentMessage.trim() || this.disabled) return;

    const message = this.currentMessage.trim();
    this.currentMessage = '';
    
    // Reset textarea height
    const textarea = this.shadowRoot?.querySelector('.message-input') as HTMLTextAreaElement;
    if (textarea) {
      textarea.value = '';
      textarea.style.height = 'auto';
    }

    // Update empty state immediately
    this.updateEmptyState();

    const request = {
      message,
      conversation_id: this.conversationId,
      request_id: this.generateId(),
      metadata: {}
    };

    try {
      await this.handleStreamingResponse(request);
    } catch (error) {
      console.error('Error sending message:', error);
      // Error status is set by processChunk
    }
  }

  /**
   * Add a message to the chat (utility method for external use)
   */
  addMessage(content: string, type: 'user' | 'assistant' = 'user') {
    if (!this.componentManager) return;

    const component: RichComponent = {
      id: this.generateId(),
      type: 'text',
      lifecycle: 'create',
      data: {
        content,
        role: type
      }
    };

    const update = {
      operation: 'create' as const,
      target_id: component.id,
      component,
      timestamp: new Date().toISOString()
    };

    this.componentManager.processUpdate(update);
    this.updateEmptyState();
  }

  /**
   * Handle streaming response using multiple fallback strategies
   */
  private async handleStreamingResponse(request: any): Promise<void> {
    this.disabled = true;

    try {
      // Strategy 1: Try WebSocket first
      try {
        console.log('[VannaChat] Attempting WebSocket connection...');
        await this.apiClient.sendWebSocketMessage(request, async (chunk) => {
          await this.processChunk(chunk);
        });
        console.log('[VannaChat] WebSocket streaming completed successfully');
        
        // Backend is responsible for final status via StatusBarUpdateComponent
        return;

      } catch (wsError) {
        console.warn('[VannaChat] WebSocket failed, trying SSE...', wsError);
        
        // Strategy 2: Try SSE
        try {
          await this.apiClient.sendSSEMessage(request, async (chunk) => {
            await this.processChunk(chunk);
          });
          console.log('[VannaChat] SSE streaming completed successfully');
          
          // Backend is responsible for final status via StatusBarUpdateComponent
          return;

        } catch (sseError) {
          console.warn('[VannaChat] SSE failed, falling back to polling...', sseError);
          // Continue to polling fallback below
        }
      }

      // Strategy 3: Fallback to polling
      try {
        // Fallback to polling - show user we're retrying
        this.setStatus('working', 'Connection issue, retrying...', 'Using fallback method');
        const response = await this.apiClient.sendPollMessage(request);

        for (const chunk of response.chunks) {
          await this.processChunk(chunk);
        }

        // Backend is responsible for final status via StatusBarUpdateComponent

      } catch (pollError) {
        // Only set error status if polling also fails (connection error)
        this.setStatus('error', 'Connection failed', 'Unable to reach server');
        throw pollError;
      }
    } finally {
      this.disabled = false;
    }
  }

  private async processChunk(chunk: ChatStreamChunk) {
    // Dispatch chunk event for external listeners
    this.dispatchEvent(new CustomEvent('chunk-received', {
      detail: { chunk },
      bubbles: true,
      composed: true
    }));

    console.log('Processing chunk:', chunk); // Debug log

    // Handle rich components via ComponentManager
    if (chunk.rich && this.componentManager) {
      console.log('Processing rich component via ComponentManager:', chunk.rich); // Debug log
      
      // ⭐ NEW CODE: Filter out thinking and tool_execution components if hideThoughts is enabled
      const componentType = chunk.rich.type;
      if (this.hideThoughts && (componentType === 'thinking' || componentType === 'tool_execution')) {
        console.log('🚫 Hiding thought/execution component:', componentType);
        return; // Skip rendering these components
      }
      // ⭐ END OF NEW CODE
      
      if (chunk.rich.id && chunk.rich.lifecycle) {
        // Standard rich component with lifecycle
        const component = chunk.rich as RichComponent;
        const update = {
          operation: chunk.rich.lifecycle as any,
          target_id: chunk.rich.id,
          component: component,
          timestamp: new Date().toISOString()
        };
        this.componentManager.processUpdate(update);
      } else if (chunk.rich.type === 'component_update') {
        // Component update format
        this.componentManager.processUpdate(chunk.rich as any);
      } else {
        // Generic rich component
        const component = chunk.rich as RichComponent;
        const update = {
          operation: 'create' as const,
          target_id: component.id || `component-${Date.now()}`,
          component: component,
          timestamp: new Date().toISOString()
        };
        this.componentManager.processUpdate(update);
      }
      
      return;
    }

    // Update progress tracker for legacy components (keep for backward compatibility)
    const progressTracker = this.getProgressTracker();
    if (progressTracker && 'addStep' in progressTracker) {
      (progressTracker as any).addStep({
        id: `chunk-${Date.now()}`,
        title: this.getChunkTitle(chunk),
        status: 'completed',
        timestamp: chunk.timestamp
      });
    }

    // Handle different chunk types (legacy components)
    const componentType = chunk.rich?.type;
    switch (componentType) {
      case 'text':
        // Text chunks are handled in the main loop
        break;

      case 'thinking':
        // Legacy: Status bar updates now handled by backend via StatusBarUpdateComponent
        // This case is kept for backward compatibility but doesn't update status
        break;

      case 'tool_execution':
        // Legacy: Status bar updates now handled by backend via StatusBarUpdateComponent
        // This case is kept for backward compatibility but doesn't update status
        break;

      case 'error':
        throw new Error(chunk.rich.data?.message || 'Unknown error from agent');

      default:
        // Handle other component types as needed
        console.log('Received chunk:', componentType, chunk.rich);
    }
  }


  private getChunkTitle(chunk: ChatStreamChunk): string {
    const componentType = chunk.rich?.type;
    switch (componentType) {
      case 'text':
        return 'Generating response';
      case 'thinking':
        return 'Thinking';
      case 'tool_execution':
        return `Tool: ${chunk.rich.data?.tool_name || 'Unknown'}`;
      default:
        return `Processing ${componentType || 'component'}`;
    }
  }

  private generateId(): string {
    return `${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;
  }

  /**
   * Update the API base URL and recreate the client
   */
  updateApiBaseUrl(baseUrl: string) {
    this.apiBaseUrl = baseUrl;
    this.ensureApiClient();
  }

  /**
   * Get the API client instance for direct access
   */
  getApiClient(): VannaApiClient {
    if (!this.apiClient) {
      this.ensureApiClient();
    }
    return this.apiClient;
  }

  /**
   * Set custom headers for authentication or other purposes
   */
  setCustomHeaders(headers: Record<string, string>) {
    this.apiClient.setCustomHeaders(headers);
  }

  /**
   * Update empty state visibility based on whether there are components
   */
  private updateEmptyState() {
    const emptyState = this.shadowRoot?.querySelector('#empty-state') as HTMLElement;
    const richContainer = this.shadowRoot?.querySelector('.rich-components-container') as HTMLElement;
    
    if (emptyState && richContainer) {
      // Show empty state if rich container has no children
      const hasContent = richContainer.children.length > 0;
      emptyState.style.display = hasContent ? 'none' : 'flex';
    }
  }

  /**
   * Update scroll indicator based on scroll position
   */
  private updateScrollIndicator() {
    const messagesContainer = this.shadowRoot?.querySelector('.chat-messages');
    if (!messagesContainer) return;
    
    // Check if there's content scrolled above
    const hasScrolledContent = messagesContainer.scrollTop > 10;
    
    // Update scroll indicator class
    messagesContainer.classList.toggle('has-scroll', hasScrolledContent);
  }

  /**
   * Scroll to the top of the last message/component that was added
   * This always scrolls regardless of current scroll position
   */
  scrollToLastMessage() {
    const messagesContainer = this.shadowRoot?.querySelector('.chat-messages');
    const richContainer = this.shadowRoot?.querySelector('.rich-components-container');
    
    if (!messagesContainer || !richContainer) return;

    // Get the last child element (the most recently added component)
    const lastComponent = richContainer.lastElementChild as HTMLElement;
    if (!lastComponent) return;

    // Scroll so the top of the last component is visible
    lastComponent.scrollIntoView({ behavior: 'smooth', block: 'start' });
    
    // Update scroll indicator after scrolling
    setTimeout(() => this.updateScrollIndicator(), 100);
  }

  /**
   * Clear all messages (useful for testing)
   */
  clearMessages() {
    if (this.componentManager) {
      this.componentManager.clear();
    }
    this.updateEmptyState();
    this.requestUpdate();
  }

  /**
   * Add multiple messages at once (useful for testing scrolling)
   */
  addTestMessages(count: number = 10) {
    for (let i = 1; i <= count; i++) {
      setTimeout(() => {
        const type = i % 2 === 0 ? 'assistant' : 'user';
        const content = `This is test message number ${i}. Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.`;
        this.addMessage(content, type);
      }, i * 100); // Stagger the messages to simulate real timing
    }
  }

  render() {
    return html`
      <!-- Minimized icon - shown only when minimized via CSS and allowMinimize is true -->
      ${this.allowMinimize ? html`
        <div class="minimized-icon" @click=${this.restoreWindow}>
          <svg viewBox="0 0 24 24" fill="currentColor" width="32" height="32">
            <path d="M20 2H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h14l4 4V4c0-1.1-.9-2-2-2zm-2 12H6v-2h12v2zm0-3H6V9h12v2zm0-3H6V6h12v2z"/>
          </svg>
        </div>
      ` : ''}

      <!-- Main chat interface -->
      <div class="chat-layout ${this.showProgress ? '' : 'compact'}">
        <div class="chat-main">
          <div class="chat-header">
            <div class="header-top">
              <div class="header-left">
                <div class="chat-avatar" aria-hidden="true">${this.getTitleInitials()}</div>
                <div class="header-text">
                  <h2 class="chat-title">${this.title}</h2>
                </div>
              </div>
              <div class="header-top-actions">
                <div class="window-controls">
                  ${this.allowMinimize ? html`
                    <button
                      class="window-control-btn minimize"
                      @click=${this.minimizeWindow}
                      title="Minimize">
                      <svg viewBox="0 0 24 24" fill="currentColor">
                        <path d="M5 12h14v2H5z"/>
                      </svg>
                    </button>
                  ` : ''}
                  ${this.windowState === 'maximized' ? html`
                    <button
                      class="window-control-btn restore"
                      @click=${this.restoreWindow}
                      title="Restore">
                      <svg viewBox="0 0 24 24" fill="currentColor">
                        <path d="M8 8v2h2V8h6v6h-2v2h4V6H8zm-2 4v8h8v-2H8v-6H6z"/>
                      </svg>
                    </button>
                  ` : html`
                    <button
                      class="window-control-btn maximize"
                      @click=${this.maximizeWindow}
                      title="Maximize">
                      <svg viewBox="0 0 24 24" fill="currentColor">
                        <path d="M5 5v14h14V5H5zm2 2h10v10H7V7z"/>
                      </svg>
                    </button>
                  `}
                </div>
              </div>
            </div>
          </div>

          <div class="chat-messages">
            <!-- Empty state - shown when no components exist -->
            <div class="empty-state" id="empty-state">
              <div class="empty-state-icon">
                <svg viewBox="0 0 24 24" fill="currentColor">
                  <path d="M20 2H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h14l4 4V4c0-1.1-.9-2-2-2zm-2 12H6v-2h12v2zm0-3H6V9h12v2zm0-3H6V6h12v2z"/>
                </svg>
              </div>
              <div class="empty-state-text">Start a conversation</div>
              <div class="empty-state-subtitle">Type your message below to begin chatting</div>
            </div>

            <!-- Rich Components Container - all content renders here via ComponentManager -->
            <div class="rich-components-container"></div>
          </div>

          <div class="chat-input-area">
            <vanna-status-bar
              .status=${this.status}
              .message=${this.statusMessage}
              .detail=${this.statusDetail}
              theme=${this.theme}>
            </vanna-status-bar>

            <div class="chat-input-container">
              <textarea
                class="message-input"
                .placeholder=${this.placeholder}
                .disabled=${this.disabled}
                @input=${this.handleInput}
                @keydown=${this.handleKeyPress}
                rows="1"
              ></textarea>
              <button
                class="send-button"
                type="button"
                aria-label="Send message"
                .disabled=${this.disabled || !this.currentMessage.trim()}
                @click=${this.sendMessage}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/>
                </svg>
              </button>
            </div>
          </div>
        </div>

        ${this.showProgress ? html`
          <div class="sidebar">
            <vanna-progress-tracker theme=${this.theme}></vanna-progress-tracker>
          </div>
        ` : ''}
      </div>
    `;
  }
}