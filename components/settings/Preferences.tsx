'use client';

import { useEffect, useState } from 'react';
import { useTheme } from 'next-themes';
import { Moon, Sun, Key } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

const AGENT_TIER_KEY = 'mcp-default-agent-tier';

type AgentTier = 'auto' | 'speed' | 'balanced' | 'quality';

const tierOptions: { value: AgentTier; label: string; description: string }[] =
  [
    { value: 'auto', label: 'Auto', description: 'Let the system decide' },
    { value: 'speed', label: 'Speed', description: 'Fast, cheap, simple tasks' },
    {
      value: 'balanced',
      label: 'Balanced',
      description: 'Middle tier, moderate reasoning',
    },
    {
      value: 'quality',
      label: 'Quality',
      description: 'Deep reasoning, synthesis',
    },
  ];

export function Preferences() {
  const { theme, setTheme } = useTheme();
  const [agentTier, setAgentTierState] = useState<AgentTier>('auto');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const stored = localStorage.getItem(AGENT_TIER_KEY) as AgentTier | null;
    if (stored && tierOptions.some((t) => t.value === stored)) {
      setAgentTierState(stored);
    }
  }, []);

  function handleTierChange(value: string) {
    const tier = value as AgentTier;
    setAgentTierState(tier);
    localStorage.setItem(AGENT_TIER_KEY, tier);
  }

  return (
    <div className="space-y-6 max-w-lg">
      {/* Agent tier */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium">Default Agent Tier</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-xs text-muted-foreground">
            Controls the LLM tier used for synthesis and extraction steps when
            a command doesn&apos;t specify one.
          </p>
          <Select value={agentTier} onValueChange={handleTierChange}>
            <SelectTrigger className="w-48">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {tierOptions.map((t) => (
                <SelectItem key={t.value} value={t.value}>
                  <span className="font-medium">{t.label}</span>
                  <span className="ml-2 text-muted-foreground text-xs">
                    — {t.description}
                  </span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <p className="text-xs text-muted-foreground/70">
            Stored locally. Backend persistence coming in a future phase.
          </p>
        </CardContent>
      </Card>

      {/* Theme */}
      {mounted && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Appearance</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex gap-2">
              <Button
                variant={theme === 'light' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setTheme('light')}
                className="gap-1.5"
              >
                <Sun className="h-3.5 w-3.5" />
                Light
              </Button>
              <Button
                variant={theme === 'dark' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setTheme('dark')}
                className="gap-1.5"
              >
                <Moon className="h-3.5 w-3.5" />
                Dark
              </Button>
              <Button
                variant={theme === 'system' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setTheme('system')}
              >
                System
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* BYOK placeholder */}
      <Card className="opacity-60">
        <CardHeader>
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <Key className="h-4 w-4" />
            API Key Management
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-xs text-muted-foreground">
            Bring your own API keys (BYOK) — coming in a future phase.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
