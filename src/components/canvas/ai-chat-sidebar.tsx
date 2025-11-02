'use client';

// 导入Display定义文件以注册所有Display类型
import '@/lib/displays/definitions';

import { LoginForm } from '@/components/auth/login-form';
import { LoginWrapper } from '@/components/auth/login-wrapper';
import { MindMapDisplay } from '@/components/displays/mindmap-display';
import { AIUsageLimitCard } from '@/components/shared/ai-usage-limit-card';
import { GuestUsageIndicator } from '@/components/shared/guest-usage-indicator';
import MarkdownRenderer from '@/components/shared/markdown-renderer';
import { PricingModal } from '@/components/shared/pricing-modal';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Textarea } from '@/components/ui/textarea';
import { useAIUsageLimit } from '@/hooks/use-ai-usage-limit';
import { useCurrentUser } from '@/hooks/use-current-user';
import { useGuestAIUsage } from '@/hooks/use-guest-ai-usage';
import { toast } from '@/hooks/use-toast';
import { useLocalePathname } from '@/i18n/navigation';
import {
  AI_ASSISTANT_MODES,
  type AiAssistantMode,
  DEFAULT_AI_ASSISTANT_MODE,
} from '@/lib/ai-modes';
import { generateAICanvasDescription } from '@/lib/canvas-analyzer';
import type {
  MindElixirData,
  MindElixirNode,
} from '@/lib/displays/mindmap-converter';
import { displayRegistry } from '@/lib/displays/registry';
import {
  createImageThumbnail,
  encodeImageToBase64,
  formatFileSize,
  isValidImageFile,
} from '@/lib/image-utils';
import {
  convertMermaidToExcalidraw,
  countAiGeneratedElements,
  extractExistingMermaidCode,
  hasExistingAiFlowchart,
  removeAiGeneratedElements,
} from '@/lib/mermaid-converter';
import { CaptureUpdateAction } from '@excalidraw/excalidraw';
import type { ExcalidrawImperativeAPI } from '@excalidraw/excalidraw/types';
import {
  AlertCircle,
  ArrowUp,
  Camera,
  Edit,
  MessageCircle,
  Pencil,
  Plus,
  Sparkles,
  User,
  X,
} from 'lucide-react';
import { useEffect, useRef, useState } from 'react';

interface MessageContent {
  type: 'text' | 'image_url';
  text?: string;
  image_url?: {
    url: string;
  };
}

interface Message {
  id: string;
  content: string | MessageContent[];
  role: 'user' | 'assistant';
  timestamp: Date;
  isFlowchart?: boolean;
  mermaidCode?: string;
  isMindmap?: boolean;
  mindmapRaw?: string;
  mindmap?: MindElixirData;
  mindmapMode?: 'replace' | 'extend';
  mindmapDescription?: string;
  mindmapError?: string;
  mindmapMetadata?: Record<string, any>;
  error?: string;
  images?: {
    file: File;
    thumbnail: string;
    base64: string;
  }[];
}

interface AiChatSidebarProps {
  className?: string;
  isOpen: boolean;
  onToggle: () => void;
  excalidrawAPI?: ExcalidrawImperativeAPI | null;
  isAPIReady?: boolean;
  width?: number;
  autoInput?: string;
  shouldAutoGenerate?: boolean;
  onAutoGenerateComplete?: () => void;
  initialMode?: AiAssistantMode;
  initialImage?: {
    base64: string;
    thumbnail?: string;
    filename?: string;
  } | null;
}

