'use client';

import { useSession } from '@/hooks/use-session';
import { authClient } from '@/lib/auth-client';
import {
  handlePendingFlowchart,
  initPendingDataCleanup,
} from '@/lib/flowchart-callback-handler';
import { Loader2Icon } from 'lucide-react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';

export default function FlowchartCallbackPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const session = useSession();
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // 设置页面标题
  useEffect(() => {
    document.title = '正在创建 ViLearning 空间化画布... - ViLearning';

    // 设置meta description
    const metaDescription = document.querySelector('meta[name="description"]');
    if (metaDescription) {
      metaDescription.setAttribute(
        'content',
        '正在为你准备 ViLearning 空间化学习画布，请稍候...'
      );
    }
  }, []);

  // 初始化清理过期数据
  useEffect(() => {
    initPendingDataCleanup();
  }, []);

  useEffect(() => {
    // 检查session状态
    if (session === undefined) {
      // session还在加载中
      setIsLoading(true);
      return;
    }

    setIsLoading(false);

    const stateId = searchParams.get('state');

    if (!stateId) {
      console.error('No state parameter found in callback');
      router.push('/canvas');
      return;
    }

    if (session?.user) {
      // 用户已登录，处理待创建的流程图
      setIsCreating(true);
      handlePendingFlowchart(stateId, session.user.id, router)
        .then((success) => {
          if (!success) {
            setError('生成空间化画布失败，请稍后再试。');
            setTimeout(() => {
              router.push('/canvas');
            }, 3000);
          }
        })
        .catch((error) => {
          console.error('Error handling pending flowchart:', error);
          setError('生成空间化画布失败，请稍后再试。');
          setTimeout(() => {
            router.push('/canvas');
          }, 3000);
        })
        .finally(() => {
          setIsCreating(false);
        });
    } else {
      // 用户未登录，重定向到登录页面并传递callbackUrl
      const currentUrl = encodeURIComponent(window.location.href);
      const loginUrl = `/auth/login?callbackUrl=${currentUrl}`;
      router.push(loginUrl);
    }
  }, [session, router, searchParams]);

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-white dark:bg-gray-950">
      {isCreating ? (
        <div className="flex flex-col items-center gap-4">
          <Loader2Icon className="animate-spin h-12 w-12 text-primary" />
          <h2 className="text-xl font-semibold">
            正在生成你的 ViLearning 空间化画布...
          </h2>
          <p className="text-muted-foreground">
            请稍候，我们正在准备上下文与 Display
          </p>
        </div>
      ) : error ? (
        <div className="flex flex-col items-center gap-4 max-w-md text-center">
          <div className="h-12 w-12 rounded-full bg-red-100 flex items-center justify-center">
            <span className="text-red-600 text-xl">⚠️</span>
          </div>
          <h2 className="text-xl font-semibold text-red-600">
            生成画布时出现问题
          </h2>
          <p className="text-muted-foreground">{error}</p>
          <p className="text-sm text-muted-foreground">
            正在跳转回 ViLearning 画布...
          </p>
        </div>
      ) : (
        <div className="flex flex-col items-center gap-4">
          <Loader2Icon className="animate-spin h-12 w-12 text-primary" />
          <h2 className="text-xl font-semibold">
            准备你的 ViLearning 空间化画布...
          </h2>
          <p className="text-muted-foreground">
            {isLoading ? '正在验证登录状态...' : '处理中，请稍候...'}
          </p>
        </div>
      )}
    </div>
  );
}