const AiChatSidebar: React.FC<AiChatSidebarProps> = ({
  className,
  isOpen,
  onToggle,
  excalidrawAPI,
  isAPIReady = false,
  width = 400,
  autoInput,
  shouldAutoGenerate,
  onAutoGenerateComplete,
  initialMode,
  initialImage,
}) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isStreamingResponse, setIsStreamingResponse] = useState(false);
  const [selectedImages, setSelectedImages] = useState<File[]>([]);
  const [imagePreviewUrls, setImagePreviewUrls] = useState<string[]>([]);
  const [showUsageLimitCard, setShowUsageLimitCard] = useState(false);
  const [dailyLimitUsageInfo, setDailyLimitUsageInfo] = useState<any>(null);
  const [showPricingModal, setShowPricingModal] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [loginCallbackUrl, setLoginCallbackUrl] = useState<string | null>(null);
  const [aiMode, setAiMode] = useState<AiAssistantMode>(
    initialMode ?? DEFAULT_AI_ASSISTANT_MODE
  );
  const hasAutoSentRef = useRef(false);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const streamingMessageIdRef = useRef<string | null>(null);

  const currentUser = useCurrentUser();
  const currentPath = useLocalePathname();
  const { usageData, checkUsageLimit, refreshUsageData } = useAIUsageLimit();
  const {
    canUseAI: canGuestUseAI,
    hasUsedFreeRequest,
    markAsUsed: markGuestAsUsed,
    handleLimitReached: handleGuestLimitReached,
  } = useGuestAIUsage();

  const scrollToBottom = () => {
    if (scrollAreaRef.current) {
      const scrollContainer = scrollAreaRef.current.querySelector(
        '[data-radix-scroll-area-viewport]'
      );
      if (scrollContainer) {
        // 使用 smooth 滚动以获得更好的用户体验
        scrollContainer.scrollTo({
          top: scrollContainer.scrollHeight,
          behavior: 'smooth',
        });
      }
    }
  };

  // Auto-resize textarea based on content with proper line wrapping
  const adjustTextareaHeight = () => {
    if (textareaRef.current) {
      const textarea = textareaRef.current;
      // Reset height to auto to get the correct scrollHeight
      textarea.style.height = 'auto';
      // Calculate new height based on content
      const minHeight = 80;
      const maxHeight = 200;
      const scrollHeight = textarea.scrollHeight;
      const newHeight = Math.min(Math.max(scrollHeight, minHeight), maxHeight);
      textarea.style.height = `${newHeight}px`;
    }
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Initialize textarea height on mount and when input changes
  useEffect(() => {
    adjustTextareaHeight();
  }, [input]);

  useEffect(() => {
    if (initialMode) {
      setAiMode(initialMode);
    }
  }, [initialMode]);

  useEffect(() => {
    if (initialImage) {
      canvasContextRef.current.homepageImage = initialImage;
    } else {
      canvasContextRef.current.homepageImage = undefined;
    }
  }, [initialImage]);

  // Auto-adjust textarea height when input changes
  useEffect(() => {
    adjustTextareaHeight();
  }, [input]);

  // Auto-send function that bypasses input state
  const handleAutoSendMessage = async (messageText: string) => {
    const homepageImage = canvasContextRef.current.homepageImage;
    const trimmed = messageText.trim();

    if ((!trimmed && !homepageImage) || isLoading) {
      return;
    }

    // Check if user is guest and show login modal instead of processing request
    if (!currentUser) {
      // Generate callback URL to preserve current state
      const callbackUrl = `${window.location.pathname}${window.location.search}${window.location.hash}`;
      setLoginCallbackUrl(callbackUrl);
      setShowLoginModal(true);
      return;
    }

    // Logged in user - check subscription limits
    const canUseAI = await checkUsageLimit();
    if (!canUseAI) {
      // Check if it's a daily limit for free users
      if (usageData?.timeFrame === 'daily') {
        console.log('🎯 Daily limit detected - showing PricingModal directly');
        // Set daily limit context and show pricing modal directly
        setDailyLimitUsageInfo({
          timeFrame: 'daily',
          nextResetTime: usageData.nextResetTime,
        });
        setShowPricingModal(true);
      } else {
        setShowUsageLimitCard(true);
      }
      return;
    }

    // Create user message with the provided text
    const mimeMatch = homepageImage?.base64?.match(/^data:(.*?);/);
    const mimeType = mimeMatch?.[1] || 'image/png';
    const filename =
      homepageImage?.filename ||
      `uploaded-image.${mimeType.split('/')[1] || 'png'}`;

    let messageContent: string | MessageContent[] = trimmed;
    let messageImages: { file: File; thumbnail: string; base64: string }[] = [];

    if (homepageImage && aiMode === 'image_to_flowchart') {
      messageImages = [
        {
          file: new File([], filename, { type: mimeType }),
          thumbnail: homepageImage.thumbnail || homepageImage.base64,
          base64: homepageImage.base64,
        },
      ];
      messageContent = [
        ...(trimmed
          ? [
              {
                type: 'text' as const,
                text: trimmed,
              },
            ]
          : []),
        {
          type: 'image_url' as const,
          image_url: {
            url: homepageImage.base64,
          },
        },
      ];
    }

    const userMessage: Message = {
      id: Date.now().toString(),
      content: messageContent,
      role: 'user',
      timestamp: new Date(),
      images: messageImages.length > 0 ? messageImages : undefined,
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    if (homepageImage && aiMode === 'image_to_flowchart') {
      canvasContextRef.current.homepageImage = undefined;
      localStorage.removeItem('flowchart_auto_image');
    }
    setIsLoading(true);
    setIsStreamingResponse(true);

    // Create new abort controller for this request
    abortControllerRef.current = new AbortController();

    try {
      await processAIConversation([
        // Send complete conversation history for context
        ...messages.map((msg) => ({
          role: msg.role,
          content: typeof msg.content === 'string' ? msg.content : msg.content,
        })),
        {
          role: 'user',
          content: userMessage.content,
        },
      ]);

      // 移除访客使用标记，改为在流程图成功生成后计费
      // if (!currentUser) {
      //   markGuestAsUsed();
      // }
    } catch (error) {
      console.error('Error sending auto message:', error);
      // Handle errors similar to handleSendMessage
      if (error instanceof Error && error.name === 'AbortError') {
        return;
      }

      if (error instanceof Error && (error as any).isGuestLimit) {
        if (!currentUser) {
          handleGuestLimitReached();
          setShowLoginModal(true);
          return;
        }
      }

      if (error instanceof Error && (error as any).isDailyLimit) {
        if (currentUser) {
          console.log(
            '✅ Showing PricingModal with daily limit context for registered user'
          );
          setDailyLimitUsageInfo((error as any).usageInfo);
          setShowPricingModal(true);
          return;
        }
      }

      const errorMessage: Message = {
        id: (Date.now() + 2).toString(),
        content:
          'Sorry, I encountered an error while processing your request. Please try again.',
        role: 'assistant',
        timestamp: new Date(),
        error: error instanceof Error ? error.message : 'Unknown error',
      };

      setMessages((prev) => [...prev, errorMessage]);

      toast({
        title: 'Error',
        description: 'Failed to process your message. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
      abortControllerRef.current = null;
      setIsStreamingResponse(false);
      streamingMessageIdRef.current = null;
    }
  };

  // Handle auto-generation from homepage - ONLY ONCE
  useEffect(() => {
    const hasHomepageImage = !!canvasContextRef.current.homepageImage;
    const normalizedAutoInput = autoInput ?? '';

    if (
      shouldAutoGenerate &&
      (normalizedAutoInput || hasHomepageImage) &&
      isOpen &&
      isAPIReady &&
      !hasAutoSentRef.current
    ) {
      hasAutoSentRef.current = true; // Immediately mark as sent to prevent any duplicates
      setInput(normalizedAutoInput);

      console.log(
        '🚀 Auto-sending message now that API is ready:',
        normalizedAutoInput.substring(0, 50) + '...',
        {
          shouldAutoGenerate,
          hasAutoInput: Boolean(normalizedAutoInput),
          hasHomepageImage,
          isOpen,
          isAPIReady,
          hasAutoSent: hasAutoSentRef.current,
        }
      );

      // Small delay to ensure component is fully loaded
      setTimeout(async () => {
        try {
          await handleAutoSendMessage(normalizedAutoInput);

          // 🔧 只有在自动发送成功后才清除localStorage
          localStorage.removeItem('flowchart_auto_generate');
          localStorage.removeItem('flowchart_auto_input');
          localStorage.removeItem('flowchart_auto_mode');
          console.log('✅ Auto-generation completed, localStorage cleared');

          onAutoGenerateComplete?.();
        } catch (error) {
          console.error('❌ Auto-generation failed:', error);
          // 如果失败，不清除localStorage，允许用户重试
        }
      }, 500);
    }
  }, [shouldAutoGenerate, autoInput, isOpen, isAPIReady]);

  // 🔧 备用机制：如果API初始化很慢，提供一个超时重试
  useEffect(() => {
    const hasHomepageImage = !!canvasContextRef.current.homepageImage;
    const normalizedAutoInput = autoInput ?? '';

    if (
      shouldAutoGenerate &&
      (normalizedAutoInput || hasHomepageImage) &&
      isOpen &&
      !hasAutoSentRef.current
    ) {
      // 如果5秒后API还没准备好，尝试强制发送
      const timeoutId = setTimeout(() => {
        if (!hasAutoSentRef.current) {
          console.log(
            '⏰ API initialization timeout, attempting force send...'
          );
          if (isAPIReady) {
            // API现在准备好了，正常发送
            hasAutoSentRef.current = true;
            setInput(normalizedAutoInput);
            setTimeout(async () => {
              try {
                await handleAutoSendMessage(normalizedAutoInput);
                localStorage.removeItem('flowchart_auto_generate');
                localStorage.removeItem('flowchart_auto_input');
                localStorage.removeItem('flowchart_auto_mode');
                localStorage.removeItem('flowchart_auto_image');
                console.log('✅ Force auto-generation completed');
                onAutoGenerateComplete?.();
              } catch (error) {
                console.error('❌ Force auto-generation failed:', error);
              }
            }, 500);
          } else {
            console.warn(
              '⚠️ ExcalidrawAPI still not ready after 5s, user will need to manually send'
            );
          }
        }
      }, 5000);

      return () => clearTimeout(timeoutId);
    }
  }, [shouldAutoGenerate, autoInput, isOpen, isAPIReady]);

  // Clean up abort controller on unmount
  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      // Clean up image preview URLs
      imagePreviewUrls.forEach((url) => URL.revokeObjectURL(url));
    };
  }, []);

  // Handle image selection
  const handleImageSelect = async (files: FileList | null) => {
    if (!files) return;

    const validFiles: File[] = [];
    const previewUrls: string[] = [];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];

      if (!isValidImageFile(file)) {
        toast({
          title: 'Invalid file',
          description: `${file.name} is not a valid image file or is too large (max 5MB)`,
          variant: 'destructive',
        });
        continue;
      }

      validFiles.push(file);
      previewUrls.push(URL.createObjectURL(file));
    }

    if (validFiles.length > 0) {
      setSelectedImages((prev) => [...prev, ...validFiles]);
      setImagePreviewUrls((prev) => [...prev, ...previewUrls]);
    }
  };

  // Remove selected image
  const removeImage = (index: number) => {
    setSelectedImages((prev) => prev.filter((_, i) => i !== index));
    setImagePreviewUrls((prev) => {
      const urlToRevoke = prev[index];
      URL.revokeObjectURL(urlToRevoke);
      return prev.filter((_, i) => i !== index);
    });
  };

  // Handle camera button click
  const handleCameraClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  interface CanvasNodeSnapshot {
    id: string;
    type: string;
    text?: string;
    position: { x: number; y: number };
    size: { width: number; height: number };
    aiGenerated?: boolean;
  }

  interface CanvasEdgeSnapshot {
    id: string;
    type: string;
    fromElement?: string | null;
    toElement?: string | null;
    label?: string;
    aiGenerated?: boolean;
  }

  const getCanvasState = () => {
    if (!excalidrawAPI) return null;

    try {
      const elements = excalidrawAPI.getSceneElements();
      const appState = excalidrawAPI.getAppState();
      const files = excalidrawAPI.getFiles();

      const nodes: CanvasNodeSnapshot[] = [];
      const edges: CanvasEdgeSnapshot[] = [];

      elements.forEach((element) => {
        const baseNode = {
          id: element.id,
          type: element.type,
          position: { x: element.x, y: element.y },
          size: { width: element.width ?? 0, height: element.height ?? 0 },
          aiGenerated: Boolean(element.customData?.aiGenerated),
        };

        if (element.type === 'arrow') {
          edges.push({
            id: element.id,
            type: element.type,
            fromElement:
              'startBinding' in element
                ? element.startBinding?.elementId
                : undefined,
            toElement:
              'endBinding' in element
                ? element.endBinding?.elementId
                : undefined,
            label: 'text' in element ? (element as any).text : undefined,
            aiGenerated: Boolean(element.customData?.aiGenerated),
          });
        } else {
          nodes.push({
            ...baseNode,
            text: 'text' in element ? (element as any).text : undefined,
          });
        }
      });

      // 构建精简的画布状态，只包含AI需要的关键信息
      const canvasState = {
        nodes,
        edges,
        appState: {
          viewBackgroundColor: appState.viewBackgroundColor,
          scrollX: appState.scrollX,
          scrollY: appState.scrollY,
          zoom: appState.zoom,
          theme: appState.theme,
          gridSize: appState.gridSize,
          // 当前选中的元素
          selectedElementIds: appState.selectedElementIds,
        },

        // 文件数量统计（不传递实际文件数据以节省带宽）
        filesCount: Object.keys(files).length,

        metadata: {
          elementsCount: elements.length,
          hasImages: Object.keys(files).length > 0,
          canvasSize: {
            width: appState.width,
            height: appState.height,
          },
        },

        // AI流程图上下文信息
        existingMermaid: extractExistingMermaidCode([...elements]),
        hasAiFlowchart: hasExistingAiFlowchart([...elements]),
        description: generateAICanvasDescription([...elements]),
      };

      return canvasState;
    } catch (error) {
      console.warn('Failed to get canvas state:', error);
      return null;
    }
  };

  const canvasContextRef = useRef<{
    lastMermaid?: {
      code: string;
      generatedAt: number;
    };
    lastMindmap?: {
      raw: string;
      parsed: MindElixirData;
      generatedAt: number;
      mode: 'replace' | 'extend';
      description?: string;
      metadata?: Record<string, any>;
    };
    homepageImage?: {
      base64: string;
      thumbnail?: string;
      filename?: string;
    };
  }>({});

  const addFlowchartToCanvas = async (
    mermaidCode: string,
    mode: 'replace' | 'extend' = 'replace'
  ) => {
    if (!excalidrawAPI) {
      console.error('❌ ExcalidrawAPI not available');
      toast({
        title: 'Canvas not ready',
        description:
          'Please wait for the canvas to load before generating flowcharts.',
        variant: 'destructive',
      });
      return;
    }

    console.log('✅ Adding flowchart to canvas with mode:', mode);

    try {
      // Convert Mermaid to Excalidraw elements
      const result = await convertMermaidToExcalidraw(mermaidCode);

      if (!result.success) {
        const conversionError = new Error(
          result.error || 'Failed to convert flowchart'
        );
        (conversionError as any).details = result.details;
        (conversionError as any).mermaid = mermaidCode;
        throw conversionError;
      }

      if (!result.elements) {
        throw new Error('No elements generated from flowchart');
      }

      // Get current elements
      const currentElements = [...excalidrawAPI.getSceneElements()];
      const aiElementsCount = countAiGeneratedElements(currentElements);

      // 覆盖式落地：移除旧的 AI 元素，再添加最新生成的元素
      const elementsWithoutAi = removeAiGeneratedElements(currentElements);
      const newElements = [...elementsWithoutAi, ...result.elements];

      // Update the scene with new elements (capture for undo/redo)
      excalidrawAPI.updateScene({
        elements: newElements,
        captureUpdate: CaptureUpdateAction.IMMEDIATELY,
      });

      // Zoom to fit the new flowchart elements
      excalidrawAPI.scrollToContent(result.elements, {
        fitToContent: true,
        animate: true,
      });

      // Show appropriate toast message based on mode and context
      const toastTitle =
        aiElementsCount > 0 ? 'Flowchart updated!' : 'Flowchart added!';
      const toastDescription =
        aiElementsCount > 0
          ? 'Previous AI flowchart replaced with updated version.'
          : 'Your AI-generated flowchart has been added to the canvas.';

      canvasContextRef.current.lastMermaid = {
        code: mermaidCode,
        generatedAt: Date.now(),
      };

      // ✅ 只有流程图成功渲染后才计费
      try {
        await fetch('/api/ai/usage/record', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            type: 'flowchart_generation',
            success: true,
            metadata: {
              mode: mode,
              mermaidLength: mermaidCode.length,
              elementCount: result.elements?.length || 0,
              // 添加图片模式标识，这样计费记录能区分来源
              isImageMode: aiMode === 'image_to_flowchart',
              sourceMode: aiMode,
            },
          }),
        });
      } catch (recordError) {
        console.error('Failed to record AI usage:', recordError);
      }

      toast({
        title: toastTitle,
        description: toastDescription,
      });
    } catch (error) {
      console.error('Error adding flowchart to canvas:', error);
      const errorMessage =
        error instanceof Error
          ? error.message
          : 'An unexpected error occurred.';
      const errorDetails =
        error instanceof Error && (error as any).details
          ? (error as any).details
          : null;
      const mermaidSnippet =
        error instanceof Error && (error as any).mermaid
          ? (error as any).mermaid
          : undefined;

      const combinedDescription = errorDetails
        ? `${errorMessage}${errorDetails.startsWith('(') ? ' ' : ': '}${errorDetails}`
        : errorMessage;

      toast({
        title: 'Failed to add flowchart',
        description: combinedDescription,
        variant: 'destructive',
      });

      setMessages((prev) => [
        ...prev,
        {
          id: `flowchart-error-${Date.now()}`,
          role: 'assistant',
          content:
            'The flowchart could not be rendered. Please try again or ask me to simplify the diagram.',
          timestamp: new Date(),
        },
      ]);
    }
  };

  const countMindmapNodes = (mindmap: MindElixirData | null): number => {
    if (!mindmap?.nodeData) {
      return 0;
    }

    const traverse = (node: MindElixirNode | null | undefined): number => {
      if (!node) return 0;
      const children: MindElixirNode[] = Array.isArray(node.children)
        ? node.children
        : [];
      return (
        1 + children.reduce<number>((sum, child) => sum + traverse(child), 0)
      );
    };

    return traverse(mindmap.nodeData);
  };

  const recordMindmapUsage = async (
    metadata: Record<string, any>,
    success = true
  ) => {
    try {
      await fetch('/api/ai/usage/record', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          type: 'mindmap_generation',
          success,
          metadata: {
            ...metadata,
            sourceMode: aiMode,
          },
        }),
      });
    } catch (error) {
      console.error('Failed to record mind map usage:', error);
    }
  };

  const handleRegenerate = async () => {
    if (messages.length === 0 || isLoading) return;

    // Get the last user message
    const lastUserMessage = messages.filter((msg) => msg.role === 'user').pop();

    if (!lastUserMessage) return;

    // Check if user is guest and show login modal instead of processing request
    if (!currentUser) {
      // Generate callback URL to preserve current state
      const callbackUrl = `${window.location.pathname}${window.location.search}${window.location.hash}`;
      setLoginCallbackUrl(callbackUrl);
      setShowLoginModal(true);
      return;
    }

    const canUseAI = await checkUsageLimit();
    if (!canUseAI) {
      if (usageData?.timeFrame === 'daily') {
        setDailyLimitUsageInfo({
          timeFrame: 'daily',
          nextResetTime: usageData.nextResetTime,
        });
        setShowPricingModal(true);
      } else {
        setShowUsageLimitCard(true);
      }
      return;
    }

    setIsLoading(true);
    setIsStreamingResponse(true);

    // Create new abort controller for this request
    abortControllerRef.current = new AbortController();

    try {
      // Use the last user message content for regeneration
      const conversationPayload: any[] = [
        ...messages.slice(0, -1).map((msg) => ({
          role: msg.role,
          content: typeof msg.content === 'string' ? msg.content : msg.content,
        })),
        {
          role: 'user',
          content: lastUserMessage.content,
        },
      ];

      await processAIConversation(conversationPayload);

      // 移除即时计费逻辑，改为在流程图成功生成后计费
      // if (!currentUser) {
      //   markGuestAsUsed();
      // }
    } catch (error) {
      console.error('Error regenerating message:', error);

      if (error instanceof Error && error.name === 'AbortError') {
        return;
      }

      if (error instanceof Error && (error as any).isGuestLimit) {
        if (!currentUser) {
          handleGuestLimitReached();
          setShowLoginModal(true);
          return;
        }
      }

      if (error instanceof Error && (error as any).isDailyLimit) {
        if (currentUser) {
          setDailyLimitUsageInfo((error as any).usageInfo);
          setShowPricingModal(true);
          return;
        }
      }

      const errorMessage: Message = {
        id: (Date.now() + 2).toString(),
        content:
          'Sorry, I encountered an error while regenerating your request. Please try again.',
        role: 'assistant',
        timestamp: new Date(),
        error: error instanceof Error ? error.message : 'Unknown error',
      };

      setMessages((prev) => [...prev, errorMessage]);

      toast({
        title: 'Error',
        description: 'Failed to regenerate your message. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
      abortControllerRef.current = null;
      setIsStreamingResponse(false);
      streamingMessageIdRef.current = null;
    }
  };

  const handleSendMessage = async () => {
    if (
      (selectedImages.length === 0 &&
        !input.trim() &&
        !canvasContextRef.current.homepageImage) ||
      isLoading
    ) {
      return;
    }

    // Check if user is guest and show login modal instead of processing request
    if (!currentUser) {
      // Generate callback URL to preserve current state
      const callbackUrl = `${window.location.pathname}${window.location.search}${window.location.hash}`;
      setLoginCallbackUrl(callbackUrl);
      setShowLoginModal(true);
      return;
    }

    // Logged in user - check subscription limits
    const canUseAI = await checkUsageLimit();
    if (!canUseAI) {
      // Check if it's a daily limit for free users
      if (usageData?.timeFrame === 'daily') {
        console.log('🎯 Daily limit detected - showing PricingModal directly');
        // Set daily limit context and show pricing modal directly
        setDailyLimitUsageInfo({
          timeFrame: 'daily',
          nextResetTime: usageData.nextResetTime,
        });
        setShowPricingModal(true);
      } else {
        setShowUsageLimitCard(true);
      }
      return;
    }

    // Prepare message content
    let messageContent: string | MessageContent[] = input.trim();
    let messageImages: { file: File; thumbnail: string; base64: string }[] = [];

    const homepageImage = canvasContextRef.current.homepageImage;

    if (selectedImages.length > 0) {
      // Convert images to base64 and create message content array
      const imageData = await Promise.all(
        selectedImages.map(async (file) => {
          const base64 = await encodeImageToBase64(file);
          const thumbnail = await createImageThumbnail(file);
          return { file, thumbnail, base64 };
        })
      );

      messageImages = imageData;

      // Create multimodal content
      const contentArray: MessageContent[] = [];

      if (input.trim()) {
        contentArray.push({
          type: 'text',
          text: input.trim(),
        });
      }

      for (const { base64 } of imageData) {
        contentArray.push({
          type: 'image_url',
          image_url: {
            url: base64,
          },
        });
      }

      messageContent = contentArray;
    } else if (homepageImage && aiMode === 'image_to_flowchart') {
      const mimeMatch = homepageImage.base64.match(/^data:(.*?);/);
      const mimeType = mimeMatch?.[1] || 'image/png';
      const filename =
        homepageImage.filename ||
        `uploaded-image.${mimeType.split('/')[1] || 'png'}`;
      messageImages = [
        {
          file: new File([], filename, { type: mimeType }),
          thumbnail: homepageImage.thumbnail || homepageImage.base64,
          base64: homepageImage.base64,
        },
      ];

      messageContent = [
        ...(input.trim()
          ? [
              {
                type: 'text' as const,
                text: input.trim(),
              },
            ]
          : []),
        {
          type: 'image_url' as const,
          image_url: {
            url: homepageImage.base64,
          },
        },
      ];
    }

    const userMessageId = Date.now().toString();
    const userMessage: Message = {
      id: userMessageId,
      content: messageContent,
      role: 'user',
      timestamp: new Date(),
      images: messageImages.length > 0 ? messageImages : undefined,
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setSelectedImages([]);
    setImagePreviewUrls((prev) => {
      prev.forEach((url) => URL.revokeObjectURL(url));
      return [];
    });
    if (homepageImage && aiMode === 'image_to_flowchart') {
      canvasContextRef.current.homepageImage = undefined;
      localStorage.removeItem('flowchart_auto_image');
    }
    setIsLoading(true);
    setIsStreamingResponse(true);

    // Create new abort controller for this request
    abortControllerRef.current = new AbortController();

    try {
      const conversationPayload: any[] = [
        ...messages.map((msg) => ({
          role: msg.role,
          content: typeof msg.content === 'string' ? msg.content : msg.content,
        })),
        {
          role: 'user',
          content: userMessage.content,
        },
      ];

      await processAIConversation(conversationPayload);

      // 移除访客使用标记，改为在流程图成功生成后计费
      // if (!currentUser) {
      //   markGuestAsUsed();
      // }
    } catch (error) {
      console.error('Error sending message:', error);

      if (error instanceof Error && error.name === 'AbortError') {
        // Request was cancelled, don't show error
        return;
      }

      // Check if this is a guest usage limit error
      if (error instanceof Error && (error as any).isGuestLimit) {
        // Handle guest limit reached
        if (!currentUser) {
          handleGuestLimitReached();
          setShowLoginModal(true);
          return;
        }
      }

      // Check if this is a daily limit error for registered users
      if (error instanceof Error && (error as any).isDailyLimit) {
        // Handle daily limit reached for registered users
        if (currentUser) {
          console.log(
            '✅ Showing PricingModal with daily limit context for registered user'
          );
          setDailyLimitUsageInfo((error as any).usageInfo);
          setShowPricingModal(true);
          return;
        }
      }

      const errorMessage: Message = {
        id: (Date.now() + 2).toString(),
        content:
          'Sorry, I encountered an error while processing your request. Please try again.',
        role: 'assistant',
        timestamp: new Date(),
        error: error instanceof Error ? error.message : 'Unknown error',
      };

      setMessages((prev) => [...prev, errorMessage]);

      toast({
        title: 'Error',
        description: 'Failed to process your message. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
      abortControllerRef.current = null;
      setIsStreamingResponse(false);
      streamingMessageIdRef.current = null;
    }
  };

  // 处理AI对话的核心函数，支持工具调用的递归处理
  const processAIConversation = async (conversationMessages: any[]) => {
    const canvasSnapshot = getCanvasState();
    const inferredMode =
      aiMode === 'text_to_mindmap'
        ? canvasContextRef.current.lastMindmap
          ? 'extend'
          : 'replace'
        : canvasSnapshot?.hasAiFlowchart
          ? 'extend'
          : 'replace';
    const lastMindmapContext = canvasContextRef.current.lastMindmap
      ? {
          raw: canvasContextRef.current.lastMindmap.raw,
          generatedAt: canvasContextRef.current.lastMindmap.generatedAt,
          description: canvasContextRef.current.lastMindmap.description,
          mode: canvasContextRef.current.lastMindmap.mode,
          metadata: canvasContextRef.current.lastMindmap.metadata,
        }
      : undefined;

    // 根据模式选择API端点
    const apiEndpoint =
      aiMode === 'text_to_mindmap'
        ? '/api/ai/chat/mindmap'
        : '/api/ai/chat/flowchart';

    const response = await fetch(apiEndpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        messages: conversationMessages,
        aiContext: {
          canvasSnapshot,
          lastMermaid: canvasContextRef.current.lastMermaid,
          lastMindmap: lastMindmapContext,
          requestedMode: inferredMode,
          mode: aiMode,
        },
      }),
      signal: abortControllerRef.current?.signal,
    });

    if (!response.ok) {
      if (response.status === 429) {
        // Handle rate limit errors specifically
        const errorData = await response.json().catch(() => ({}));
        if (errorData.isGuest) {
          const guestError = new Error(
            errorData.message ||
              'Guest users can only use AI once per month. Please sign up for more requests.'
          );
          (guestError as any).isGuestLimit = true;
          throw guestError;
        }

        if (errorData.usageInfo?.timeFrame === 'daily') {
          console.log('🔄 Detected daily limit error:', errorData.usageInfo);
          const dailyLimitError = new Error(
            errorData.message || 'You have reached your daily AI usage limit.'
          );
          (dailyLimitError as any).isDailyLimit = true;
          (dailyLimitError as any).usageInfo = errorData.usageInfo;
          throw dailyLimitError;
        }

        throw new Error(
          errorData.message || 'You have reached your AI usage limit.'
        );
      }
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const reader = response.body?.getReader();
    if (!reader) {
      throw new Error('No response body');
    }

    const textDecoder = new TextDecoder();
    const streamingMessageId = `assistant_${Date.now()}_${Math.random()
      .toString(36)
      .slice(2)}`;
    let messageCreated = false;
    let accumulatedContent = '';
    let isFlowchartGenerated = false;
    let mermaidCode = '';
    let isMindmapGenerated = false;
    let mindmapData = '';
    let mindmapMode: 'replace' | 'extend' = 'replace';
    let mindmapDescription = '';
    let parsedMindmap: MindElixirData | null = null;
    let mindmapParseError: string | null = null;
    let mindmapMetadata: Record<string, any> | null = null;
    let flowchartMode: 'replace' | 'extend' = 'replace';
    const pendingToolCalls: any[] = [];

    const ensureStreamingMessage = () => {
      if (messageCreated) return;
      messageCreated = true;
      streamingMessageIdRef.current = streamingMessageId;
      const timestamp = new Date();
      setMessages((prev) => [
        ...prev,
        {
          id: streamingMessageId,
          content: '',
          role: 'assistant',
          timestamp,
          isFlowchart: false,
        },
      ]);
    };

    const updateStreamingMessage = (updater: (prev: Message) => Message) => {
      setMessages((prev) =>
        prev.map((msg) => (msg.id === streamingMessageId ? updater(msg) : msg))
      );
    };

    const setStreamingContent = (content: string) => {
      ensureStreamingMessage();
      accumulatedContent = content;
      updateStreamingMessage((msg) => ({
        ...msg,
        content,
      }));
    };

    const appendStreamingContent = (delta: string) => {
      if (!delta) return;
      const nextContent = accumulatedContent + delta;
      setStreamingContent(nextContent);
    };

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      const chunk = textDecoder.decode(value);
      const lines = chunk.split('\n');

      for (const line of lines) {
        if (!line.startsWith('data: ')) continue;

        try {
          const data = JSON.parse(line.slice(6));

          if (data.type === 'text' || data.type === 'content') {
            appendStreamingContent(data.content ?? '');
          } else if (data.type === 'tool-call') {
            if (data.toolName === 'generate_flowchart') {
              mermaidCode = data.args.mermaid_code;
              flowchartMode = data.args.mode || 'replace';
              isFlowchartGenerated = true;

              const modeText =
                flowchartMode === 'extend'
                  ? 'Extending flowchart...'
                  : 'Generating flowchart...';
              appendStreamingContent(`\n\n🎨 ${modeText}`);
            } else if (data.toolName === 'generate_mindmap') {
              mindmapData = data.args.mindmap_data;
              mindmapMode = data.args.mode || 'replace';
              mindmapDescription = data.args.description || '';
              isMindmapGenerated = true;

              const modeText =
                mindmapMode === 'extend'
                  ? 'Extending mind map...'
                  : 'Generating mind map...';
              appendStreamingContent(`\n\n🧠 ${modeText}`);
            } else if (data.toolName === 'get_canvas_state') {
              appendStreamingContent('\n\n🔍 Analyzing current canvas...');
              pendingToolCalls.push({
                toolCallId: data.toolCallId,
                toolName: data.toolName,
                args: data.args,
              });
            }
          } else if (data.type === 'tool-result') {
            console.log('Tool result:', data.result);
          } else if (data.type === 'finish') {
            if (!accumulatedContent.trim() && data.content) {
              setStreamingContent(data.content);
            }
          } else if (data.type === 'done' || data === '[DONE]') {
            break;
          }
        } catch (error) {
          console.warn('Failed to parse SSE data:', line);
        }
      }
    }

    if (pendingToolCalls.length > 0) {
      if (messageCreated) {
        setMessages((prev) =>
          prev.filter((message) => message.id !== streamingMessageId)
        );
      }
      streamingMessageIdRef.current = null;

      const updatedMessages = [
        ...conversationMessages,
        {
          role: 'assistant',
          content: accumulatedContent,
          tool_calls: pendingToolCalls.map((tc) => ({
            id: tc.toolCallId,
            type: 'function',
            function: {
              name: tc.toolName,
              arguments: JSON.stringify(tc.args),
            },
          })),
        },
      ];

      return await processAIConversation(updatedMessages);
    }

    if (isMindmapGenerated && mindmapData) {
      const mindmapDisplay = displayRegistry.get('mindmap');
      if (mindmapDisplay?.parseAIResponse) {
        const parseResult = mindmapDisplay.parseAIResponse(mindmapData);

        if (parseResult?.data) {
          parsedMindmap = parseResult.data as MindElixirData;
          mindmapMetadata = parseResult.metadata ?? null;
          mindmapParseError = parseResult.error ?? null;
        } else {
          mindmapParseError =
            parseResult?.error ?? 'Unable to interpret AI mind map output.';
        }
      } else {
        mindmapParseError = 'Mind map parser is not registered.';
      }
    }

    if (messageCreated) {
      updateStreamingMessage((msg) => ({
        ...msg,
        content: accumulatedContent,
        isFlowchart: isFlowchartGenerated,
        mermaidCode: isFlowchartGenerated ? mermaidCode : undefined,
        isMindmap: isMindmapGenerated,
        mindmapRaw: isMindmapGenerated ? mindmapData : undefined,
        mindmap: parsedMindmap ?? undefined,
        mindmapMode: isMindmapGenerated ? mindmapMode : undefined,
        mindmapDescription: mindmapDescription || undefined,
        mindmapError: mindmapParseError ?? undefined,
        mindmapMetadata: mindmapMetadata ?? undefined,
        timestamp: new Date(),
      }));
    } else if (accumulatedContent.trim().length > 0) {
      streamingMessageIdRef.current = null;
      setMessages((prev) => [
        ...prev,
        {
          id: `assistant_${Date.now()}_${Math.random().toString(36).slice(2)}`,
          content: accumulatedContent,
          role: 'assistant',
          timestamp: new Date(),
          isFlowchart: isFlowchartGenerated,
          mermaidCode: isFlowchartGenerated ? mermaidCode : undefined,
          isMindmap: isMindmapGenerated,
          mindmapRaw: isMindmapGenerated ? mindmapData : undefined,
          mindmap: parsedMindmap ?? undefined,
          mindmapMode: isMindmapGenerated ? mindmapMode : undefined,
          mindmapDescription: mindmapDescription || undefined,
          mindmapError: mindmapParseError ?? undefined,
          mindmapMetadata: mindmapMetadata ?? undefined,
        },
      ]);
    }

    if (
      !accumulatedContent.trim() &&
      !isFlowchartGenerated &&
      !isMindmapGenerated &&
      messageCreated
    ) {
      setMessages((prev) =>
        prev.filter((message) => message.id !== streamingMessageId)
      );
    }

    if (isFlowchartGenerated && mermaidCode) {
      console.log('🎨 Attempting to add flowchart to canvas:', {
        mermaidCode: mermaidCode.substring(0, 100) + '...',
        flowchartMode,
        excalidrawAPIReady: !!excalidrawAPI,
      });
      await addFlowchartToCanvas(mermaidCode, flowchartMode);
    }

    // TODO: 添加思维导图到Canvas的逻辑
    if (isMindmapGenerated && mindmapData) {
      if (parsedMindmap) {
        canvasContextRef.current.lastMindmap = {
          raw: mindmapData,
          parsed: parsedMindmap,
          generatedAt: Date.now(),
          mode: mindmapMode,
          description: mindmapDescription || undefined,
          metadata: mindmapMetadata ?? undefined,
        };

        toast({
          title: mindmapMode === 'extend' ? '思维导图已更新' : '思维导图已生成',
          description: mindmapDescription?.length
            ? mindmapDescription
            : '可在对话中预览最新的思维导图。',
        });

        recordMindmapUsage({
          mode: mindmapMode,
          nodeCount:
            mindmapMetadata?.nodeCount ?? countMindmapNodes(parsedMindmap),
          branchCount:
            mindmapMetadata?.branchCount ??
            parsedMindmap.nodeData.children?.length ??
            0,
          fallbackUsed: mindmapMetadata?.fallbackUsed ?? false,
          descriptionLength: mindmapDescription?.length ?? 0,
          rawLength: mindmapMetadata?.rawLength ?? mindmapData.length,
        });
      } else if (mindmapParseError) {
        toast({
          title: '思维导图解析失败',
          description: mindmapParseError,
          variant: 'destructive',
        });

        recordMindmapUsage(
          {
            mode: mindmapMode,
            error: mindmapParseError,
            rawLength: mindmapData.length,
            fallbackUsed: mindmapMetadata?.fallbackUsed ?? false,
          },
          false
        );
      } else {
        recordMindmapUsage(
          {
            mode: mindmapMode,
            error: 'Mind map data missing after generation',
            rawLength: mindmapData.length,
          },
          false
        );
      }
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleStopGeneration = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      setIsLoading(false);
      setIsStreamingResponse(false);
      streamingMessageIdRef.current = null;
    }
  };

  const handleNewConversation = () => {
    // 如果正在加载中，先停止当前对话
    if (isLoading) {
      handleStopGeneration();
    }

    // 清空对话历史
    setMessages([]);
    setInput('');
    setIsStreamingResponse(false);
    streamingMessageIdRef.current = null;
    canvasContextRef.current.lastMindmap = undefined;

    // 显示提示信息
    toast({
      title: 'New conversation created',
      description:
        'Chat history cleared. You can start a fresh AI conversation.',
    });
  };

  const renderFormattedText = (text: string) => {
    return <MarkdownRenderer content={text} />;
  };

  const renderMessageContent = (message: Message) => {
    if (message.error) {
      return (
        <div className="flex items-start gap-2 text-red-600">
          <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
          <div>
            <p className="text-sm font-medium">Error occurred</p>
            <p className="text-xs opacity-75">{message.error}</p>
          </div>
        </div>
      );
    }

    return (
      <div className="space-y-2">
        <div className="leading-relaxed">
          {typeof message.content === 'string'
            ? renderFormattedText(message.content)
            : message.content.map((content, index) => (
                <div key={index}>
                  {content.type === 'text' && content.text && (
                    <div>{renderFormattedText(content.text)}</div>
                  )}
                  {content.type === 'image_url' && content.image_url && (
                    <div className="mt-2">
                      <img
                        src={content.image_url.url}
                        alt="Uploaded content"
                        className="max-w-full h-auto rounded-lg border border-gray-200"
                        style={{ maxHeight: '200px' }}
                      />
                    </div>
                  )}
                </div>
              ))}
        </div>
        {message.isMindmap && (
          <div className="rounded-lg border border-blue-100 bg-blue-50/40 p-3">
            <div className="flex items-center justify-between text-xs text-blue-600">
              <span className="font-medium">AI 思维导图预览</span>
              {message.mindmapMode && (
                <Badge
                  variant="secondary"
                  className="bg-blue-100 text-blue-700 hover:bg-blue-100"
                >
                  {message.mindmapMode === 'extend' ? '增量模式' : '覆盖模式'}
                </Badge>
              )}
            </div>
            {message.mindmap ? (
              <div className="mt-2 h-64 overflow-hidden rounded-md border border-blue-100 bg-white">
                <MindMapDisplay data={message.mindmap} className="h-full" />
              </div>
            ) : (
              <p className="mt-2 text-xs text-red-500">
                {message.mindmapError ||
                  '生成的思维导图数据无法解析，请尝试重新生成或调整输入描述。'}
              </p>
            )}
            {message.mindmapDescription && (
              <p className="mt-2 text-xs text-blue-700 leading-relaxed">
                {message.mindmapDescription}
              </p>
            )}
            {message.mindmapMetadata && (
              <p className="mt-2 text-[11px] text-blue-500">
                节点数：{message.mindmapMetadata.nodeCount ?? '—'} · 主分支：
                {message.mindmapMetadata.branchCount ?? '—'}
                {message.mindmapMetadata.fallbackUsed
                  ? ' · 使用文本兜底解析'
                  : ''}
              </p>
            )}
            {message.mindmapRaw && (
              <details className="mt-2 rounded-md border border-blue-100 bg-white/70 p-2 text-[11px] text-blue-600">
                <summary className="cursor-pointer text-xs font-medium text-blue-700">
                  查看原始 JSON
                </summary>
                <pre className="mt-2 max-h-48 overflow-auto whitespace-pre-wrap break-all text-[10px] text-blue-600">
                  {message.mindmapRaw}
                </pre>
              </details>
            )}
          </div>
        )}
      </div>
    );
  };

  return (
    <div
      className={`fixed top-0 right-0 h-full bg-white shadow-lg transition-transform duration-300 ease-in-out z-40 ${
        isOpen ? 'translate-x-0' : 'translate-x-full'
      }`}
      style={{ width: `${width}px` }}
    >
      <div className="flex h-full flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <h2 className="text-base font-medium text-gray-900">ViLearning</h2>
            <Button
              onClick={handleNewConversation}
              variant="outline"
              size="sm"
              className="h-8 px-3 text-gray-600 border-gray-300 hover:border-gray-400 hover:bg-gray-50 rounded-lg text-xs font-medium transition-colors"
              disabled={isLoading}
            >
              New Conversation
            </Button>
          </div>
          <Button
            onClick={onToggle}
            variant="ghost"
            size="sm"
            className="h-8 px-3 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg"
          >
            X
          </Button>
        </div>

        {/* Guest Usage Indicator */}
        {!currentUser && (
          <div className="px-4 pb-4">
            <GuestUsageIndicator />
          </div>
        )}

        {/* Messages */}
        <div className="flex-1 overflow-hidden relative">
          <ScrollArea ref={scrollAreaRef} className="h-full w-full">
            <div className="space-y-4 px-4 pb-4 min-h-0">
              {messages.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  <p className="text-sm">试着让我生成流程图或思维导图吧！</p>
                  <p className="text-xs mt-1 opacity-75">
                    我可以帮你把想法结构化成图形，支持文本或图片输入。
                  </p>
                </div>
              )}

              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`${message.role === 'user' ? 'flex justify-end' : ''}`}
                >
                  {message.role === 'user' ? (
                    <Card className="max-w-[280px] p-3 bg-gray-100 text-gray-900 border-gray-100">
                      <div className="text-sm leading-relaxed space-y-2">
                        {typeof message.content === 'string' ? (
                          <p>{message.content}</p>
                        ) : (
                          message.content.map((content, index) => (
                            <div key={index}>
                              {content.type === 'text' && content.text && (
                                <p>{content.text}</p>
                              )}
                              {content.type === 'image_url' &&
                                content.image_url && (
                                  <div className="mt-2">
                                    <img
                                      src={content.image_url.url}
                                      alt="Uploaded content"
                                      className="max-w-full h-auto rounded-lg border border-gray-200"
                                      style={{ maxHeight: '150px' }}
                                    />
                                  </div>
                                )}
                            </div>
                          ))
                        )}
                      </div>
                    </Card>
                  ) : (
                    <div className="max-w-full">
                      <div className="flex-1">
                        {renderMessageContent(message)}
                      </div>
                    </div>
                  )}
                </div>
              ))}

              {/* Typing indicator before streaming starts */}
              {isStreamingResponse && !streamingMessageIdRef.current && (
                <div className="max-w-full">
                  <div className="flex items-center gap-1 py-2">
                    <div className="h-2 w-2 bg-gray-400 rounded-full animate-bounce" />
                    <div
                      className="h-2 w-2 bg-gray-400 rounded-full animate-bounce"
                      style={{ animationDelay: '0.1s' }}
                    />
                    <div
                      className="h-2 w-2 bg-gray-400 rounded-full animate-bounce"
                      style={{ animationDelay: '0.2s' }}
                    />
                  </div>
                </div>
              )}
            </div>
          </ScrollArea>
        </div>

        {/* Input */}
        <div className="border-t border-gray-200">
          {/* Image previews */}
          {selectedImages.length > 0 && (
            <div className="mb-3 mx-4 mt-4">
              <div className="flex flex-wrap gap-2">
                {selectedImages.map((file, index) => (
                  <div key={index} className="relative">
                    <img
                      src={imagePreviewUrls[index]}
                      alt={`Preview ${index + 1}`}
                      className="w-16 h-16 object-cover rounded-lg border border-gray-200"
                    />
                    <button
                      type="button"
                      onClick={() => removeImage(index)}
                      className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center text-xs hover:bg-red-600 transition-colors"
                      disabled={isLoading}
                    >
                      <X className="w-3 h-3" />
                    </button>
                    <div className="absolute bottom-0 left-0 right-0 bg-black/50 text-white text-xs px-1 py-0.5 rounded-b-lg truncate">
                      {file.name}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Hidden file input */}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            multiple
            onChange={(e) => handleImageSelect(e.target.files)}
            className="hidden"
          />

          {/* Mode Switch */}
          <div className="px-4 pb-3 pt-4">
            <div className="flex items-center gap-2 rounded-lg bg-gray-50 p-2 border border-gray-200">
              <span className="text-xs text-gray-600 mr-2">Mode:</span>
              {(Object.keys(AI_ASSISTANT_MODES) as AiAssistantMode[]).map(
                (mode) => {
                  const isActive = aiMode === mode;
                  const { label } = AI_ASSISTANT_MODES[mode];
                  return (
                    <Button
                      key={mode}
                      type="button"
                      size="sm"
                      variant={isActive ? 'default' : 'ghost'}
                      className={
                        isActive
                          ? 'h-8 px-4'
                          : 'h-8 px-4 text-gray-600 hover:text-gray-900'
                      }
                      onClick={() => setAiMode(mode)}
                    >
                      <span className="text-xs font-medium">{label}</span>
                    </Button>
                  );
                }
              )}
            </div>
          </div>

          <div className="px-4 pb-4">
            <Textarea
              ref={textareaRef}
              placeholder="Describe your flowchart..."
              value={input}
              onChange={(e) => {
                setInput(e.target.value);
                // Adjust height after state update
                setTimeout(() => adjustTextareaHeight(), 0);
              }}
              onKeyDown={handleKeyPress}
              disabled={isLoading}
              className="min-h-[80px] max-h-[200px] resize-none border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent shadow-sm bg-white placeholder:text-gray-500 text-gray-900 text-base px-4 py-3 leading-6 overflow-y-auto transition-all duration-200"
              style={{
                height: '80px',
                wordWrap: 'break-word',
                whiteSpace: 'pre-wrap',
              }}
            />
            <p className="text-xs text-gray-400 mt-2 ml-1">
              Press Enter to send
            </p>
          </div>

          <div className="px-4 pb-6">
            <div className="flex gap-3">
              <Button
                onClick={() => {
                  handleCameraClick();
                }}
                variant="outline"
                size="default"
                className="flex-1 h-11 text-sm font-medium border-gray-200 hover:border-gray-300 transition-colors"
                disabled={isLoading}
              >
                Upload Image
              </Button>
              <Button
                onClick={handleSendMessage}
                size="default"
                className="flex-1 h-11 text-sm font-medium bg-blue-600 hover:bg-blue-700 transition-colors"
                disabled={
                  (!input.trim() && selectedImages.length === 0) || isLoading
                }
              >
                Send
              </Button>
              <Button
                onClick={handleRegenerate}
                size="default"
                className="flex-1 h-11 text-sm font-medium bg-green-500 border-green-500 text-white hover:bg-green-600 hover:border-green-600 transition-colors"
                disabled={messages.length === 0 || isLoading}
              >
                Regenerate
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Login Modal for Guest Users - Direct login modal */}
      <Dialog open={showLoginModal} onOpenChange={setShowLoginModal}>
        <DialogContent className="sm:max-w-[400px] p-0">
          <DialogHeader className="hidden">
            <DialogTitle>Sign In</DialogTitle>
          </DialogHeader>
          <LoginForm
            callbackUrl={loginCallbackUrl || currentPath}
            className="border-none"
          />
        </DialogContent>
      </Dialog>

      {/* AI Usage Limit Card */}
      {showUsageLimitCard && usageData && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="relative">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowUsageLimitCard(false)}
              className="absolute -top-2 -right-2 z-10 bg-white shadow-md hover:bg-gray-50"
            >
              <X className="h-4 w-4" />
            </Button>
            <AIUsageLimitCard
              usedCount={usageData.usedCount}
              totalLimit={usageData.totalLimit}
              currentPlan={usageData.subscriptionStatus}
              onUpgrade={() => {
                setShowUsageLimitCard(false);
                setShowPricingModal(true);
              }}
              onLearnMore={() => {
                setShowUsageLimitCard(false);
                setShowPricingModal(true);
              }}
            />
          </div>
        </div>
      )}

      {/* Pricing Modal */}
      <PricingModal
        isOpen={showPricingModal}
        onClose={() => {
          setShowPricingModal(false);
          setDailyLimitUsageInfo(null); // Clear limit context
          refreshUsageData(); // Refresh usage data when modal closes
        }}
        limitContext={
          dailyLimitUsageInfo
            ? {
                type: 'daily',
                nextResetTime: dailyLimitUsageInfo.nextResetTime
                  ? new Date(dailyLimitUsageInfo.nextResetTime)
                  : undefined,
                message: "You've used your free AI request for today",
              }
            : undefined
        }
      />
    </div>
  );
};

export default AiChatSidebar;
